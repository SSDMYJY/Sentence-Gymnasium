// Waffo Pancake 客户端工厂（Merchant API Key 自动签名）。
// 密钥来自 runtimeConfig（由 server/plugins/env.ts 从 process.env 注入）。
// 仅服务端使用 — 绝不把私钥暴露给浏览器。
import { WaffoPancake } from '@waffo/pancake-ts'
import { createError } from 'h3'

let _client: WaffoPancake | null = null

export function useWaffo(): WaffoPancake {
  if (_client) return _client

  const config = useRuntimeConfig()
  const merchantId = config.waffo.merchantId
  const privateKey = config.waffo.privateKey

  if (!merchantId || !privateKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Waffo Pancake is not configured — set WAFFO_MERCHANT_ID and WAFFO_PRIVATE_KEY.',
    })
  }

  _client = new WaffoPancake({ merchantId, privateKey })
  return _client
}
