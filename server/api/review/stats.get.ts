// GET /api/review/stats - Return review statistics
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const now = new Date()

  const [dueCount, overdueCount, masteredCount, totalReviewable] = await Promise.all([
    // Due: nextReviewAt <= now OR (reviewLevel = 0 AND isCorrect = false)
    prisma.attempt.count({
      where: {
        userId: user.id,
        OR: [
          { nextReviewAt: { lte: now } },
          { reviewLevel: 0, isCorrect: false },
        ],
      },
    }),
    // Overdue: nextReviewAt < now - 1 day
    prisma.attempt.count({
      where: {
        userId: user.id,
        nextReviewAt: { lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    }),
    // Mastered: reviewLevel = 6
    prisma.attempt.count({
      where: {
        userId: user.id,
        reviewLevel: 6,
      },
    }),
    // Total reviewable: reviewLevel > 0 AND reviewLevel < 6
    prisma.attempt.count({
      where: {
        userId: user.id,
        reviewLevel: { gt: 0, lt: 6 },
      },
    }),
  ])

  return { dueCount, overdueCount, masteredCount, totalReviewable }
})
