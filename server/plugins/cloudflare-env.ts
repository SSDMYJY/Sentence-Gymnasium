export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const config = useRuntimeConfig()
    const env = event.context.cloudflare?.env as Record<string, string> | undefined

    if (env) {
      if (env.AI_API_KEY) {
        config.aiApiKey = env.AI_API_KEY
      }
      if (env.AI_BASE_URL) {
        config.aiBaseUrl = env.AI_BASE_URL
      }
      if (env.AI_MODEL) {
        config.aiModel = env.AI_MODEL
      }
      if (env.AUTH_SECRET) {
        config.authSecret = env.AUTH_SECRET
      }
    }
  })
})