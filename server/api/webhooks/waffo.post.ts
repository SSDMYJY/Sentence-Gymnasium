// POST /api/webhooks/waffo — Waffo Pancake 支付回调
// 关键：必须读取原始 body（切勿先 JSON.parse），否则 RSA-SHA256 验签失败。
// 幂等：以 event.id（delivery id）去重，条件更新（status 流转）做二次原子保护。
// 入账：订单状态与用户 credits 在同一数据库事务内原子更新，任一步失败整体回滚，
//       并返回 5xx 让 Waffo 按退避策略重试（重试由幂等逻辑保证不会重复入账）。
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
  const data = payload.data as any

  // 解析订单引用：优先 orderMerchantExternalId（结账时写入），
  // 兜底会话 metadata.orderId，再兜底 Waffo 订单号 orderId（refund 事件同样携带）。
  const orderRef: string | undefined = data?.orderMerchantExternalId ?? data?.orderMetadata?.orderId
  const waffoOrderId: string | undefined = data?.orderId

  /** 幂等去重：同一 delivery（payload.id）只处理一次 */
  async function isDuplicate(): Promise<boolean> {
    return !!(await prisma.order.findFirst({ where: { waffoEventId: payload.id } }))
  }

  /** 定位本地订单（优先业务引用，其次 Waffo 订单号） */
  async function findOrder() {
    if (orderRef) return prisma.order.findUnique({ where: { id: orderRef } })
    if (waffoOrderId) return prisma.order.findFirst({ where: { waffoOrderId } })
    return null
  }

  // 一次性支付成功 → 标记订单完成并发放积分
  if (payload.eventType === WebhookEventType.OrderCompleted) {
    // 无法定位订单：绝不静默跳过（否则积分永久丢失而 Waffo 以为已成功投递），
    // 记录详细错误后仍按 2xx 应答（已投递无需重试），用 eventId 留痕人工排查。
    if (!orderRef && !waffoOrderId) {
      console.error('[waffo-webhook] order.completed without any order reference; eventId=', payload.eventId)
      return { ok: true, skipped: 'no-order-reference' }
    }
    if (await isDuplicate()) return { ok: true, skipped: 'duplicate' }

    const order = await findOrder()
    if (!order) {
      console.error('[waffo-webhook] order not found:', orderRef ?? waffoOrderId, 'eventId=', payload.eventId)
      return { ok: true, skipped: 'order-not-found' }
    }

    try {
      // 原子入账：订单状态 + 用户积分在同一事务内，任一步失败整体回滚。
      // updateMany 条件更新（status != completed）保证并发重复投递时只入账一次。
      await prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id: order.id, status: { not: 'completed' } },
          data: {
            status: 'completed',
            waffoEventId: payload.id,
            waffoOrderId: waffoOrderId ?? null,
          },
        })
        if (updated.count > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { credits: { increment: order.credits } },
          })
        }
      })
    } catch (err) {
      // 事务已整体回滚（订单状态与积分均未落库）；返回 5xx 让 Waffo 退避重试，
      // 重试由幂等去重 + 条件更新保证不会重复入账。
      console.error('[waffo-webhook] credit grant failed, transaction rolled back:', err, 'orderId=', order.id)
      throw createError({ statusCode: 500, statusMessage: 'credit_grant_failed' })
    }
    return { ok: true }
  }

  // 退款成功 → 标记退款（若已发放则扣回积分）
  if (payload.eventType === WebhookEventType.RefundSucceeded) {
    if (!orderRef && !waffoOrderId) {
      console.error('[waffo-webhook] refund.succeeded without any order reference; eventId=', payload.eventId)
      return { ok: true, skipped: 'no-order-reference' }
    }
    if (await isDuplicate()) return { ok: true, skipped: 'duplicate' }

    const order = await findOrder()
    // 订单不存在或尚未发放（未发放则无需扣回）
    if (order && order.status === 'completed') {
      try {
        await prisma.$transaction(async (tx) => {
          // 仅当订单仍为 completed 时才扣回，避免并发/重复退款多次扣减
          const updated = await tx.order.updateMany({
            where: { id: order.id, status: 'completed' },
            data: { status: 'refunded', waffoEventId: payload.id },
          })
          if (updated.count > 0) {
            await tx.user.update({
              where: { id: order.userId },
              data: { credits: { decrement: order.credits } },
            })
          }
        })
      } catch (err) {
        console.error('[waffo-webhook] refund processing failed, transaction rolled back:', err, 'orderId=', order.id)
        throw createError({ statusCode: 500, statusMessage: 'refund_failed' })
      }
    }
    return { ok: true }
  }

  // 其余事件暂不处理
  return { ok: true, ignored: payload.eventType }
})
