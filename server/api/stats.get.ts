// 仪表板各板块统计：返回总数 / 正确数 / 各板块（practice / paraphrase / grammar）的题数与正确数。
// 不维护冗余计数字段，运行时按 Attempt join Question.category 聚合，避免一致性问题。
//
// attempts 表此时可能为空（步骤 3 阶段还没有做题流程），返回 0 即可。
type BoardKey = 'practice' | 'paraphrase' | 'grammar'

interface BoardStat {
  total: number
  correct: number
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  // 只取判题需要的字段，减少传输；include question 的 category 用于分桶。
  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id },
    select: {
      isCorrect: true,
      question: { select: { category: true } },
    },
  })

  const perBoard: Record<BoardKey, BoardStat> = {
    practice: { total: 0, correct: 0 },
    paraphrase: { total: 0, correct: 0 },
    grammar: { total: 0, correct: 0 },
  }

  let total = 0
  let correct = 0
  for (const a of attempts) {
    total++
    if (a.isCorrect) correct++
    const cat = a.question?.category as BoardKey | undefined
    if (cat && perBoard[cat]) {
      perBoard[cat].total++
      if (a.isCorrect) perBoard[cat].correct++
    }
  }

  return { total, correct, perBoard }
})
