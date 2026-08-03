// 仪表板各板块统计：返回总数 / 正确数 / 各板块（practice / paraphrase / grammar）的题数与正确数。
// 使用 DB 侧聚合，避免拉取全部 attempt 行到 Node。
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

interface AggRow {
  category: string | null
  grammarTag: string | null
  languagePair: string | null
  isCorrect: number | boolean
  cnt: bigint | number
}

interface DayRow {
  day: Date | string
  cnt: bigint | number
}

function toNum(v: bigint | number): number {
  return typeof v === 'bigint' ? Number(v) : v
}

function toDayKey(v: Date | string): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  const s = String(v)
  return s.length >= 10 ? s.slice(0, 10) : s
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - 6)

  const weeklyMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    weeklyMap[d.toISOString().slice(0, 10)] = 0
  }

  const [aggRows, weekRows, todayAttempts] = await Promise.all([
    prisma.$queryRaw<AggRow[]>`
      SELECT q.category AS category,
             q.grammarTag AS grammarTag,
             q.languagePair AS languagePair,
             a.isCorrect AS isCorrect,
             COUNT(*) AS cnt
      FROM attempts a
      INNER JOIN questions q ON a.questionId = q.id
      WHERE a.userId = ${user.id}
      GROUP BY q.category, q.grammarTag, q.languagePair, a.isCorrect
    `,
    prisma.$queryRaw<DayRow[]>`
      SELECT DATE(a.createdAt) AS day, COUNT(*) AS cnt
      FROM attempts a
      WHERE a.userId = ${user.id} AND a.createdAt >= ${weekStart}
      GROUP BY DATE(a.createdAt)
    `,
    prisma.attempt.count({
      where: { userId: user.id, createdAt: { gte: today } },
    }),
  ])

  const perBoard: Record<BoardKey, BoardStat> = {
    practice: { total: 0, correct: 0 },
    paraphrase: { total: 0, correct: 0 },
    grammar: { total: 0, correct: 0 },
  }

  const grammarStats: Record<string, { total: number; correct: number }> = {}
  const pairStats: Record<string, { total: number; correct: number }> = {}

  let total = 0
  let correct = 0

  for (const row of aggRows) {
    const cnt = toNum(row.cnt)
    const ok = row.isCorrect === true || row.isCorrect === 1
    total += cnt
    if (ok) correct += cnt

    const cat = row.category as BoardKey | null
    if (cat && perBoard[cat]) {
      perBoard[cat].total += cnt
      if (ok) perBoard[cat].correct += cnt
    }

    if (row.grammarTag) {
      if (!grammarStats[row.grammarTag]) grammarStats[row.grammarTag] = { total: 0, correct: 0 }
      grammarStats[row.grammarTag].total += cnt
      if (ok) grammarStats[row.grammarTag].correct += cnt
    }

    if (row.languagePair) {
      if (!pairStats[row.languagePair]) pairStats[row.languagePair] = { total: 0, correct: 0 }
      pairStats[row.languagePair].total += cnt
      if (ok) pairStats[row.languagePair].correct += cnt
    }
  }

  for (const row of weekRows) {
    const key = toDayKey(row.day)
    if (weeklyMap[key] !== undefined) weeklyMap[key] = toNum(row.cnt)
  }

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
