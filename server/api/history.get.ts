// 获取最近训练记录（最近 5 题）。返回题目文本、对错、得分、主题、日期。
interface HistoryEntry {
  id: string
  questionText: string
  isCorrect: boolean
  score: number | null
  topic: string | null
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id },
    include: { question: { select: { questionText: true, category: true, grammarTag: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const entries: HistoryEntry[] = attempts.map((a) => ({
    id: a.id,
    questionText: a.question?.questionText ?? '',
    isCorrect: a.isCorrect,
    score: null,
    topic: a.question?.grammarTag ?? a.question?.category ?? null,
    createdAt: a.createdAt.toISOString(),
  }))

  return { entries }
})
