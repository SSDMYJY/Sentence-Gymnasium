// Nuxt 3 config — Cloudflare Workers (cloudflare-module) + D1 + Prisma
// 认证采用手写 JWT（jose + bcryptjs），不依赖 @sidebase/nuxt-auth。
// `nitro-cloudflare-dev` is a Nuxt module (its default export hooks nitro:config);
// it auto-discovers wrangler.jsonc and wires the D1 binding into nuxt dev.
export default defineNuxtConfig({
	compatibilityDate: '2025-07-01',
	devtools: { enabled: true },
	modules: ['@nuxt/ui', '@pinia/nuxt', 'nitro-cloudflare-dev', '@nuxtjs/i18n', '@nuxtjs/turnstile'],
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
		experimental: {
			// 禁用 Nitro 侧语言检测/重定向。v10 默认启用此特性，但在 Cloudflare Workers
			// 无状态执行模型下，初始化 event.context.nuxtI18n 的 Nitro 插件无法正确运行，
			// 导致 "Nuxt I18n server context has not been set up yet." 500 错误。
			// 关闭后回退到客户端插件实现，语言检测/重定向仍由 detectBrowserLanguage 配置生效。
			nitroContextDetection: false,
		},
	},
	turnstile: {
		siteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY || '',
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
			configPath: './wrangler.toml',
		},
	},
	runtimeConfig: {
		// server-only secrets — populated from event.context.cloudflare.env in server/plugins (later steps)
		aiApiKey: '',
		aiBaseUrl: 'https://api.openai.com/v1',
		aiModel: 'gpt-4o-mini',
		authSecret: '',
		turnstile: {
			// This can be overridden at runtime via the NUXT_TURNSTILE_SECRET_KEY
			// environment variable.
			secretKey: process.env.NUXT_TURNSTILE_SECRET_KEY || '',
		},
	},
	app: {
		head: {
			title: 'Sentence Gymnasium · 句子健身房',
			htmlAttrs: { lang: 'zh-Hans' },
			meta: [
				{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{ name: 'description', content: 'AI 驱动的多语言句子翻译 / 改写 / 语法特训练习平台' },
				{ name: 'theme-color', content: '#0a0a0b' },
			],
			link: [
				{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
				{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
				{
					rel: 'stylesheet',
					href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap',
				},
				{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
			],
		},
	},
	vite: {
		optimizeDeps: {
			include: [
				'pinia',
			]
		}
	}
})