// Waffo Pancake 客户端工厂（Merchant API Key 自动签名）。
// 商户 ID 与 RSA 私钥从数据库 app_config 表读取（key: waffo.merchantId / waffo.privateKey），
// 不走环境变量（规避 EdgeOne 环境变量值 500 字节限制）。
// 仅服务端使用 — 绝不把私钥暴露给浏览器。
import { WaffoPancake } from '@waffo/pancake-ts'
import { createError } from 'h3'
import { getConfigValue } from './config'

let _client: WaffoPancake | null = null

export async function useWaffo(): Promise<WaffoPancake> {
  if (_client) return _client

  const [merchantId, privateKey] = await Promise.all([
    getConfigValue('waffo.merchantId'),
    getConfigValue('waffo.privateKey'),
  ])

  if (!merchantId || !privateKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Waffo Pancake is not configured — set waffo.merchantId / waffo.privateKey in the app_config table (scripts/seed-waffo-config.ts).',
    })
  }

  _client = new WaffoPancake({ merchantId, privateKey })
  return _client
}
