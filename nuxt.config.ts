// Nuxt 3 config — Cloudflare Workers (cloudflare-module) + D1 + Prisma
// Note: @sidebase/nuxt-auth module is registered in Step 2 (with auth config) to keep
// the Step 1 dev server focused on the D1/Prisma chain.
// `nitro-cloudflare-dev` is a Nuxt module (its default export hooks nitro:config);
// it auto-discovers wrangler.jsonc and wires the D1 binding into nuxt dev.
export default defineNuxtConfig({
  compatibilityDate: '2025-07-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', 'nitro-cloudflare-dev', '@nuxtjs/i18n'],
  i18n: {
    // 每种语言都有独立 URL 前缀：/zh-hans/... /zh-hant/... /en/... /ja/...
    // 默认语言 zh-hans 也带前缀，避免默认语言无前缀导致的根路径歧义。
    strategy: 'prefix',
    defaultLocale: 'zh-hans',
    langDir: 'locales',
    locales: [
      { code: 'zh-hans', language: 'zh-Hans', name: '简体中文', file: 'zh-hans.json' },
      { code: 'zh-hant', language: 'zh-Hant', name: '繁體中文', file: 'zh-hant.json' },
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
      { code: 'ja', language: 'ja', name: '日本語', file: 'ja.json' },
    ],
    lazy: true,
    // 根路径 / 自动重定向到浏览器偏好语言（带前缀），cookie 记忆选择。
    // redirectOn: 'root' 只在访问 / 时重定向，子路径不强制，避免循环跳转。
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'zh-hans',
    },
    bundle: {
      optimizeTranslationDirective: false,
    },
  },
  css: ['~/assets/css/main.css'],
  nitro: {
    preset: 'cloudflare-module',
    // Required for Prisma's WASM query engine on Cloudflare Workers.
    // `@prisma/client` (edge runtime) imports `./query_engine_bg.wasm?module`,
    // where the `?module` suffix is a wrangler-specific WebAssembly ESM import.
    // Rollup does not understand this suffix by default and fails the build
    // with ENOENT. `experimental.wasm` teaches Nitro/Rollup to handle it.
    // See https://github.com/prisma/prisma/issues/23500
    experimental: {
      wasm: true,
    },
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
      htmlAttrs: { lang: 'zh-Hans' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'AI 驱动的多语言句子翻译 / 改写 / 语法特训练习平台' },
      ],
    },
  },
})
