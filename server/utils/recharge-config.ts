// 充值套餐目录（Waffo Pancake onetime 产品映射）。
// productId 从数据库 app_config 表读取（key: waffo.product.pack_100 等），
// 由 `scripts/waffo-setup.ts` / `scripts/seed-waffo-config.ts` 写入。
// 未配置 productId 的套餐不会出现在目录中（页面与接口自动过滤）。
import { getConfigValue } from './config'

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
  { id: 'pack_100', credits: 100, price: '2.99', configKey: 'waffo.product.pack_100' },
  { id: 'pack_500', credits: 500, price: '12.99', configKey: 'waffo.product.pack_500' },
  { id: 'pack_1500', credits: 1500, price: '29.99', configKey: 'waffo.product.pack_1500' },
] as const

/** 已配置 productId 的套餐（服务端使用，含 productId） */
export async function getPacks(): Promise<CreditPack[]> {
  const result: CreditPack[] = []
  for (const def of PACK_DEFS) {
    const productId = await getConfigValue(def.configKey)
    if (productId) {
      result.push({ id: def.id, credits: def.credits, price: def.price, currency: 'USD', productId })
    }
  }
  return result
}

export async function getPack(id: string): Promise<CreditPack | undefined> {
  return (await getPacks()).find((p) => p.id === id)
}

/** 前端可展示的套餐信息（不含内部 productId） */
export async function getPublicPacks(): Promise<CreditPackOption[]> {
  return (await getPacks()).map(({ id, credits, price, currency }) => ({ id, credits, price, currency }))
}
