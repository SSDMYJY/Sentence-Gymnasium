// 充值套餐目录（Waffo Pancake onetime 产品映射）。
// productId 由 `scripts/waffo-setup.ts` 创建产品后填入环境变量：
//   WAFFO_PRODUCT_PACK_100 / WAFFO_PRODUCT_PACK_500 / WAFFO_PRODUCT_PACK_1500
// 未配置 productId 的套餐不会出现在目录中（页面与接口自动过滤）。
export interface CreditPack {
  id: string
  credits: number
  price: string // display amount, e.g. "2.99"
  currency: string
  productId: string // Waffo PROD_xxx
}

export interface CreditPackOption {
  id: string
  credits: number
  price: string
  currency: string
}

const PACK_DEFS = [
  { id: 'pack_100', credits: 100, price: '2.99', envKey: 'WAFFO_PRODUCT_PACK_100' },
  { id: 'pack_500', credits: 500, price: '12.99', envKey: 'WAFFO_PRODUCT_PACK_500' },
  { id: 'pack_1500', credits: 1500, price: '29.99', envKey: 'WAFFO_PRODUCT_PACK_1500' },
] as const

/** 已配置 productId 的套餐（服务端使用，含 productId） */
export function getPacks(): CreditPack[] {
  return PACK_DEFS.flatMap((def) => {
    const productId = process.env[def.envKey]
    if (!productId) return []
    return [{ id: def.id, credits: def.credits, price: def.price, currency: 'USD', productId }]
  })
}

export function getPack(id: string): CreditPack | undefined {
  return getPacks().find((p) => p.id === id)
}

/** 前端可展示的套餐信息（不含内部 productId） */
export function getPublicPacks(): CreditPackOption[] {
  return getPacks().map(({ id, credits, price, currency }) => ({ id, credits, price, currency }))
}
