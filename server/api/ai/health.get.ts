import { isAIConfigured } from '../../utils/ai'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  await requireAuth(event)

  const config = useRuntimeConfig()

  const hasApiKeyInConfig = !!config.aiApiKey
  const configured = isAIConfigured(event)

  return {
    configured,
    model: configured ? config.aiModel : null,
    sources: {
      apiKeyFromConfig: hasApiKeyInConfig,
    },
    hint: !configured
      ? 'Set NUXT_AI_API_KEY in your environment (local .env or EdgeOne Makers console).'
      : 'AI service is ready',
  }
})
