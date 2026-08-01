// POST /api/webhooks/waffo — Waffo Pancake 支付回调
// 关键：必须读取原始 body（切勿先 JSON.parse），否则 RSA-SHA256 验签失败。
// 幂等：以 event.id（delivery id）去重，订单状态流转做二次保护。
import { verifyWebhook, WebhookEventType } from '@waffo/pancake-ts'
import { createError, getHeader, readRawBody } from 'h3'

export default defineEventHandler(async (event) => {
  const rawBody = await readRawBody(event)
  const body = typeof rawBody === 'string' ? rawBody : Buffer.from(rawBody ?? '').toString('utf-8')
  const signature = getHeader(event, 'x-waffo-signature') as string | null | undefined

  let payload: ReturnType<typeof verifyWebhook>
  try {
    payload = verifyWebhook(body, signature)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  const prisma = usePrisma(event)

  // 幂等：同一 delivery 只处理一次
  const alreadyDelivered = await prisma.order.findFirst({ where: { waffoEventId: payload.id } })
  if (alreadyDelivered) return { ok: true, skipped: 'duplicate' }

  const data = payload.data as any
  const orderId: string | undefined = data?.orderMerchantExternalId

  // 一次性支付成功 → 标记订单完成并发放积分
  if (payload.eventType === WebhookEventType.OrderCompleted) {
    if (!orderId) return { ok: true, skipped: 'no-order-reference' }

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) {
      console.error('[waffo-webhook] order not found:', orderId)
      throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    }
    if (order.status === 'completed') return { ok: true, skipped: 'already-completed' }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: 'completed', waffoEventId: payload.id, waffoOrderId: data?.orderId ?? null },
      }),
      prisma.user.update({
        where: { id: order.userId },
        data: { credits: { increment: order.credits } },
      }),
    ])
    return { ok: true }
  }

  // 退款成功 → 标记退款（若已发放则扣回积分）
  if (payload.eventType === WebhookEventType.RefundSucceeded) {
    if (!orderId) return { ok: true, skipped: 'no-order-reference' }

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (order && order.status === 'completed') {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: 'refunded', waffoEventId: payload.id },
        }),
        prisma.user.update({
          where: { id: order.userId },
          data: { credits: { decrement: order.credits } },
        }),
      ])
    }
    return { ok: true }
  }

  // 其余事件暂不处理
  return { ok: true, ignored: payload.eventType }
})
