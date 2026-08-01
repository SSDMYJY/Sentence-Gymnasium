// Waffo Pancake 一次性设置脚本：
// 创建/复用 store，为充值套餐创建 onetime 产品（test 环境），并打印 productId。
//
// 运行方式：
//   WAFFO_MERCHANT_ID=<merchant-id> WAFFO_PRIVATE_KEY=<pem> npx tsx scripts/waffo-setup.ts
//
// 步骤：
//   1. 该脚本查询当前商户的 stores：
//      - 无 store → 自动创建
//      - 恰好一个 store → 直接使用
//      - 多个 store → 抛错，请在 dashboard 手动指定
//   2. 为每个套餐创建 onetime 产品（若同名已存在则跳过创建，仅列出）。
//   3. 输出每个套餐的 PROD_xxx id → 填入环境变量：
//      WAFFO_PRODUCT_PACK_100 / WAFFO_PRODUCT_PACK_500 / WAFFO_PRODUCT_PACK_1500
//   4. 联调通过后，请到 Waffo Dashboard 对产品执行 Publish 到生产环境。
//
// 需要 node >= 18；已安装 @waffo/pancake-ts。
import { WaffoPancake } from '@waffo/pancake-ts'

const merchantId = process.env.WAFFO_MERCHANT_ID
const privateKey = process.env.WAFFO_PRIVATE_KEY

if (!merchantId || !privateKey) {
  console.error('Missing WAFFO_MERCHANT_ID or WAFFO_PRIVATE_KEY environment variables.')
  process.exit(1)
}

const client = new WaffoPancake({ merchantId, privateKey })

const PACKS = [
  { key: 'WAFFO_PRODUCT_PACK_100', name: '100 Credits', credits: 100, amount: '2.99' },
  { key: 'WAFFO_PRODUCT_PACK_500', name: '500 Credits', credits: 500, amount: '12.99' },
  { key: 'WAFFO_PRODUCT_PACK_1500', name: '1500 Credits', credits: 1500, amount: '29.99' },
]

async function main() {
  // 1. 确定 store
  const storesResult = await client.graphql.query<{
    stores: Array<{ id: string; name: string }>
  }>({ query: `query { stores { id name } }` })
  const stores = storesResult.data?.stores ?? []

  let storeId: string
  if (stores.length === 0) {
    const { store } = await client.stores.create({ name: 'Sentence Gymnasium' })
    storeId = store.id
    console.log('Created store:', storeId)
  } else if (stores.length === 1) {
    storeId = stores[0].id
    console.log('Using existing store:', storeId, '—', stores[0].name)
  } else {
    console.error(
      'Multiple stores found. Please pick one and set the products manually in the dashboard:',
      stores.map((s) => `${s.id} (${s.name})`).join(', '),
    )
    process.exit(1)
  }

  // 2. 创建/列出产品
  for (const pack of PACKS) {
    let productId: string | null = null

    // 同名产品已存在则复用（避免重复创建）
    const existing = await client.graphql.query<{
      onetimeProducts: Array<{ id: string; name: string }>
    }>({
      query: `query ($storeId: String!) { onetimeProducts(storeId: $storeId) { id name } }`,
      variables: { storeId },
    })
    const found = existing.data?.onetimeProducts?.find((p) => p.name === pack.name)
    if (found) {
      productId = found.id
      console.log(`[skip] ${pack.name} already exists: ${found.id}`)
    } else {
      const { product } = await client.onetimeProducts.create({
        storeId,
        name: pack.name,
        description: `${pack.credits} Sentence Gymnasium credits`,
        prices: { USD: { amount: pack.amount, taxIncluded: false, taxCategory: 'digital_goods' } },
        metadata: { credits: String(pack.credits) },
      })
      productId = product.id
      console.log(`[created] ${pack.name}: ${product.id}`)
    }

    console.log(`\n  ${pack.key}=${productId}`)
  }

  console.log('\nDone. Add the product IDs above to your environment variables.')
  console.log('Then publish products to production from the Waffo Dashboard.')
}

main().catch((err) => {
  console.error('Setup failed:', err?.message ?? err)
  process.exit(1)
})
