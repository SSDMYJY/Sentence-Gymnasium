// POST /api/credits/alipay/checkout — 创建支付宝电脑网站支付订单
// 生成唯一 out_trade_no，调用 alipay.trade.page.pay 生成支付链接（GET 方式返回可直接跳转的 URL）。
// 用户在前端整页跳转至该 URL 进入支付宝收银台；支付完成后：
//   - 同步跳转 → /api/credits/alipay/return（浏览器回跳，验签后重定向到结果页）
//   - 异步通知 → /api/webhooks/alipay（支付宝服务端回调，验签后更新订单状态并发放积分）
// 金额/积分一律以服务端套餐目录为准，不信任客户端传入的金额。
import { createError } from 'h3'
import { getPackDef } from '../../utils/recharge-config'
import { useAlipay, generateOutTradeNo, usdToCny } from '../../utils/alipay'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ packId?: string }>(event)

  const pack = getPackDef(body?.packId ?? '')
  if (!pack) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_pack' })
  }

  const prisma = usePrisma(event)

  // 1. 构建 SDK（同时校验支付宝配置是否就绪）
  const { sdk, config } = await useAlipay()

  // 1.1 美元 → 人民币换算（站点以美元计价，支付宝以人民币结算）
  //     订单 amount 存储实际收取的人民币金额，currency 标记为 CNY
  const cnyAmount = usdToCny(pack.price, config.usdToCnyRate)

  // 2. 生成唯一业务订单号并创建 pending 订单
  //    outTradeNo 有唯一约束，极小概率碰撞时重试（最多 3 次）
  let order
  for (let attempt = 0; attempt < 3; attempt++) {
    const outTradeNo = generateOutTradeNo()
    try {
      order = await prisma.order.create({
        data: {
          userId: user.id,
          packId: pack.id,
          productId: 'FAST_INSTANT_TRADE_PAY',
          credits: pack.credits,
          amount: cnyAmount,
          currency: 'CNY',
          buyerEmail: user.email,
          outTradeNo,
        },
      })
      break
    } catch (err: any) {
      // P2002 = unique constraint violation；仅末次才向上抛
      if (err?.code === 'P2002' && attempt < 2) continue
      throw err
    }
  }
  if (!order) throw createError({ statusCode: 500, statusMessage: 'order_create_failed' })

  // 3. 调用 alipay.trade.page.pay 生成支付链接
  //    GET 方式返回带签名的完整 URL，前端 window.location.href 跳转即可进入支付宝收银台。
  //    total_amount 为换算后的人民币金额；timeout_express=15m：未支付 15 分钟自动关闭交易。
  let paymentUrl: string
  try {
    paymentUrl = sdk.pageExecute('alipay.trade.page.pay', 'GET', {
      bizContent: {
        out_trade_no: order.outTradeNo,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: cnyAmount,
        subject: `${pack.credits} 能量包`,
        body: `Sentence Gymnasium ${pack.credits} credits`,
        timeout_express: '15m',
      },
      returnUrl: config.returnUrl,
      notifyUrl: config.notifyUrl,
    })
  } catch (err: any) {
    // 支付链接生成失败 → 回滚订单，避免遗留无法支付的 pending 订单
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {})
    console.error('[alipay-checkout] pageExecute failed:', err?.message, 'outTradeNo=', order.outTradeNo)
    throw createError({ statusCode: 502, statusMessage: 'checkout_failed' })
  }

  if (!paymentUrl) {
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {})
    console.error('[alipay-checkout] pageExecute returned empty url; outTradeNo=', order.outTradeNo)
    throw createError({ statusCode: 502, statusMessage: 'checkout_failed' })
  }

  console.info(
    '[alipay-checkout] order created: orderId=', order.id,
    'outTradeNo=', order.outTradeNo,
    'usd=', pack.price, 'cny=', cnyAmount, 'rate=', config.usdToCnyRate,
    'credits=', pack.credits,
  )

  // 响应结构与 Waffo checkout 一致（checkoutUrl + orderId），前端可复用跳转逻辑
  return { checkoutUrl: paymentUrl, orderId: order.id }
})
