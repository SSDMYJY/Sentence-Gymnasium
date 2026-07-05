interface RankingUser {
  id: string
  name: string | null
  email: string
  totalAttempts: number
  correctAttempts: number
  accuracy: number
  experience: number
}

export default defineEventHandler(async (event) => {
  const prisma = usePrisma(event)

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      totalAttempts: true,
      correctAttempts: true,
    },
    orderBy: [
      { totalAttempts: 'desc' },
      { correctAttempts: 'desc' },
    ],
    take: 100,
  })

  const ranking: RankingUser[] = users.map((u) => {
    const accuracy = u.totalAttempts > 0 
      ? Math.round((u.correctAttempts / u.totalAttempts) * 100) 
      : 0
    const experience = Math.min(u.totalAttempts * 10, 9999)
    return {
      ...u,
      accuracy,
      experience,
    }
  })

  return { ranking }
})