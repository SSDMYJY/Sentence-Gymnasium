// POST /api/credits/checkout — 创建充值订单 + Waffo 托管支付会话
// 金额/积分一律以服务端套餐目录为准，不信任客户端传入的金额。
// 使用认证式收银台（authenticated）：以内部 userId 作为 buyerIdentity 绑定订单归属，
// 防止试用滥用与订单脱钩，并为后续自助服务提供基础。
// successUrl 固定使用 Waffo 已验证的站点域名（runtimeConfig.public.siteUrl），
// 避免用户经其他域名访问时支付回跳被 Waffo 网关以 404 "domain endpoints match fail" 拒绝。
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

  // 2. 创建 Waffo 支付会话（认证式收银台）
  // 关键：successUrl 必须使用 Waffo 已验证的站点域名（生产环境为
  // https://sentencegym.waterspo.top，由 EdgeOne Makers 环境变量 NUXT_PUBLIC_SITE_URL 注入），
  // 而不是当前请求的 origin。
  // 否则当用户经其他域名（EdgeOne 预览域名 / localhost 等）访问时，
  // Waffo 网关会在支付完成后的回跳域名校验阶段返回 404 "domain endpoints match fail"，
  // 导致无法正确回到本应用的结果页。
  const siteUrl = (useRuntimeConfig().public?.siteUrl as string | undefined)?.replace(/\/+$/, '')
  const origin = getRequestURL(event).origin
  const baseUrl = siteUrl || origin // 兜底：无站点配置时退化为请求 origin
  const successUrl = `${baseUrl}/recharge/success?orderId=${order.id}`

  let session: { sessionId?: string; checkoutUrl?: string } | undefined
  try {
    // 认证式收银台：buyerIdentity 写入 JWT，绑定订单归属；
    // 其余字段（orderMerchantExternalId / metadata / successUrl 等）由 SDK 原样转发到 create-session，
    // 返回的 checkoutUrl 已追加 #token=... 片段。
    session = await client.checkout.authenticated.create({
      productId: pack.productId,
      currency: pack.currency,
      buyerIdentity: user.id,
      buyerEmail: user.email ?? undefined,
      successUrl,
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

  // 3. 校验会话结果：Waffo 网关错误（如 domain endpoints match fail）会返回不含
  //    data 的错误信封（SDK 的 unwrapAction 不抛错），必须显式校验；校验失败即
  //    回滚订单并报错，避免遗留无法支付的 pending 订单或把无效 checkoutUrl 交给前端。
  if (!session?.sessionId || !session?.checkoutUrl) {
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {})
    console.error('[checkout] Waffo returned an invalid checkout session:', JSON.stringify(session))
    throw createError({ statusCode: 502, statusMessage: 'checkout_failed' })
  }

  // 4. 记录 session id
  await prisma.order.update({
    where: { id: order.id },
    data: { checkoutSessionId: session.sessionId },
  })

  return { checkoutUrl: session.checkoutUrl, orderId: order.id }
})
