// 获取训练记录。支持分页 + 按模式筛选。
// 返回题目文本、用户答案、对错、得分、反馈、分类、日期。
interface HistoryEntry {
  id: string
  questionText: string
  userAnswer: string
  isCorrect: boolean
  score: number | null
  verdict: string | null
  feedback: string | null
  category: string
  topic: string | null
  createdAt: string
}

function normalizeToTenScale(score: number): number {
  if (!Number.isFinite(score)) return 0

  let normalized = score
  if (normalized > 10 && normalized <= 100) {
    normalized = normalized / 10
  }
  if (normalized > 0 && normalized <= 1) {
    normalized = normalized * 10
  }

  normalized = Math.max(0, Math.min(10, normalized))
  return Math.round(normalized)
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const query = getQuery(event)
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize as string) || 20))
  const category = query.category as string | undefined

  // 筛选条件
  const where: any = { userId: user.id }
  if (category && ['practice', 'paraphrase', 'grammar'].includes(category)) {
    where.question = { category }
  }

  // 并行查询数据和总数
  const [attempts, total] = await Promise.all([
    prisma.attempt.findMany({
      where,
      include: {
        question: {
          select: { questionText: true, category: true, grammarTag: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.attempt.count({ where }),
  ])

  const entries: HistoryEntry[] = attempts.map((a) => {
    // 解析 feedback JSON
    let score: number | null = null
    let verdict: string | null = null
    let feedback: string | null = null
    if (a.feedback) {
      try {
        const parsed = JSON.parse(a.feedback)
        score = typeof parsed.score === 'number' ? normalizeToTenScale(parsed.score) : null
        verdict = parsed.verdict ?? null
        feedback = parsed.feedback ?? null
      } catch {
        // feedback 不是 JSON，保持 null
      }
    }

    return {
      id: a.id,
      questionText: a.question?.questionText ?? '',
      userAnswer: a.userAnswer,
      isCorrect: a.isCorrect,
      score,
      verdict,
      feedback,
      category: a.question?.category ?? 'unknown',
      topic: a.question?.grammarTag ?? a.question?.category ?? null,
      createdAt: a.createdAt.toISOString(),
    }
  })

  return {
    entries,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
})
