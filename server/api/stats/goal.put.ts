// PUT /api/stats/goal - Update daily goal
const VALID_GOALS = [3, 5, 10, 15]

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const body = await readBody<{ dailyGoal: number }>(event)
  const { dailyGoal } = body

  if (!VALID_GOALS.includes(dailyGoal)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid daily goal. Must be 3, 5, 10, or 15' })
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { dailyGoal },
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

  return {
    ...updated,
    lastPracticeAt: updated.lastPracticeAt ? updated.lastPracticeAt.toISOString() : null,
  }
})
