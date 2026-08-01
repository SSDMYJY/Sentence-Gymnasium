// POST /api/credits/checkout — 创建充值订单 + Waffo 托管支付会话
// 金额/积分一律以服务端套餐目录为准，不信任客户端传入的金额。
import { createError } from 'h3'
import { getPack } from '../../utils/recharge-config'
import { useWaffo } from '../../utils/waffo'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ packId?: string }>(event)

  const pack = await getPack(body?.packId ?? '')
  if (!pack) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_pack' })
  }

  const prisma = usePrisma(event)

  // 先确认 Waffo 已配置（未配置直接 500，不创建订单）
  const client = await useWaffo()

  // 1. 创建 pending 订单
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      packId: pack.id,
      productId: pack.productId,
      credits: pack.credits,
      amount: pack.price,
      currency: pack.currency,
      buyerEmail: user.email,
    },
  })

  // 2. 创建 Waffo 支付会话
  const origin = getRequestURL(event).origin
  let session
  try {
    session = await client.checkout.createSession({
      productId: pack.productId,
      currency: pack.currency,
      buyerEmail: user.email ?? undefined,
      successUrl: `${origin}/recharge/success?orderId=${order.id}`,
      // 把我们的订单 id 作为业务外部标识，Webhook 凭它定位订单
      orderMerchantExternalId: order.id,
      metadata: { userId: user.id, packId: pack.id, credits: String(pack.credits) },
    })
  } catch (err: any) {
    // 会话创建失败则回滚订单
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {})
    console.error('[checkout] Waffo session creation failed:', err?.message)
    throw createError({ statusCode: 502, statusMessage: 'checkout_failed' })
  }

  // 3. 记录 session id
  await prisma.order.update({
    where: { id: order.id },
    data: { checkoutSessionId: session.sessionId },
  })

  return { checkoutUrl: session.checkoutUrl, orderId: order.id }
})
