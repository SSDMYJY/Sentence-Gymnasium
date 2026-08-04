// POST /api/webhooks/alipay — 支付宝异步通知（notifyUrl）
// 关键：支付宝以 application/x-www-form-urlencoded POST 通知，响应必须为纯文本 "success"（非 JSON）。
//       未返回 success 时支付宝会按 8 次退避策略重试，幂等逻辑保证重试不会重复入账。
//
// 验签：使用 checkNotifySignV2（不对 value 二次 decode），适配 H3 readBody 对表单体的自动解码。
// 幂等：双重保护 ——
//   1) notify_id 去重（同一通知重试只处理一次）
//   2) 条件更新 updateMany（status != completed 才入账），并发重复通知只入账一次
// 入账：订单状态与用户 credits 在同一事务内原子更新，任一步失败整体回滚并返回 "fail" 让支付宝重试。
import { readBody, setResponseHeader } from 'h3'
import { useAlipay } from '../utils/alipay'

export default defineEventHandler(async (event) => {
  // 支付宝通知为 form-urlencoded；readBody 返回已解码的对象
  const postData = await readBody<Record<string, string>>(event)
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  // ---------- 验签 ----------
  let valid: boolean
  try {
    const { sdk } = await useAlipay()
    valid = sdk.checkNotifySignV2(postData)
  } catch (err: any) {
    console.error('[alipay-notify] sign check error:', err?.message)
    return 'fail'
  }
  if (!valid) {
    console.warn('[alipay-notify] signature verification failed')
    return 'fail'
  }

  const tradeStatus = postData.trade_status
  const outTradeNo = postData.out_trade_no
  const tradeNo = postData.trade_no
  const notifyId = postData.notify_id
  const totalAmount = postData.total_amount

  // 仅处理交易成功 / 交易完成（即时到账 PC 支付通常为 TRADE_SUCCESS）
  if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
    // TRADE_CLOSED（超时关闭）等 → 标记订单失败（未发放积分，无需扣回）
    if (tradeStatus === 'TRADE_CLOSED' && outTradeNo) {
      const prisma = usePrisma(event)
      try {
        await prisma.order.updateMany({
          where: { outTradeNo, status: 'pending' },
          data: { status: 'failed', alipayTradeNo: tradeNo ?? null, alipayNotifyId: notifyId ?? null },
        })
        console.info('[alipay-notify] trade closed; outTradeNo=', outTradeNo, 'tradeNo=', tradeNo)
      } catch (err) {
        console.error('[alipay-notify] mark failed error:', err, 'outTradeNo=', outTradeNo)
        return 'fail'
      }
    }
    return 'success'
  }

  if (!outTradeNo) {
    console.error('[alipay-notify] missing out_trade_no; notifyId=', notifyId)
    return 'success'
  }

  const prisma = usePrisma(event)
  const order = await prisma.order.findUnique({ where: { outTradeNo } })
  if (!order) {
    console.error('[alipay-notify] order not found; outTradeNo=', outTradeNo, 'notifyId=', notifyId)
    return 'success'
  }

  // ---------- 幂等去重 ----------
  // 1) 同一 notify_id 已处理过 → 直接 success（支付宝重试）
  if (order.alipayNotifyId === notifyId) {
    console.info('[alipay-notify] duplicate notify_id, skipped; outTradeNo=', outTradeNo, 'notifyId=', notifyId)
    return 'success'
  }
  // 2) 订单已完成（不同 notify_id 的并发 / 历史重复）→ 直接 success
  if (order.status === 'completed') {
    console.info('[alipay-notify] order already completed; outTradeNo=', outTradeNo)
    return 'success'
  }

  // ---------- 原子入账 ----------
  try {
    await prisma.$transaction(async (tx) => {
      // 条件更新：仅当订单仍非 completed 时才入账，保证并发重复通知只入账一次
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: { not: 'completed' } },
        data: {
          status: 'completed',
          alipayTradeNo: tradeNo ?? null,
          alipayNotifyId: notifyId ?? null,
        },
      })
      if (updated.count > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { credits: { increment: order.credits } },
        })
      }
    })
    console.info(
      '[alipay-notify] order completed; outTradeNo=', outTradeNo,
      'tradeNo=', tradeNo, 'amount=', totalAmount, 'credits=', order.credits,
    )
  } catch (err) {
    // 事务已整体回滚（订单状态与积分均未落库）；返回 fail 让支付宝退避重试，
    // 重试由幂等去重 + 条件更新保证不会重复入账。
    console.error('[alipay-notify] credit grant failed, transaction rolled back:', err, 'orderId=', order.id)
    return 'fail'
  }

  return 'success'
})
