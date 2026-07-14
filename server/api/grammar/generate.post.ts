// Grammar 出题接口
// 1. 校验登录 + 扣减 credits（每次出题消耗 1 点）
// 2. 调用 AI 生成语法特训题目
// 3. 存入 GeneratedQuestion 表，返回题目（不暴露 correctAnswer）
import { generateQuestion } from '../../utils/ai'
import type { GrammarTag } from '../../types/ai'

const COST_PER_QUESTION = 1

/** 合法的语法标签 */
const VALID_TAGS: GrammarTag[] = [
  'te-form', 'present-perfect', 'passive', 'conditionals',
  'relative-clauses', 'particles', 'honorifics',
]

/** 合法的题型 */
const VALID_TYPES = ['fill-blank', 'choice', 'error-correction'] as const
type QuestionType = typeof VALID_TYPES[number]

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const body = await readBody<{
    grammarTag?: GrammarTag
    questionType?: QuestionType
    difficulty?: 1 | 2 | 3
  }>(event)
  const grammarTag = body?.grammarTag
  const questionType = body?.questionType ?? 'fill-blank'
  const difficulty = body?.difficulty ?? 2

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
  if (![1, 2, 3].includes(difficulty)) {
    throw createError({ statusCode: 400, statusMessage: 'difficulty must be 1, 2, or 3' })
  }

  // 能量校验
  if (user.credits < COST_PER_QUESTION) {
    throw createError({ statusCode: 402, statusMessage: 'Insufficient credits' })
  }

  // 调用 AI 出题
  const generated = await generateQuestion(event, {
    category: 'grammar',
    grammarTag,
    questionType,
    difficulty,
  })

  if (generated.category !== 'grammar') {
    throw createError({ statusCode: 500, statusMessage: 'AI returned wrong category' })
  }

  const q = generated.data

  // 事务：扣减能量 + 存储题目
  const [_, question] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: COST_PER_QUESTION } },
    }),
    prisma.generatedQuestion.create({
      data: {
        category: 'grammar',
        grammarTag: q.grammarTag,
        questionText: q.questionText,
        correctAnswer: q.correctAnswer,
        options: q.options ? JSON.stringify(q.options) : null,
        extraData: JSON.stringify({
          difficulty,
          questionType: q.questionType,
          explanation: q.explanation ?? null,
        }),
        generatedById: user.id,
      },
    }),
  ])

  return {
    questionId: question.id,
    questionText: q.questionText,
    grammarTag: q.grammarTag,
    questionType: q.questionType,
    options: q.options ?? null,
    explanation: q.explanation ?? null,
    difficulty,
    credits: user.credits - COST_PER_QUESTION,
  }
})
