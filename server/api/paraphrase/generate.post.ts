// Paraphrase 出题接口
// 1. 校验登录 + 扣减 credits（每次出题消耗 1 点）
// 2. 调用 AI 生成同义改写题目
// 3. 存入 GeneratedQuestion 表，返回题目（不暴露 correctAnswer）
import { generateQuestion } from '../../utils/ai'
import type { LangCode } from '../../types/ai'

const COST_PER_QUESTION = 1

/** 合法的源语言（改写仅支持 ja / en） */
const VALID_LANGS: LangCode[] = ['ja', 'en']

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const body = await readBody<{ sourceLang?: LangCode; difficulty?: 1 | 2 | 3 }>(event)
  const sourceLang = body?.sourceLang
  const difficulty = body?.difficulty ?? 2

  // 参数校验
  if (!sourceLang || !VALID_LANGS.includes(sourceLang)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid sourceLang. Valid: ${VALID_LANGS.join(', ')}`,
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
    category: 'paraphrase',
    sourceLang,
    difficulty,
  })

  if (generated.category !== 'paraphrase') {
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
        category: 'paraphrase',
        languagePair: sourceLang,
        questionText: q.questionText,
        correctAnswer: q.correctAnswer,
        extraData: JSON.stringify({ difficulty, hint: q.hint ?? null }),
        generatedById: user.id,
      },
    }),
  ])

  return {
    questionId: question.id,
    questionText: q.questionText,
    sourceLang: q.sourceLang,
    hint: q.hint ?? null,
    difficulty,
    credits: user.credits - COST_PER_QUESTION,
  }
})
