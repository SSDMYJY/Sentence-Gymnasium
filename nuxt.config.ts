// Nuxt config — Node.js (node-server) + MySQL + Prisma, deployable to EdgeOne Makers
// 认证采用手写 JWT（jose + bcryptjs），不依赖 @sidebase/nuxt-auth。
// Runtime secrets (AI_API_KEY / AUTH_SECRET / ...) 通过 NUXT_ 前缀环境变量注入
// runtimeConfig（本地 .env / EdgeOne Makers 控制台）。
export default defineNuxtConfig({
  compatibilityDate: '2025-07-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/i18n', '@nuxtjs/turnstile', '@nuxt/scripts'],
  i18n: {
    // 每种语言都有独立 URL 前缀：/zh-hans/... /zh-hant/... /en/... /ja/...
    // 默认语言 zh-hans 也带前缀，避免默认语言无前缀导致的根路径歧义。
    strategy: 'prefix',
    defaultLocale: 'zh-hans',
    langDir: 'locales',
    locales: [
      { code: 'zh-hans', language: 'zh-Hans-CN', name: '简体中文', file: 'zh-hans.json' },
      { code: 'zh-hant', language: 'zh-Hant-TW', name: '繁體中文', file: 'zh-hant.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'ja', language: 'ja-JP', name: '日本語', file: 'ja.json' }
    ],

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
    preset: 'node-server',
    compressPublicAssets: true,
    routeRules: {
      '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
      '/favicon.svg': { headers: { 'cache-control': 'public, max-age=604800' } },
      '/logo.svg': { headers: { 'cache-control': 'public, max-age=604800' } },
      '/robots.txt': { headers: { 'cache-control': 'public, max-age=3600, must-revalidate' } },
      '/sitemap.xml': { headers: { 'cache-control': 'public, max-age=3600, must-revalidate' } }
    }
  },
  runtimeConfig: {
    // server-only secrets — populated automatically from NUXT_* env vars:
    // NUXT_AI_API_KEY, NUXT_AI_BASE_URL, NUXT_AI_MODEL, NUXT_AUTH_SECRET, ...
    // Waffo 支付配置（商户 ID / 私钥 / 产品 ID）从数据库 app_config 表读取，
    // 不走环境变量（见 server/utils/config.ts）。
    aiApiKey: '',
    aiBaseUrl: 'https://api.openai.com/v1',
    aiModel: 'gpt-4o-mini',
    authSecret: '',
    turnstile: {
      // This can be overridden at runtime via the NUXT_TURNSTILE_SECRET_KEY
      // environment variable.
      secretKey: process.env.NUXT_TURNSTILE_SECRET_KEY || ''
    },
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://sentencegym.waterspo.top',
      siteName: {
        'zh-hans': '句子健身房',
        'zh-hant': '句子健身房',
        'en': 'Sentence Gymnasium',
        'ja': 'センテンス・ジムネイジアム'
      }
    }
  },
  app: {
    head: {
      title: 'Sentence Gymnasium · 句子健身房 · AI 多语言训练平台',
      htmlAttrs: { lang: 'zh-Hans-CN' },
      meta: [
        // ===== Core SEO =====
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'AI 驱动的多语言句子训练平台，覆盖中日英三语翻译、改写、语法特训。智能出题、即时反馈、题目复用，把每一句练到本能。' },
        { name: 'keywords', content: '日语学习,英语学习,中文学习,AI 翻译练习,语法特训,句子改写,多语言学习,Sentence Gymnasium,句子健身房,JLPT,雅思,托福,日语能力考' },
        { name: 'theme-color', content: '#0a0a0b' },
        { name: 'color-scheme', content: 'dark light' },
        { name: 'waffo-verify', content: '0aee6549557b17c087f3f95978d5e010' },

        // ===== Author & Copyright =====
        { name: 'author', content: 'Sentence Gymnasium Team' },
        { name: 'copyright', content: '© 2026 Sentence Gymnasium. All rights reserved.' },
        { name: 'creator', content: 'Sentence Gymnasium' },
        { name: 'publisher', content: 'Sentence Gymnasium' },

        // ===== Robots =====
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { name: 'googlebot', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { name: 'bingbot', content: 'index, follow, max-image-preview:large, max-snippet:-1' },
        { name: 'baiduspider', content: 'index, follow, max-image-preview:large' },

        // ===== Canonical & Mobile =====
        { name: 'format-detection', content: 'telephone=no, email=no, address=no' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Sentence Gym' },
        { name: 'application-name', content: 'Sentence Gymnasium' },
        { name: 'mobile-web-app-capable', content: 'yes' },

        // ===== Open Graph (Facebook / LinkedIn / 微信) =====
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Sentence Gymnasium · 句子健身房' },
        { property: 'og:title', content: 'Sentence Gymnasium · 句子健身房 · AI 多语言训练平台' },
        { property: 'og:description', content: 'AI 驱动的多语言句子训练平台，翻译/改写/语法三种模式，智能出题即时反馈。' },
        { property: 'og:image', content: '/logo.svg' },
        { property: 'og:image:secure_url', content: '/logo.svg' },
        { property: 'og:image:type', content: 'image/svg+xml' },
        { property: 'og:image:alt', content: 'Sentence Gymnasium Logo' },
        { property: 'og:locale', content: 'zh_CN' },
        { property: 'og:locale:alternate', content: 'zh_TW' },
        { property: 'og:locale:alternate', content: 'en_US' },
        { property: 'og:locale:alternate', content: 'ja_JP' },

        // ===== Twitter Card =====
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@sentencegym' },
        { name: 'twitter:creator', content: '@sentencegym' },
        { name: 'twitter:title', content: 'Sentence Gymnasium · 句子健身房 · AI 多语言训练平台' },
        { name: 'twitter:description', content: 'AI 驱动的多语言句子训练平台，覆盖中日英三语翻译、改写、语法特训。' },
        { name: 'twitter:image', content: '/logo.svg' },
        { name: 'twitter:image:alt', content: 'Sentence Gymnasium Logo' },

        // ===== GEO / Geographic Targeting =====
        { name: 'geo.region', content: 'CN;TW;JP;US;HK;SG;MY' },
        { name: 'geo.placename', content: 'China;Taiwan;Japan;United States;Hong Kong;Singapore;Malaysia' },
        { name: 'geo.position', content: '39.9042;116.4074' },
        { name: 'ICBM', content: '39.9042, 116.4074' },

        // ===== Performance / UX Signals =====
        { name: 'supported-color-schemes', content: 'dark light' },
        { name: 'interactive-widget', content: 'resizes-content' },
        { name: 'referrer', content: 'strict-origin-when-cross-origin' },

        // ===== Rating & Audience =====
        { name: 'rating', content: 'general' },
        { name: 'audience', content: 'general' },
        { name: 'distribution', content: 'global' }
      ],

      link: [
        // ===== Performance: Preconnect =====
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },

        // ===== Fonts (display=swap 防止 FOIT) =====
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap',
          crossorigin: 'anonymous'
        },

        // ===== Icons =====
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg', sizes: 'any' },
        { rel: 'apple-touch-icon', href: '/logo.svg' },
        { rel: 'mask-icon', href: '/logo.svg', color: '#facc15' },
        { rel: 'shortcut icon', href: '/favicon.svg', type: 'image/svg+xml' },

        // ===== SEO: Sitemap =====
        { rel: 'sitemap', type: 'application/xml', title: 'Sitemap', href: '/sitemap.xml' },

        // ===== DNS Prefetch =====
        { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: '//fonts.gstatic.com' }
      ]
    },
    // ===== Page Transition: Reduce CLS =====
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' }
  },
  // ===== Performance: Build Optimizations =====
  features: {
    inlineStyles: true,
    noScripts: false
  },
  experimental: {
    payloadExtraction: true,
    defaults: {
      nuxtLink: {
        prefetch: true
      }
    }
  },
  vite: {
    optimizeDeps: {
      include: [
        'gsap',
        'gsap/ScrollTrigger',
        'pinia'
      ]
    },
    build: {
      cssCodeSplit: true,
      sourcemap: false
    }
  },
  typescript: {
    strict: true,
    typeCheck: false,
    shim: false
  }
});