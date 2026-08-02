// 临时诊断脚本：查询 Waffo 商户的 store / webhook 注册 / webhook 投递日志。
// 凭据从 app_config 表读取（与运行时一致）。仅用于排查，用完删除。
import { PrismaClient } from '@prisma/client'
import { WaffoPancake } from '@waffo/pancake-ts'

const prisma = new PrismaClient()

const [merchantId, privateKey] = await Promise.all([
  prisma.appConfig.findUnique({ where: { key: 'waffo.merchantId' } }),
  prisma.appConfig.findUnique({ where: { key: 'waffo.privateKey' } }),
])

if (!merchantId?.value || !privateKey?.value) {
  console.error('waffo.merchantId / waffo.privateKey 未配置')
  process.exit(1)
}

const client = new WaffoPancake({ merchantId: merchantId.value, privateKey: privateKey.value })

// 1. 查询 store 与 webhook 注册情况
const storeRes = await client.graphql.query({
  query: `query {
    stores { id name slug status storeWebhooks { id channel url events testMode } }
  }`,
})

console.log('===== STORES & WEBHOOKS =====')
for (const s of storeRes.data?.stores ?? []) {
  console.log(`STORE: ${s.id} (${s.name}) slug=${s.slug} status=${s.status}`)
  if (!s.storeWebhooks?.length) {
    console.log('  ⚠️  未注册任何 webhook！')
  }
  for (const w of s.storeWebhooks ?? []) {
    console.log(`  WEBHOOK: id=${w.id} channel=${w.channel} testMode=${w.testMode}`)
    console.log(`    url=${w.url}`)
    console.log(`    events=${w.events?.join(', ')}`)
  }
}

// 2. 查询 webhook 投递日志（最近 20 条，全部状态）
for (const s of storeRes.data?.stores ?? []) {
  console.log(`\n===== WEBHOOK DELIVERIES (store ${s.id}) =====`)
  const dl = await client.graphql.query({
    query: `query ($storeId: String!) {
      webhookDeliveries(storeId: $storeId, limit: 20) {
        id eventType webhookUrl status httpStatus responseBody attemptCount lastAttemptedAt createdAt
      }
      webhookDeliveriesCount(storeId: $storeId)
    }`,
    variables: { storeId: s.id },
  })
  console.log('投递总数:', dl.data?.webhookDeliveriesCount ?? '?')
  const list = dl.data?.webhookDeliveries ?? []
  if (!list.length) console.log('  （无投递记录 —— webhook 可能未注册或从未触发）')
  for (const d of list) {
    console.log(`  [${d.createdAt}] ${d.eventType} → ${d.webhookUrl}`)
    console.log(`    status=${d.status} http=${d.httpStatus ?? '-'} attempts=${d.attemptCount}`)
    if (d.responseBody) console.log(`    responseBody=${String(d.responseBody).slice(0, 300)}`)
  }
}

await prisma.$disconnect()
