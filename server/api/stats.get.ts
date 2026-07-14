// 仪表板各板块统计：返回总数 / 正确数 / 各板块（practice / paraphrase / grammar）的题数与正确数。
// 不维护冗余计数字段，运行时按 Attempt join Question.category 聚合，避免一致性问题。
//
// attempts 表此时可能为空（步骤 3 阶段还没有做题流程），返回 0 即可。
type BoardKey = 'practice' | 'paraphrase' | 'grammar'

interface BoardStat {
  total: number
  correct: number
}

interface WeakArea {
  tag: string
  label: string
  total: number
  correct: number
  accuracy: number
}

const GRAMMAR_LABELS: Record<string, string> = {
  'te-form': 'て-form',
  'present-perfect': 'Present Perfect',
  'passive': 'Passive Voice',
  'conditionals': 'Conditionals',
  'relative-clauses': 'Relative Clauses',
  'particles': 'Particles',
  'honorifics': 'Honorifics',
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  // 只取判题需要的字段，减少传输；include question 的 category 用于分桶。
  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id },
    select: {
      isCorrect: true,
      createdAt: true,
      question: { select: { category: true, grammarTag: true, languagePair: true } },
    },
  })

  const perBoard: Record<BoardKey, BoardStat> = {
    practice: { total: 0, correct: 0 },
    paraphrase: { total: 0, correct: 0 },
    grammar: { total: 0, correct: 0 },
  }

  // Track grammar tag accuracy for weak areas
  const grammarStats: Record<string, { total: number; correct: number }> = {}
  // Track language pair accuracy for practice weak areas
  const pairStats: Record<string, { total: number; correct: number }> = {}

  let total = 0
  let correct = 0
  let todayAttempts = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Weekly activity: last 7 days
  const weeklyMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    weeklyMap[key] = 0
  }

  for (const a of attempts) {
    total++
    if (a.isCorrect) correct++
    const cat = a.question?.category as BoardKey | undefined
    if (cat && perBoard[cat]) {
      perBoard[cat].total++
      if (a.isCorrect) perBoard[cat].correct++
    }

    // Today's attempts
    if (a.createdAt >= today) todayAttempts++

    // Weekly activity
    const dayKey = a.createdAt.toISOString().slice(0, 10)
    if (weeklyMap[dayKey] !== undefined) weeklyMap[dayKey]++

    // Grammar tag tracking
    if (a.question?.grammarTag) {
      const tag = a.question.grammarTag
      if (!grammarStats[tag]) grammarStats[tag] = { total: 0, correct: 0 }
      grammarStats[tag].total++
      if (a.isCorrect) grammarStats[tag].correct++
    }

    // Language pair tracking
    if (a.question?.languagePair) {
      const pair = a.question.languagePair
      if (!pairStats[pair]) pairStats[pair] = { total: 0, correct: 0 }
      pairStats[pair].total++
      if (a.isCorrect) pairStats[pair].correct++
    }
  }

  // Compute weak areas (bottom 3 by accuracy, min 3 attempts)
  const allTags = { ...grammarStats, ...pairStats }
  const weakAreas: WeakArea[] = Object.entries(allTags)
    .filter(([, s]) => s.total >= 3)
    .map(([tag, s]) => ({
      tag,
      label: GRAMMAR_LABELS[tag] || tag,
      total: s.total,
      correct: s.correct,
      accuracy: Math.round((s.correct / s.total) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)

  // Weekly activity as sorted array
  const weeklyActivity = Object.entries(weeklyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  return {
    total,
    correct,
    perBoard,
    todayAttempts,
    dailyGoal: user.dailyGoal ?? 5,
    weeklyActivity,
    weakAreas,
  }
})
