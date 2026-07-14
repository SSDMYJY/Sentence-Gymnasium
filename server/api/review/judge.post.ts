// POST /api/review/judge - Judge a review answer, update reviewLevel and nextReviewAt
import { scoreToQuality, computeNextReview } from '../../utils/review'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const body = await readBody<{ attemptId: string; score: number }>(event)
  const { attemptId, score } = body

  if (!attemptId || score === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'attemptId and score are required' })
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      question: {
        select: {
          id: true,
          category: true,
          questionText: true,
          correctAnswer: true,
        },
      },
    },
  })

  if (!attempt || attempt.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Attempt not found' })
  }

  const quality = scoreToQuality(score)
  const { nextLevel, nextReviewAt } = computeNextReview(attempt.reviewLevel, quality)

  const updated = await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      reviewLevel: nextLevel,
      nextReviewAt: nextLevel === 6 ? null : nextReviewAt,
    },
  })

  return {
    attemptId: updated.id,
    reviewLevel: updated.reviewLevel,
    nextReviewAt: updated.nextReviewAt,
    mastered: nextLevel === 6,
  }
})
