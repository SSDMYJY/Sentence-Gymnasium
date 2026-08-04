// 支付宝电脑网站支付 SDK 客户端（alipay-sdk v4）。
// 配置（APPID / 商户私钥 / 支付宝公钥 / 网关 / 回调地址等）全部从数据库 app_config 表读取，
// 不走环境变量（规避 EdgeOne 环境变量长度限制，且支持运行时动态更新）。
// 每次调用从（带 60s 缓存的）配置读取并构建 SDK 实例，确保配置变更后无需重启即可生效。
// 仅服务端使用 — 绝不把私钥暴露给浏览器。
import { AlipaySdk } from 'alipay-sdk'
import type { AlipaySdkConfig, AlipaySdkSignType } from 'alipay-sdk'
import { createError } from 'h3'
import { getConfigValue } from './config'

export interface AlipayRuntimeConfig {
  appId: string
  privateKey: string
  alipayPublicKey: string
  signType: AlipaySdkSignType
  gateway: string
  keyType: 'PKCS1' | 'PKCS8'
  notifyUrl: string
  returnUrl: string
  usdToCnyRate: number // USD → CNY 换算汇率（站点以美元计价，支付宝以人民币结算）
}

const DEFAULT_GATEWAY = 'https://openapi.alipay.com/gateway.do'
const SANDBOX_GATEWAY = 'https://openapi-sandbox.dl.alipaydev.com/gateway.do'
/** 默认 USD → CNY 汇率（可由 app_config alipay.usdToCnyRate 覆盖） */
const DEFAULT_USD_TO_CNY_RATE = 7.9

/**
 * 读取支付宝完整配置（带 60s 缓存）。
 * notifyUrl / returnUrl 优先取数据库配置，留空时由 siteUrl 自动推导。
 * 关键字段（appId / privateKey / alipayPublicKey）缺失时抛 500。
 */
export async function getAlipayConfig(): Promise<AlipayRuntimeConfig> {
  const [appId, privateKey, alipayPublicKey, signType, gateway, keyType, sandbox, notifyUrl, returnUrl, usdToCnyRateStr] = await Promise.all([
    getConfigValue('alipay.appId'),
    getConfigValue('alipay.privateKey'),
    getConfigValue('alipay.publicKey'),
    getConfigValue('alipay.signType'),
    getConfigValue('alipay.gateway'),
    getConfigValue('alipay.keyType'),
    getConfigValue('alipay.sandbox'),
    getConfigValue('alipay.notifyUrl'),
    getConfigValue('alipay.returnUrl'),
    getConfigValue('alipay.usdToCnyRate'),
  ])

  if (!appId || !privateKey || !alipayPublicKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Alipay is not configured — set alipay.appId / alipay.privateKey / alipay.publicKey in the app_config table (scripts/seed-alipay-config.ts).',
    })
  }

  const siteUrl = ((useRuntimeConfig().public?.siteUrl as string) || '').replace(/\/+$/, '')
  const gw = gateway || (sandbox === 'true' ? SANDBOX_GATEWAY : DEFAULT_GATEWAY)

  return {
    appId,
    privateKey,
    alipayPublicKey,
    signType: (signType as AlipaySdkSignType) || 'RSA2',
    gateway: gw,
    // 支付宝密钥工具默认生成 PKCS8；若用户使用 PKCS1 可通过 alipay.keyType 覆盖
    keyType: (keyType as 'PKCS1' | 'PKCS8') || 'PKCS8',
    notifyUrl: notifyUrl || (siteUrl ? `${siteUrl}/api/webhooks/alipay` : ''),
    returnUrl: returnUrl || (siteUrl ? `${siteUrl}/api/credits/alipay/return` : ''),
    // 站点以美元计价，支付宝以人民币结算；汇率默认 7.9，可通过 alipay.usdToCnyRate 动态调整
    usdToCnyRate: usdToCnyRateStr ? parseFloat(usdToCnyRateStr) || DEFAULT_USD_TO_CNY_RATE : DEFAULT_USD_TO_CNY_RATE,
  }
}

/**
 * 构建支付宝 SDK 实例（每次从最新配置构建，支持动态更新）。
 * AlipaySdk 构造函数仅做密钥格式化（字符串操作），无 I/O，按请求构建开销可忽略。
 */
export async function useAlipay(): Promise<{ sdk: AlipaySdk; config: AlipayRuntimeConfig }> {
  const cfg = await getAlipayConfig()
  const sdkConfig: AlipaySdkConfig = {
    appId: cfg.appId,
    privateKey: cfg.privateKey,
    alipayPublicKey: cfg.alipayPublicKey,
    signType: cfg.signType,
    gateway: cfg.gateway,
    keyType: cfg.keyType,
  }
  const sdk = new AlipaySdk(sdkConfig)
  return { sdk, config: cfg }
}

/** 是否已配置支付宝（前端套餐展示 / 支付方式可用性判断用） */
export async function isAlipayConfigured(): Promise<boolean> {
  const [appId, privateKey, alipayPublicKey] = await Promise.all([
    getConfigValue('alipay.appId'),
    getConfigValue('alipay.privateKey'),
    getConfigValue('alipay.publicKey'),
  ])
  return !!(appId && privateKey && alipayPublicKey)
}

/**
 * 将美元金额（字符串，如 "2.99"）按汇率换算为人民币金额（字符串，固定两位小数）。
 * 采用「先转整数美分 → 乘汇率 → 四舍五入到分」的方式，规避浮点累积误差。
 * 例：usdToCny("2.99", 7.9) → "23.62"
 */
export function usdToCny(usdPrice: string, rate: number = DEFAULT_USD_TO_CNY_RATE): string {
  const usdCents = Math.round(parseFloat(usdPrice) * 100)
  const cnyCents = Math.round(usdCents * rate)
  return (cnyCents / 100).toFixed(2)
}

/**
 * 生成唯一业务订单号（Alipay out_trade_no，≤64 字符）。
 * 格式：SG + yyyyMMddHHmmss + 6 位随机数，同一秒内 100 万种组合，碰撞概率可忽略。
 */
export function generateOutTradeNo(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const ts =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  const rand = Math.floor(Math.random() * 1e6).toString().padStart(6, '0')
  return `SG${ts}${rand}`
}
