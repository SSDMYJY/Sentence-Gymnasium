// GET /api/credits/alipay/return — 支付宝同步跳转（returnUrl）
// 用户在支付宝收银台支付完成后，浏览器会被重定向回此处（GET，携带 out_trade_no / trade_no / sign 等参数）。
// 同步跳转不可靠（用户可能关闭页面或网络中断），订单状态以异步通知 /api/webhooks/alipay 为准；
// 本端点仅验签后重定向到结果页，由结果页轮询订单状态（异步通知到位后即显示成功）。
import { getQuery, sendRedirect, getCookie } from 'h3'
import { useAlipay } from '../../utils/alipay'

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, string>
  const outTradeNo = query.out_trade_no

  // 读取 i18n cookie 确定语言前缀（支付宝回跳时浏览器仍携带本站 cookie）
  const locale = getCookie(event, 'i18n_locale') || 'zh-hans'
  const rechargePath = `/${locale}/recharge`
  const successBase = `/${locale}/recharge/success`

  // 无订单号 → 回充值页
  if (!outTradeNo) {
    console.warn('[alipay-return] missing out_trade_no in query')
    return sendRedirect(event, rechargePath, 302)
  }

  const prisma = usePrisma(event)
  const order = await prisma.order.findUnique({ where: { outTradeNo } })

  if (!order) {
    console.warn('[alipay-return] order not found; outTradeNo=', outTradeNo)
    return sendRedirect(event, rechargePath, 302)
  }

  // 验签（防止伪造跳转参数）；验签失败回充值页，不暴露订单信息
  try {
    const { sdk } = await useAlipay()
    // checkNotifySignV2 不对 value 二次 decode，适配 getQuery 已解码的查询参数
    const valid = sdk.checkNotifySignV2(query)
    if (!valid) {
      console.warn('[alipay-return] sign verification failed; outTradeNo=', outTradeNo)
      return sendRedirect(event, rechargePath, 302)
    }
  } catch (err: any) {
    console.error('[alipay-return] sign check error:', err?.message, 'outTradeNo=', outTradeNo)
    return sendRedirect(event, rechargePath, 302)
  }

  console.info('[alipay-return] redirecting to success page; orderId=', order.id, 'outTradeNo=', outTradeNo)
  return sendRedirect(event, `${successBase}?orderId=${order.id}`, 302)
})
