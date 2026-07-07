// 登录：校验邮箱+密码 → 签发会话 cookie。失败抛 401。
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)

  const email = (body?.email ?? '').trim().toLowerCase()
  const password = body?.password ?? ''
  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_credentials' })
  }

  const prisma = usePrisma(event)
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'invalid_credentials' })
  }

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'invalid_credentials' })
  }

  await setSessionCookie(event, {
    id: user.id,
    email: user.email,
    name: user.name,
    credits: user.credits,
    totalAttempts: user.totalAttempts,
    correctAttempts: user.correctAttempts,
    streak: user.streak,
    lastPracticeAt: user.lastPracticeAt ? user.lastPracticeAt.toISOString() : null,
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    credits: user.credits,
    totalAttempts: user.totalAttempts,
    correctAttempts: user.correctAttempts,
    streak: user.streak,
    lastPracticeAt: user.lastPracticeAt ? user.lastPracticeAt.toISOString() : null,
  }
})
