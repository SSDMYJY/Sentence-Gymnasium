/**
 * useSeo — Per-page SEO manager for Sentence Gymnasium
 *
 * 功能：
 *  1. 页面级别 title / description / keywords / OG / Twitter meta
 *  2. canonical URL + 多语言 hreflang alternate
 *  3. JSON-LD 结构化数据注入（useJsonLd）
 *
 * 所有多语言版本自动互链，符合 Google hreflang 规范。
 */

export type SeoLocale = 'zh-hans' | 'zh-hant' | 'en' | 'ja'

export type SeoInput = {
  title: Partial<Record<SeoLocale, string>>
  description: Partial<Record<SeoLocale, string>>
  keywords?: Partial<Record<SeoLocale, string>>
  image?: string
  ogType?: 'website' | 'article' | 'profile' | 'course'
  noindex?: boolean
  public?: boolean
}

const LOCALE_META: Record<SeoLocale, { iso: string; ogLocale: string }> = {
  'zh-hans': { iso: 'zh-Hans-CN', ogLocale: 'zh_CN' },
  'zh-hant': { iso: 'zh-Hant-TW', ogLocale: 'zh_TW' },
  'en':      { iso: 'en-US',     ogLocale: 'en_US' },
  'ja':      { iso: 'ja-JP',     ogLocale: 'ja_JP' },
}

const LOCALE_CODES: SeoLocale[] = ['zh-hans', 'zh-hant', 'en', 'ja']

const BRAND_SUFFIX: Record<SeoLocale, string> = {
  'zh-hans': '· 句子健身房 · AI 多语言训练平台',
  'zh-hant': '· 句子健身房 · AI 多語言訓練平台',
  'en':      '· Sentence Gymnasium · AI Language Training',
  'ja':      '· センテンスジム · AI言語トレーニング',
}

function pick<T>(obj: Partial<Record<SeoLocale, T>>, locale: SeoLocale): T | undefined {
  const order: SeoLocale[] = [locale, 'zh-hans', 'en', 'zh-hant', 'ja']
  for (const l of order) {
    const v = obj[l]
    if (v !== undefined && v !== null && v !== '') return v
  }
  return undefined
}

export function useSeo(input: SeoInput) {
  const route = useRoute()
  const { locale } = useI18n()
  const config = useRuntimeConfig()

  const currentLocale = (locale.value || 'zh-hans') as SeoLocale
  const siteUrl = (config.public?.siteUrl as string) || 'https://sentencegym.waterspo.top'

  const rawTitle = pick(input.title, currentLocale) || ''
  const pageTitle = rawTitle ? `${rawTitle} ${BRAND_SUFFIX[currentLocale]}` : undefined
  const pageDescription = pick(input.description, currentLocale) || ''
  const pageKeywords = pick(input.keywords || {}, currentLocale) || ''
  const ogImage = input.image
    ? (input.image.startsWith('http') ? input.image : `${siteUrl}${input.image}`)
    : `${siteUrl}/logo.svg`
  const ogTypeRaw = input.ogType || 'website'
  // useSeoMeta 只接受有限类型，course 降级为 article
  const safeOgType: 'website' | 'article' | 'profile' =
    ogTypeRaw === 'course' ? 'article' : ogTypeRaw
  const isNoindex = input.noindex === true || input.public === false
  const siteNameMap = config.public?.siteName as Record<string, string> | undefined
  const ogSiteName = siteNameMap?.[currentLocale] || 'Sentence Gymnasium'

  // === Canonical 计算 ===
  const currentPath = route.path.split('?')[0] || '/'
  let purePath = currentPath
  for (const lc of LOCALE_CODES) {
    const prefix = `/${lc}`
    if (purePath === prefix) {
      purePath = '/'
      break
    }
    if (purePath.startsWith(`${prefix}/`)) {
      purePath = purePath.slice(prefix.length) || '/'
      break
    }
  }

  const localeAlternates = LOCALE_CODES.map((lc) => ({
    locale: lc,
    iso: LOCALE_META[lc].iso,
    href: `${siteUrl}/${lc}${purePath === '/' ? '' : purePath}`,
  }))
  const canonicalHref = `${siteUrl}/${currentLocale}${purePath === '/' ? '' : purePath}`
  const xDefaultHref = `${siteUrl}/zh-hans${purePath === '/' ? '' : purePath}`

  // === 1. 用 useSeoMeta 设置核心 meta ===
  useSeoMeta({
    title: pageTitle,
    ogTitle: rawTitle || pageTitle,
    twitterTitle: rawTitle || pageTitle,

    description: pageDescription,
    ogDescription: pageDescription,
    twitterDescription: pageDescription,

    ogUrl: canonicalHref,
    ogLocale: LOCALE_META[currentLocale].ogLocale,

    ogImage,
    ogImageSecureUrl: ogImage,
    ogImageAlt: rawTitle || 'Sentence Gymnasium',
    twitterImage: ogImage,
    twitterImageAlt: rawTitle || 'Sentence Gymnasium',

    ogType: safeOgType,
    ogSiteName,

    twitterCard: 'summary_large_image',
    twitterSite: '@sentencegym',
    twitterCreator: '@sentencegym',

    robots: isNoindex
      ? 'noindex, nofollow, noarchive, nosnippet'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  })

  // === 2. 用 useHead 注入 canonical + hreflang alternate + html lang + keywords meta ===
  const altLinks: Array<{ rel: 'alternate'; hreflang: string; href: string }> =
    localeAlternates.map((a) => ({
      rel: 'alternate' as const,
      hreflang: a.iso,
      href: a.href,
    }))
  altLinks.push({ rel: 'alternate' as const, hreflang: 'x-default', href: xDefaultHref })

  const extraMeta: Array<{ name: string; content: string }> = []
  if (pageKeywords) extraMeta.push({ name: 'keywords', content: pageKeywords })

  useHead({
    title: pageTitle,
    htmlAttrs: {
      lang: LOCALE_META[currentLocale].iso,
    },
    meta: extraMeta,
    link: [
      { rel: 'canonical', href: canonicalHref },
      ...altLinks,
    ],
  })

  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.debug('[useSeo]', {
      locale: currentLocale,
      canonical: canonicalHref,
      title: pageTitle,
      descLen: pageDescription.length,
      noindex: isNoindex,
    })
  }

  return {
    canonicalHref,
    localeAlternates,
    currentLocale,
    siteUrl,
    rawTitle,
    pageDescription,
  }
}

/**
 * useJsonLd — 注入 JSON-LD 结构化数据
 * 传入单个或多个 schema.org 对象（带 @context + @type）
 */
export function useJsonLd(schemas: Record<string, unknown> | Record<string, unknown>[]) {
  const list = Array.isArray(schemas) ? schemas : [schemas]
  useHead({
    script: list.map((schema) => ({
      type: 'application/ld+json' as const,
      innerHTML: JSON.stringify(schema),
    })),
  })
}

export { LOCALE_CODES, LOCALE_META, BRAND_SUFFIX }
