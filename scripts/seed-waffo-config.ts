// 将 Waffo 配置从 .env 写入数据库 app_config 表（一次性初始化）。
// 运行时（server/utils/config.ts）从数据库读取，不走环境变量。
//
// 用法：
//   npx tsx scripts/seed-waffo-config.ts
//
// 会写入的 key（若 .env 中对应变量非空）：
//   waffo.merchantId           ← WAFFO_MERCHANT_ID
//   waffo.privateKey           ← WAFFO_PRIVATE_KEY
//   waffo.product.pack_100     ← WAFFO_PRODUCT_PACK_100
//   waffo.product.pack_500     ← WAFFO_PRODUCT_PACK_500
//   waffo.product.pack_1500    ← WAFFO_PRODUCT_PACK_1500
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MAPPINGS: Array<[string, string | undefined]> = [
  ['waffo.merchantId', process.env.WAFFO_MERCHANT_ID],
  ['waffo.privateKey', process.env.WAFFO_PRIVATE_KEY],
  ['waffo.product.pack_100', process.env.WAFFO_PRODUCT_PACK_100],
  ['waffo.product.pack_500', process.env.WAFFO_PRODUCT_PACK_500],
  ['waffo.product.pack_1500', process.env.WAFFO_PRODUCT_PACK_1500],
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
