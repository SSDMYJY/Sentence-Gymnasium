// Practice 判题接口
// 1. 校验登录
// 2. 从数据库取出题目（含正确答案）
// 3. 调用 AI 判题
// 4. 存入 Attempt 表，更新用户统计 + streak
import { judgeAnswer } from '../../utils/ai'
import { computeNewStreak, checkLevelUp } from '../../utils/auth'
import type { LanguagePair, UiLang } from '../../types/ai'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const body = await readBody<{ questionId?: string; userAnswer?: string; uiLang?: string }>(event)
  const { questionId, userAnswer, uiLang } = body

  if (!questionId || !userAnswer?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'questionId and userAnswer are required' })
  }

  const question = await prisma.generatedQuestion.findUnique({
    where: { id: questionId },
  })

  if (!question) {
    throw createError({ statusCode: 404, statusMessage: 'Question not found' })
  }

  if (question.category !== 'practice') {
    throw createError({ statusCode: 400, statusMessage: 'Question is not a practice question' })
  }

  const result = await judgeAnswer(event, {
    category: 'practice',
    questionText: question.questionText,
    correctAnswer: question.correctAnswer,
    userAnswer: userAnswer.trim(),
    languagePair: (question.languagePair ?? 'ja-en') as LanguagePair,
    uiLang: (uiLang ?? 'zh-hans') as UiLang,
  })

  const now = new Date()
  const streakResult = computeNewStreak(user.streak, user.lastPracticeAt ? new Date(user.lastPracticeAt) : null, now)
  const newTotalAttempts = user.totalAttempts + 1
  const levelResult = checkLevelUp(user.level, newTotalAttempts)

  const [attempt, updatedUser] = await prisma.$transaction([
    prisma.attempt.create({
      data: {
        userId: user.id,
        questionId: question.id,
        userAnswer: userAnswer.trim(),
        isCorrect: result.isCorrect,
        feedback: JSON.stringify({
          score: result.score,
          verdict: result.verdict,
          feedback: result.feedback,
          suggestion: result.suggestion ?? null,
          errors: result.errors ?? [],
          correctAnswer: question.correctAnswer,
        }),
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        totalAttempts: { increment: 1 },
        correctAttempts: result.isCorrect ? { increment: 1 } : undefined,
        streak: streakResult.streak,
        lastPracticeAt: now,
        level: levelResult.newLevel,
        credits: levelResult.bonusCredits > 0 ? { increment: levelResult.bonusCredits } : undefined,
      },
    }),
  ])

  await prisma.generatedQuestion.update({
    where: { id: question.id },
    data: { usedCount: { increment: 1 } },
  })

  return {
    attemptId: attempt.id,
    isCorrect: result.isCorrect,
    score: result.score,
    verdict: result.verdict,
    feedback: result.feedback,
    suggestion: result.suggestion ?? null,
    errors: result.errors ?? [],
    correctAnswer: question.correctAnswer,
    totalAttempts: updatedUser.totalAttempts,
    correctAttempts: updatedUser.correctAttempts,
    streak: updatedUser.streak,
    streakIncreased: streakResult.isNewDay,
    level: updatedUser.level,
    credits: updatedUser.credits,
    levelUp: levelResult.levelUp,
  }
})
