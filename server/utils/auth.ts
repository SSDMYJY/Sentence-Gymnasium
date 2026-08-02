import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { getCookie, setCookie, deleteCookie, createError, getRequestProtocol } from 'h3'
import type { H3Event } from 'h3'
import { usePrisma } from './prisma'

// ---------- Session/JWT ----------
//
// 手写 JWT 认证（不依赖 next-auth / @sidebase/nuxt-auth 的 authjs provider）。
// 原因：jose + bcryptjs 全部基于 WebCrypto / 纯 JS，跨 Node.js / 边缘运行时稳定，
// 且无第三方认证服务依赖。
//
// Cookie 名固定为 `sg_session`，httpOnly + SameSite=Lax + 7 天过期。
// JWT 载荷只放 { sub: userId, email }，不携带敏感信息。

export interface SessionUser {
  id: string
  email: string
  name: string | null
  credits: number
  totalAttempts: number
  correctAttempts: number
  streak: number
  lastPracticeAt: string | null
  level: number
  dailyGoal: number
}

const COOKIE_NAME = 'sg_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/** 已警告过默认密钥（避免刷屏） */
let warnedDefaultSecret = false

function getSecret(): Uint8Array {
  const raw = useRuntimeConfig().authSecret || ''
  if (!raw && !warnedDefaultSecret) {
    warnedDefaultSecret = true
    // 未配置 AUTH_SECRET：会话签/验使用公开的兜底密钥，存在被伪造的风险。
    // 保持值不变（避免每次冷启动生成随机密钥导致既有会话全部失效），仅提示配置。
    console.warn('[auth] AUTH_SECRET 未配置，使用不安全的默认密钥，请在生产环境设置 AUTH_SECRET')
  }
  return new TextEncoder().encode(raw || 'dev-only-secret-please-change')
}

/**
 * 当前请求是否为 HTTPS。
 * 用真实请求协议（优先读取反向代理的 x-forwarded-proto）而非 NODE_ENV 决定 Secure 标志：
 * 边缘/云函数部署下 origin 看到的 event.url 常为内部 http 地址，若固定按 production 加
 * Secure 或忽略代理协议头，用户经 http 访问时浏览器会拒绝存储该 cookie → 后续请求全部 401。
 */
function isHttpsRequest(event: H3Event): boolean {
  return getRequestProtocol(event, { xForwardedProto: true }) === 'https'
}

/** 签发 JWT 并通过 Set-Cookie 写入响应。 */
export async function setSessionCookie(event: H3Event, user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    email: user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(getSecret())

  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttpsRequest(event),
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

/** 清除会话 cookie（属性与写入时一致，浏览器才会真正删除）。 */
export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, COOKIE_NAME, {
    path: '/',
    secure: isHttpsRequest(event),
    sameSite: 'lax',
  })
}

/** 读取并验证 JWT，返回 userId / email 或 null。 */
export async function readSession(event: H3Event): Promise<{ userId: string; email: string } | null> {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    })
    const userId = payload.sub
    const email = payload.email as string | undefined
    if (!userId || !email) return null
    return { userId, email }
  } catch {
    return null
  }
}

/**
 * 取当前登录用户（含 credits、streak 等字段）。未登录返回 null。
 * 单次请求内缓存到 event.context._sessionUser 避免重复查库。
 */
export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  const ctx = event.context as any
  if (ctx._sessionUser === undefined) {
    const session = await readSession(event)
    if (!session) {
      ctx._sessionUser = null
    } else {
      const prisma = usePrisma(event)
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          email: true,
          name: true,
          credits: true,
          totalAttempts: true,
          correctAttempts: true,
          streak: true,
          lastPracticeAt: true,
          level: true,
          dailyGoal: true,
        },
      })
      if (user) {
        ctx._sessionUser = {
          ...user,
          lastPracticeAt: user.lastPracticeAt ? user.lastPracticeAt.toISOString() : null,
        }
      } else {
        ctx._sessionUser = null
      }
    }
  }
  return ctx._sessionUser as SessionUser | null
}

/** 要求登录，否则抛 401。返回当前用户。 */
export async function requireAuth(event: H3Event): Promise<SessionUser> {
  const user = await getSessionUser(event)
  if (!user) {
    // 服务端留痕：区分「未携带 cookie」与「cookie 存在但 JWT 失效/过期」，
    // 便于排查"明明登录了却 401"的会话问题。日志不泄露 token 内容。
    const hasCookie = Boolean(getCookie(event, COOKIE_NAME))
    console.warn(`[auth] 401 Unauthorized: ${event.path} cookiePresent=${hasCookie}`)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

// ---------- Password hashing ----------

const BCRYPT_ROUNDS = 10

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// ---------- Streak 计算 ----------

/**
 * 根据上次练习时间计算新的连续打卡天数。
 * - 从未练习过：streak = 1
 * - 今天已练习：streak 不变
 * - 昨天练习过：streak + 1
 * - 更早：streak 重置为 1
 */
export function computeNewStreak(currentStreak: number, lastPracticeAt: Date | null, now: Date = new Date()): {
  streak: number
  isNewDay: boolean
} {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (!lastPracticeAt) {
    return { streak: 1, isNewDay: true }
  }

  const last = new Date(lastPracticeAt.getFullYear(), lastPracticeAt.getMonth(), lastPracticeAt.getDate())
  const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return { streak: currentStreak, isNewDay: false }
  }
  if (diffDays === 1) {
    return { streak: currentStreak + 1, isNewDay: true }
  }
  return { streak: 1, isNewDay: true }
}

// ---------- Level / XP ----------

/** 每次练习获得的经验值 */
export const XP_PER_ATTEMPT = 10
/** 每升一级所需经验值 */
export const XP_PER_LEVEL = 500
/** 升级奖励能量 */
export const LEVEL_UP_BONUS_CREDITS = 5

/** 根据总尝试次数计算等级 */
export function computeLevel(totalAttempts: number): number {
  const xp = totalAttempts * XP_PER_ATTEMPT
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

/**
 * 检查是否升级，若升级则返回 { levelUp: true, newLevel, credits }。
 * 否则返回 { levelUp: false }。
 */
export function checkLevelUp(
  oldLevel: number,
  newTotalAttempts: number,
): { levelUp: boolean; newLevel: number; bonusCredits: number } {
  const newLevel = computeLevel(newTotalAttempts)
  if (newLevel > oldLevel) {
    return { levelUp: true, newLevel, bonusCredits: LEVEL_UP_BONUS_CREDITS }
  }
  return { levelUp: false, newLevel, bonusCredits: 0 }
}
