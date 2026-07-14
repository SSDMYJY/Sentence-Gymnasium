// GET /api/review/next - Fetch up to 5 items due for review
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const now = new Date()

  // Items where nextReviewAt <= now OR (reviewLevel = 0 AND isCorrect = false)
  const items = await prisma.attempt.findMany({
    where: {
      userId: user.id,
      OR: [
        { nextReviewAt: { lte: now } },
        { reviewLevel: 0, isCorrect: false },
      ],
    },
    include: {
      question: {
        select: {
          id: true,
          category: true,
          questionText: true,
          correctAnswer: true,
          languagePair: true,
          grammarTag: true,
          extraData: true,
        },
      },
    },
    orderBy: { nextReviewAt: 'asc' },
    take: 5,
  })

  return { items }
})
