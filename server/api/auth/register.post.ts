// 注册：邮箱+密码 → 哈希 → 入库（赠 20 Credits）→ 自动签发会话 cookie。
// 成功返回当前用户（不含 passwordHash）。
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string; name?: string }>(event)

  const email = (body?.email ?? '').trim().toLowerCase()
  const password = body?.password ?? ''
  const name = (body?.name ?? '').trim() || null

  // 基础校验
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_email' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'password_too_short' })
  }

  const prisma = usePrisma(event)

  // 邮箱唯一性
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (exists) {
    throw createError({ statusCode: 409, statusMessage: 'email_taken' })
  }

  const passwordHash = await hashPassword(password)
  const created = await prisma.user.create({
    data: { email, passwordHash, name, credits: 20 },
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
    },
  })

  await setSessionCookie(event, {
    ...created,
    lastPracticeAt: created.lastPracticeAt ? created.lastPracticeAt.toISOString() : null,
  })

  return {
    ...created,
    lastPracticeAt: created.lastPracticeAt ? created.lastPracticeAt.toISOString() : null,
  }
})
