// 运行时从 process.env 注入 runtimeConfig（本地 .env / EdgeOne Makers 控制台环境变量）。
// 兼容两种命名：非前缀（AI_API_KEY / AUTH_SECRET）与 NUXT_ 前缀自动映射。
// 在 Node.js 运行时（EdgeOne Makers Cloud Functions）下 process.env 由平台注入。
// 注意：Waffo 支付配置（商户 ID / 私钥 / 产品 ID）改为从数据库 app_config 表读取，
// 不走环境变量（见 server/utils/config.ts）。
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', () => {
    const config = useRuntimeConfig()
    const env = process.env as Record<string, string | undefined>

    if (env.AI_API_KEY) config.aiApiKey = env.AI_API_KEY
    if (env.AI_BASE_URL) config.aiBaseUrl = env.AI_BASE_URL
    if (env.AI_MODEL) config.aiModel = env.AI_MODEL
    if (env.AUTH_SECRET) config.authSecret = env.AUTH_SECRET
  })
})
