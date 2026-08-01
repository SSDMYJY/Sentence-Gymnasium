// GET /api/credits/packages — 返回可充值套餐列表（前端渲染用）
import { getPublicPacks } from '../../utils/recharge-config'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  return { currency: 'USD', packs: getPublicPacks() }
})
