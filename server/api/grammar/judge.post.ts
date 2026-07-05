// Grammar 判题接口
// 1. 校验登录
// 2. 从数据库取出题目（含正确答案）
// 3. 调用 AI 判题
// 4. 存入 Attempt 表，更新用户统计
import { judgeAnswer } from '../../utils/ai'
import type { GrammarTag } from '../../types/ai'

type QuestionType = 'fill-blank' | 'choice' | 'error-correction'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const body = await readBody<{ questionId?: string; userAnswer?: string }>(event)
  const { questionId, userAnswer } = body

  if (!questionId || !userAnswer?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'questionId and userAnswer are required' })
  }

  // 取出题目
  const question = await prisma.generatedQuestion.findUnique({
    where: { id: questionId },
  })

  if (!question) {
    throw createError({ statusCode: 404, statusMessage: 'Question not found' })
  }

  if (question.category !== 'grammar') {
    throw createError({ statusCode: 400, statusMessage: 'Question is not a grammar question' })
  }

  // 从 extraData 解析题型
  const extraData = question.extraData ? JSON.parse(question.extraData) : {}
  const questionType = (extraData.questionType ?? 'fill-blank') as QuestionType

  // 调用 AI 判题
  const result = await judgeAnswer(event, {
    category: 'grammar',
    questionText: question.questionText,
    correctAnswer: question.correctAnswer,
    userAnswer: userAnswer.trim(),
    grammarTag: (question.grammarTag ?? 'te-form') as GrammarTag,
    questionType,
  })

  // 存入 Attempt + 更新用户统计（事务）
  const [attempt] = await prisma.$transaction([
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
          explanation: extraData.explanation ?? null,
        }),
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        totalAttempts: { increment: 1 },
        correctAttempts: result.isCorrect ? { increment: 1 } : undefined,
      },
    }),
  ])

  // 增加题目使用次数
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
    explanation: extraData.explanation ?? null,
    totalAttempts: user.totalAttempts + 1,
    correctAttempts: user.correctAttempts + (result.isCorrect ? 1 : 0),
  }
})
