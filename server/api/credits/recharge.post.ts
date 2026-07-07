// 模拟充值：每次 +20 Credits。仅用于演示，无真实支付。
// 充值后返回最新用户信息，前端用它刷新 Pinia 镜像。
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const RECHARGE_AMOUNT = 20

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { credits: { increment: RECHARGE_AMOUNT } },
    select: {
      id: true,
      email: true,
      name: true,
      credits: true,
      totalAttempts: true,
      correctAttempts: true,
      streak: true,
      lastPracticeAt: true,
    },
  })

  return {
    ...updated,
    lastPracticeAt: updated.lastPracticeAt ? updated.lastPracticeAt.toISOString() : null,
  }
})
