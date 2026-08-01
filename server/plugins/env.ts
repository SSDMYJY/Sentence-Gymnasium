// 运行时从 process.env 注入 runtimeConfig（本地 .env / EdgeOne Makers 控制台环境变量）。
// 兼容两种命名：非前缀（AI_API_KEY / AUTH_SECRET / WAFFO_*）与 NUXT_ 前缀自动映射。
// 在 Node.js 运行时（EdgeOne Makers Cloud Functions）下 process.env 由平台注入。
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', () => {
    const config = useRuntimeConfig()
    const env = process.env as Record<string, string | undefined>

    if (env.AI_API_KEY) config.aiApiKey = env.AI_API_KEY
    if (env.AI_BASE_URL) config.aiBaseUrl = env.AI_BASE_URL
    if (env.AI_MODEL) config.aiModel = env.AI_MODEL
    if (env.AUTH_SECRET) config.authSecret = env.AUTH_SECRET
    if (env.WAFFO_MERCHANT_ID) config.waffo.merchantId = env.WAFFO_MERCHANT_ID
    // Waffo RSA 私钥（~1700 字节）超过 EdgeOne Makers 环境变量值 500 字节上限，
    // 因此支持三种取值方式，按优先级：
    //   1) WAFFO_PRIVATE_KEY          完整值（本地开发等小环境）
    //   2) WAFFO_PRIVATE_KEY_BASE64   完整 base64（同样受 500 字节限制，仅更短场景）
    //   3) WAFFO_PRIVATE_KEY_PART_1..N 分段拼接（EdgeOne Makers 控制台推荐）
    if (env.WAFFO_PRIVATE_KEY) {
      config.waffo.privateKey = env.WAFFO_PRIVATE_KEY
    } else if (env.WAFFO_PRIVATE_KEY_BASE64) {
      config.waffo.privateKey = Buffer.from(env.WAFFO_PRIVATE_KEY_BASE64, 'base64').toString('utf-8')
    } else {
      const parts: string[] = []
      for (let i = 1; i <= 20; i++) {
        const part = env[`WAFFO_PRIVATE_KEY_PART_${i}`]
        if (!part) break
        parts.push(part)
      }
      if (parts.length > 0) {
        config.waffo.privateKey = parts.join('')
      }
    }
  })
})
