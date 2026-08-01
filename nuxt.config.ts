// Nuxt config — Node.js (node-server) + MySQL + Prisma, deployable to EdgeOne Makers
// 认证采用手写 JWT（jose + bcryptjs），不依赖 @sidebase/nuxt-auth。
// Runtime secrets (AI_API_KEY / AUTH_SECRET / ...) 通过 NUXT_ 前缀环境变量注入
// runtimeConfig（本地 .env / EdgeOne Makers 控制台）。
export default defineNuxtConfig({
  compatibilityDate: '2025-07-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/i18n', '@nuxtjs/turnstile'],
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
    { code: 'ja', language: 'ja', name: '日本語', file: 'ja.json' }],

    // 根路径 / 自动重定向到浏览器偏好语言（带前缀），cookie 记忆选择。
    // redirectOn: 'root' 只在访问 / 时重定向，子路径不强制，避免循环跳转。
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'zh-hans'
    },
    bundle: {
      compositionOnly: true
    },
    experimental: {
      // 禁用 Nitro 侧语言检测/重定向，保持与历史版本一致的客户端实现，
      // 语言检测/重定向仍由 detectBrowserLanguage 配置生效。
      nitroContextDetection: false
    }
  },
  turnstile: {
    siteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY || ''
  },
  css: ['~/assets/css/main.css'],
  nitro: {
    // node-server preset — EdgeOne Makers CLI 对 Nuxt SSR 有原生支持：
    // 部署时注入 ./.edgeone-nitro-config.mjs，将产物输出到 .edgeone/
    // 并作为云函数运行（本地 node .output/server/index.mjs 预览）。
    preset: 'node-server'
  },
  runtimeConfig: {
    // server-only secrets — populated automatically from NUXT_* env vars:
    // NUXT_AI_API_KEY, NUXT_AI_BASE_URL, NUXT_AI_MODEL, NUXT_AUTH_SECRET, ...
    // plus WAFFO_* via server/plugins/env.ts.
    aiApiKey: '',
    aiBaseUrl: 'https://api.openai.com/v1',
    aiModel: 'gpt-4o-mini',
    authSecret: '',
    waffo: {
      // Waffo Pancake payment — populated at runtime from WAFFO_MERCHANT_ID /
      // WAFFO_PRIVATE_KEY env vars (see server/plugins/env.ts). NEVER hardcode
      // keys here.
      merchantId: '',
      privateKey: ''
    },
    turnstile: {
      // This can be overridden at runtime via the NUXT_TURNSTILE_SECRET_KEY
      // environment variable.
      secretKey: process.env.NUXT_TURNSTILE_SECRET_KEY || ''
    }
  },
  app: {
    head: {
      title: 'Sentence Gymnasium · 句子健身房',
      htmlAttrs: { lang: 'zh-Hans' },
      meta: [
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: 'AI 驱动的多语言句子翻译 / 改写 / 语法特训练习平台' },
      { name: 'theme-color', content: '#0a0a0b' }],

      link: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap'
      },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]

    }
  },
  vite: {
    optimizeDeps: {
      include: [
      'gsap',
      'gsap/ScrollTrigger',
      'pinia']

    }
  }
});