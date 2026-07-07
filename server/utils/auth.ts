import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { getCookie, setCookie, deleteCookie, createError } from 'h3'
import type { H3Event } from 'h3'
import { usePrisma } from './prisma'

// ---------- Session/JWT ----------
//
// 手写 JWT 认证（不依赖 next-auth / @sidebase/nuxt-auth 的 authjs provider）。
// 原因：next-auth v4 在 Cloudflare Workers edge runtime 有兼容性风险
// （crypto.randomBytes / Buffer 等 Node-only API），而 jose + bcryptjs 全部
// 基于 WebCrypto / 纯 JS，在 Workers 上稳定。
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
}

const COOKIE_NAME = 'sg_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSecret(): Uint8Array {
  const raw = useRuntimeConfig().authSecret || 'dev-only-secret-please-change'
  return new TextEncoder().encode(raw)
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
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

/** 清除会话 cookie。 */
export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
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
