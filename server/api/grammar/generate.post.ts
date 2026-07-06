// Grammar 出题接口（免费练习，不消耗能量）
// 1. 校验登录
// 2. 调用 AI 生成语法特训题目
// 3. 存入 GeneratedQuestion 表，返回题目（不暴露 correctAnswer）
import { generateQuestion } from '../../utils/ai'
import type { GrammarTag } from '../../types/ai'

/** 合法的语法标签 */
const VALID_TAGS: GrammarTag[] = [
  'te-form', 'present-perfect', 'passive', 'conditionals',
  'relative-clauses', 'particles', 'honorifics',
]

/** 合法的题型（已移除选择题） */
const VALID_TYPES = ['fill-blank', 'error-correction'] as const
type QuestionType = typeof VALID_TYPES[number]

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const body = await readBody<{
    grammarTag?: GrammarTag
    questionType?: QuestionType
  }>(event)
  const grammarTag = body?.grammarTag
  const questionType = body?.questionType ?? 'fill-blank'

  // 参数校验
  if (!grammarTag || !VALID_TAGS.includes(grammarTag)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid grammarTag. Valid: ${VALID_TAGS.join(', ')}`,
    })
  }
  if (!VALID_TYPES.includes(questionType)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid questionType. Valid: ${VALID_TYPES.join(', ')}`,
    })
  }

  // 调用 AI 出题（带错误处理）
  let generated
  try {
    generated = await generateQuestion(event, {
      category: 'grammar',
      grammarTag,
      questionType,
      difficulty: 2,
    })
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({
      statusCode: 503,
      statusMessage: `Failed to generate question: ${err.message || 'AI service unavailable'}`,
    })
  }

  if (generated.category !== 'grammar') {
    throw createError({ statusCode: 500, statusMessage: 'AI returned wrong category' })
  }

  const q = generated.data

  // 存储题目（不扣减能量）
  let question
  try {
    question = await prisma.generatedQuestion.create({
      data: {
        category: 'grammar',
        grammarTag: q.grammarTag,
        questionText: q.questionText,
        correctAnswer: q.correctAnswer,
        options: q.options ? JSON.stringify(q.options) : null,
        extraData: JSON.stringify({
          questionType: q.questionType,
          explanation: q.explanation ?? null,
        }),
        generatedById: user.id,
      },
    })
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Database error: ${err.message || 'Failed to save question'}`,
    })
  }

  return {
    questionId: question.id,
    questionText: q.questionText,
    grammarTag: q.grammarTag,
    questionType: q.questionType,
    options: q.options ?? null,
    explanation: q.explanation ?? null,
  }
})
