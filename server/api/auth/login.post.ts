// 登录：校验邮箱+密码 → 签发会话 cookie。失败抛 401。
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string; turnstileToken?: string }>(event)

  const turnstileToken = (body?.turnstileToken ?? '').trim()
  if (!turnstileToken) {
    throw createError({ statusCode: 400, statusMessage: 'turnstile_required' })
  }

  const turnstileValidation = await verifyTurnstileToken(turnstileToken, event)
  if (!turnstileValidation?.success) {
    throw createError({ statusCode: 400, statusMessage: 'turnstile_failed' })
  }

  const email = (body?.email ?? '').trim().toLowerCase()
  const password = body?.password ?? ''
  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_credentials' })
  }

  const prisma = usePrisma(event)

  function isPrismaValidationError(e: any) {
    return e && (e.name === 'PrismaClientValidationError' || (typeof e.message === 'string' && e.message.includes('Unknown field')))
  }

  const baseSelect: any = {
    id: true,
    email: true,
    name: true,
    credits: true,
    totalAttempts: true,
    correctAttempts: true,
    streak: true,
    lastPracticeAt: true,
    dailyGoal: true,
    passwordHash: true,
  }

  let user: any = null
  try {
    user = await prisma.user.findUnique({
      where: { email },
      select: { ...baseSelect, level: true, experience: true },
    })
  } catch (err: any) {
    if (isPrismaValidationError(err)) {
      user = await prisma.user.findUnique({ where: { email }, select: baseSelect })
    } else {
      throw err
    }
  }

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
    level: typeof user.level === 'number' ? user.level : 1,
    dailyGoal: typeof user.dailyGoal === 'number' ? user.dailyGoal : 5,
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
    level: typeof user.level === 'number' ? user.level : 1,
    dailyGoal: typeof user.dailyGoal === 'number' ? user.dailyGoal : 5,
  }
})
