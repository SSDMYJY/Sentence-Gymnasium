// GET /api/credits/orders/:id — 查询本人订单状态（支付结果轮询用）
import { createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  const prisma = usePrisma(event)
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      status: true,
      credits: true,
      amount: true,
      currency: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'order_not_found' })
  }

  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }
})
