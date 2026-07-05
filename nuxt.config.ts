// Nuxt 3 config — Cloudflare Workers (cloudflare-module) + D1 + Prisma
// Note: @sidebase/nuxt-auth module is registered in Step 2 (with auth config) to keep
// the Step 1 dev server focused on the D1/Prisma chain.
// `nitro-cloudflare-dev` is a Nuxt module (its default export hooks nitro:config);
// it auto-discovers wrangler.jsonc and wires the D1 binding into nuxt dev.
export default defineNuxtConfig({
  compatibilityDate: '2025-07-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', 'nitro-cloudflare-dev'],
  css: ['~/assets/css/main.css'],
  nitro: {
    preset: 'cloudflare-module',
    cloudflare: {
      configPath: './wrangler.jsonc',
    },
  },
  runtimeConfig: {
    // server-only secrets — populated from event.context.cloudflare.env in server/plugins (later steps)
    aiApiKey: '',
    aiBaseUrl: 'https://api.openai.com/v1',
    aiModel: 'gpt-4o-mini',
    authSecret: '',
  },
  app: {
    head: {
      title: 'Sentence Gymnasium · 句子健身房',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'AI 驱动的多语言句子翻译 / 改写 / 语法特训练习平台' },
      ],
    },
  },
})
