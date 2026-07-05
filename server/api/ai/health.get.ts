import { isAIConfigured } from '../../utils/ai'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  await requireAuth(event)

  const config = useRuntimeConfig()
  const env = event.context.cloudflare?.env as Record<string, string> | undefined

  // 诊断信息：哪些配置来源可用
  const hasEnvBinding = !!env
  const hasApiKeyInEnv = !!env?.AI_API_KEY
  const hasApiKeyInConfig = !!config.aiApiKey

  const configured = isAIConfigured(event)

  return {
    configured,
    model: configured ? (env?.AI_MODEL || config.aiModel) : null,
    sources: {
      cloudflareEnv: hasEnvBinding,
      apiKeyFromEnv: hasApiKeyInEnv,
      apiKeyFromConfig: hasApiKeyInConfig,
    },
    hint: !configured
      ? 'Set AI_API_KEY in .dev.vars (local) or via `wrangler secret put AI_API_KEY` (prod)'
      : 'AI service is ready',
  }
})
