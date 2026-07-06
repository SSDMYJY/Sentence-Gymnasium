// Practice 出题接口
// 1. 校验登录 + 扣减 credits（每次出题消耗 1 点）
// 2. 调用 AI 生成翻译练习题
// 3. 存入 GeneratedQuestion 表，返回题目（不暴露 correctAnswer）
import { generateQuestion } from '../../utils/ai'
import type { LanguagePair, PracticeDifficulty, ScenarioValue } from '../../types/ai'
import { resolveNumericDifficulty, validateScenario } from '~/utils/practice-config'

const COST_PER_QUESTION = 1

/** 合法的语言对 */
const VALID_PAIRS: LanguagePair[] = [
  'ja-en', 'en-ja', 'ja-zh', 'zh-ja', 'en-zh', 'zh-en',
]

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const body = await readBody<{
    languagePair?: LanguagePair
    difficulty?: PracticeDifficulty
    scenario?: ScenarioValue
  }>(event)
  const languagePair = body?.languagePair
  const practiceDifficulty: PracticeDifficulty = body?.difficulty ?? 'random'
  const scenario = validateScenario(body?.scenario)

  // 参数校验
  if (!languagePair || !VALID_PAIRS.includes(languagePair)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid languagePair. Valid: ${VALID_PAIRS.join(', ')}`,
    })
  }
  if (!['random', 'daily', 'fluent', 'professional'].includes(practiceDifficulty)) {
    throw createError({ statusCode: 400, statusMessage: 'difficulty must be random, daily, fluent, or professional' })
  }

  // 解析最终 numeric 难度与场景
  const difficulty = resolveNumericDifficulty(practiceDifficulty)

  // 能量校验
  if (user.credits < COST_PER_QUESTION) {
    throw createError({
      statusCode: 402,
      statusMessage: 'Insufficient credits',
    })
  }

  // 调用 AI 出题（带错误处理）
  let generated
  try {
    generated = await generateQuestion(event, {
      category: 'practice',
      languagePair,
      difficulty,
      practiceDifficulty,
      scenario,
    })
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({
      statusCode: 503,
      statusMessage: `Failed to generate question: ${err.message || 'AI service unavailable'}`,
    })
  }

  if (generated.category !== 'practice') {
    throw createError({ statusCode: 500, statusMessage: 'AI returned wrong category' })
  }

  const q = generated.data

  // 事务：扣减能量 + 存储题目（带错误处理）
  let question
  try {
    const [_, created] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: COST_PER_QUESTION } },
      }),
      prisma.generatedQuestion.create({
        data: {
          category: 'practice',
          languagePair: q.languagePair,
          questionText: q.questionText,
          correctAnswer: q.correctAnswer,
          extraData: JSON.stringify({
            difficulty: q.difficulty,
            practiceDifficulty: q.practiceDifficulty ?? practiceDifficulty,
            scenario: q.scenario ?? scenario,
          }),
          generatedById: user.id,
        },
      }),
    ])
    question = created
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Database error: ${err.message || 'Failed to save question'}`,
    })
  }

  // 更新 store 中的 credits（前端会通过返回值刷新）
  // 只返回题目信息，不返回 correctAnswer
  return {
    questionId: question.id,
    questionText: q.questionText,
    languagePair: q.languagePair,
    difficulty: q.difficulty,
    practiceDifficulty: q.practiceDifficulty ?? practiceDifficulty,
    scenario: q.scenario ?? scenario,
    credits: user.credits - COST_PER_QUESTION,
  }
})
