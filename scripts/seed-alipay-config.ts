// 将支付宝配置从 .env 写入数据库 app_config 表（一次性初始化）。
// 运行时（server/utils/alipay.ts）从数据库读取，不走环境变量。
//
// 用法：
//   npx tsx scripts/seed-alipay-config.ts
//
// 会写入的 key（若 .env 中对应变量非空）：
//   alipay.appId        ← ALIPAY_APP_ID          (必填)
//   alipay.privateKey   ← ALIPAY_PRIVATE_KEY     (必填，商户应用私钥)
//   alipay.publicKey    ← ALIPAY_PUBLIC_KEY      (必填，支付宝公钥)
//   alipay.signType     ← ALIPAY_SIGN_TYPE       (默认 RSA2)
//   alipay.gateway      ← ALIPAY_GATEWAY         (默认正式网关；沙箱可设 alipay.sandbox=true)
//   alipay.keyType      ← ALIPAY_KEY_TYPE        (默认 PKCS8，与支付宝密钥工具默认输出一致)
//   alipay.sandbox      ← ALIPAY_SANDBOX         ('true' / 'false'，留空按正式环境)
//   alipay.notifyUrl    ← ALIPAY_NOTIFY_URL      (留空则由 NUXT_PUBLIC_SITE_URL 推导)
//   alipay.returnUrl    ← ALIPAY_RETURN_URL      (留空则由 NUXT_PUBLIC_SITE_URL 推导)
//   alipay.usdToCnyRate ← ALIPAY_USD_TO_CNY_RATE (默认 7.9；站点美元计价、支付宝人民币结算的换算汇率)
//
// 私钥 / 公钥可直接粘贴纯 base64 内容（不含 PEM 头尾），SDK 会自动补齐格式。
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MAPPINGS: Array<[string, string | undefined]> = [
  ['alipay.appId', process.env.ALIPAY_APP_ID],
  ['alipay.privateKey', process.env.ALIPAY_PRIVATE_KEY],
  ['alipay.publicKey', process.env.ALIPAY_PUBLIC_KEY],
  ['alipay.signType', process.env.ALIPAY_SIGN_TYPE],
  ['alipay.gateway', process.env.ALIPAY_GATEWAY],
  ['alipay.keyType', process.env.ALIPAY_KEY_TYPE],
  ['alipay.sandbox', process.env.ALIPAY_SANDBOX],
  ['alipay.notifyUrl', process.env.ALIPAY_NOTIFY_URL],
  ['alipay.returnUrl', process.env.ALIPAY_RETURN_URL],
  ['alipay.usdToCnyRate', process.env.ALIPAY_USD_TO_CNY_RATE],
]

async function main() {
  let count = 0
  for (const [key, value] of MAPPINGS) {
    if (!value) {
      console.log(`[skip] ${key} (empty)`)
      continue
    }
    await prisma.appConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
    console.log(`[set]  ${key}`)
    count++
  }
  console.log(`\nDone. ${count} config entries written to app_config.`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err?.message ?? err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
