// 充值套餐目录（Waffo Pancake onetime 产品映射 + 支付宝电脑网站支付）。
// Waffo productId 从数据库 app_config 表读取（key: waffo.product.pack_100 等），
// 由 `scripts/waffo-setup.ts` / `scripts/seed-waffo-config.ts` 写入。
// 支付宝无需 per-pack 产品 ID：配置好 alipay.appId 等参数后所有套餐均可用。
// 展示目录（getPublicPacks）会合并两个渠道：有 Waffo productId 或 Alipay 已配置的套餐都会出现。
import { getConfigValue } from './config'
import { isAlipayConfigured } from './alipay'

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

/** 基础套餐定义（不含 provider 专属 productId），供支付宝等无需外部产品的渠道使用 */
export interface PackDef {
  id: string
  credits: number
  price: string
  currency: string
}

/** 同步查基础套餐定义（无需数据库读取，PACK_DEFS 为静态目录） */
export function getPackDef(id: string): PackDef | undefined {
  const def = PACK_DEFS.find((p) => p.id === id)
  if (!def) return undefined
  return { id: def.id, credits: def.credits, price: def.price, currency: 'USD' }
}

/** 前端可展示的套餐信息（不含内部 productId） */
export async function getPublicPacks(): Promise<CreditPackOption[]> {
  const waffoPacks = await getPacks()
  const result: CreditPackOption[] = waffoPacks.map(({ id, credits, price, currency }) => ({ id, credits, price, currency }))
  // 支付宝配置后，所有套餐均可用（无需 per-pack 产品 ID），合并未在 Waffo 目录中出现的套餐
  if (await isAlipayConfigured()) {
    const seen = new Set(result.map((p) => p.id))
    for (const def of PACK_DEFS) {
      if (!seen.has(def.id)) {
        result.push({ id: def.id, credits: def.credits, price: def.price, currency: 'USD' })
      }
    }
  }
  return result
}
