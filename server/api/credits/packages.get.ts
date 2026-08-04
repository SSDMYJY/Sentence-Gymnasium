// GET /api/credits/packages — 返回可充值套餐列表（前端渲染用）+ 支付宝可用性
import { getPublicPacks } from '../../utils/recharge-config'
import { isAlipayConfigured } from '../../utils/alipay'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  return {
    currency: 'USD',
    packs: await getPublicPacks(),
    alipay: await isAlipayConfigured(),
  }
})
