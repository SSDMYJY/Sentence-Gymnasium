// 临时诊断脚本：验证生产环境会话认证全链路。
// 用本地 .env 的 AUTH_SECRET 签发 JWT，携带 cookie 请求生产 /api/auth/session，
// 判断生产环境是否使用同一 secret、cookie 是否生效。
// 不打印任何密钥明文。用完删除。
import { SignJWT } from 'jose'
import { PrismaClient } from '@prisma/client'

const BASE = process.env.DIAG_BASE || 'https://sentencegym.waterspo.top'

// 读取本地 .env 中的 AUTH_SECRET
import { readFileSync } from 'node:fs'
function loadDotEnv() {
  const content = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}

const env = await loadDotEnv()
const secret = env.AUTH_SECRET || ''
console.log('AUTH_SECRET configured:', secret ? 'yes (len=' + secret.length + ')' : 'NO')

const prisma = new PrismaClient()
// 取一个真实用户作为测试对象
const user = await prisma.user.findFirst({ select: { id: true, email: true } })
if (!user) {
  console.log('DB 中无用户，跳过')
  process.exit(1)
}
console.log('测试用户:', user.email, 'id=', user.id.slice(0, 8) + '...')

// 1) 用本地 secret 签发 JWT
function makeToken(expSec) {
  return new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${expSec}s`)
    .sign(new TextEncoder().encode(secret))
}

const token = await makeToken(60 * 60 * 24 * 7)
const cookie = `sg_session=${token}`

// 2) 请求生产 session 端点
console.log('\n[1] 生产 /api/auth/session（携带本地 secret 签发的 cookie）:')
const r1 = await fetch(`${BASE}/api/auth/session`, { headers: { cookie } })
console.log('  status =', r1.status)
const t1 = await r1.text()
console.log('  body   =', t1.slice(0, 300))

// 3) 用错误 secret 签发，验证会被拒绝（对照实验）
const badToken = await makeToken(60)
// 用错误 secret 重新签发
const bad = await new SignJWT({ email: user.email })
  .setProtectedHeader({ alg: 'HS256' })
  .setSubject(user.id)
  .setIssuedAt()
  .setExpirationTime('3600s')
  .sign(new TextEncoder().encode('wrong-secret-' + Math.random()))
console.log('\n[2] 生产 /api/auth/session（错误 secret 的 cookie，应返回 null）:')
const r2 = await fetch(`${BASE}/api/auth/session`, { headers: { cookie: `sg_session=${bad}` } })
console.log('  status =', r2.status, ' body =', (await r2.text()).slice(0, 200))

// 4) 直接请求受保护端点
console.log('\n[3] 生产 /api/practice/generate（正确 cookie，应 400 而非 401）:')
const r3 = await fetch(`${BASE}/api/practice/generate`, {
  method: 'POST',
  headers: { cookie, 'content-type': 'application/json' },
  body: JSON.stringify({ languagePair: 'en-zh', difficulty: 'daily', scenario: 'travel' }),
})
console.log('  status =', r3.status, ' body =', (await r3.text()).slice(0, 300))

await prisma.$disconnect()
