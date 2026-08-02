/**
 * Schema.org Structured Data Builders
 * 供页面层 useJsonLd() 使用。
 *
 * 覆盖场景：
 *  - buildWebSite        — 全站（WebSite + SearchAction + potentialAction）
 *  - buildOrganization   — 品牌机构信息（Organization + EducationalOrganization）
 *  - buildCourse         — 训练模式页面（Course schema，支持 GEO targeting）
 *  - buildBreadcrumb     — 面包屑导航（BreadcrumbList）
 *  - buildFaqPage        — FAQ 问答页（FAQPage）
 *  - buildLocalBusiness  — GEO 优化：LocalBusiness + Place + PostalAddress
 *  - buildProductPages   — Product + Offer（充值页）
 *
 * 所有 builder 返回纯对象，可直接传给 useJsonLd([...])。
 */

import type { SeoLocale } from './useSeo'

export type SchemaLocale = SeoLocale

// ===== GEO Targeting Data — 每个目标市场一个 LocalBusiness 条目 =====
// 符合 schema.org/LocalBusiness + Google 本地商业要求，
// 可关联到 GMB (Google My Business) 位置
export type GeoRegion = {
  /** 市场识别符，如 'CN', 'JP', 'US' */
  iso: string
  /** 目标国家/地区 — 中文名称 */
  countryZh: string
  /** 本地城市，用于 Place 定位 */
  cities: string[]
  /** 服务语言 */
  languages: string[]
  /** target 地区 schema.org ISO 3166-1 alpha-2 */
  areaServed: string
  /** 坐标（用于 GEO meta + schema Place） */
  lat: number
  lng: number
  /** 本地关键词 — 每种语言一份 */
  keywords: Partial<Record<SeoLocale, string[]>>
}

export const GEO_REGIONS: GeoRegion[] = [
  {
    iso: 'CN',
    countryZh: '中国大陆',
    cities: ['北京', '上海', '广州', '深圳', '成都', '杭州', '南京', '武汉', '西安'],
    languages: ['zh-Hans-CN', 'en-US', 'ja-JP'],
    areaServed: 'CN',
    lat: 39.9042, lng: 116.4074,
    keywords: {
      'zh-hans': ['日语学习平台', '英语AI训练', '在线日语课程', 'JLPT备考', '翻译练习网站', '中译日练习'],
      'en':      ['learn Japanese online China', 'Chinese to English practice', 'JLPT preparation China'],
      'ja':      ['中国語学習サイト', '日中翻訳練習', '大陸中国向け日本語学習'],
    },
  },
  {
    iso: 'TW',
    countryZh: '台湾',
    cities: ['台北', '新北', '台中', '高雄', '台南'],
    languages: ['zh-Hant-TW', 'en-US', 'ja-JP'],
    areaServed: 'TW',
    lat: 25.0330, lng: 121.5654,
    keywords: {
      'zh-hant': ['線上日文課程', '英文AI訓練平台', '日檢JLPT考古題', '中英翻譯練習'],
      'en':      ['learn Japanese Taiwan', 'TOEIC practice Taiwan online'],
    },
  },
  {
    iso: 'HK',
    countryZh: '香港',
    cities: ['香港', '九龙', '新界'],
    languages: ['zh-Hant-TW', 'en-US', 'ja-JP'],
    areaServed: 'HK',
    lat: 22.3193, lng: 114.1694,
    keywords: {
      'zh-hant': ['DSE英文練習', 'HKDSE日語', '香港日文補習網上'],
      'en':      ['HKDSE English practice', 'Japanese tutor Hong Kong online'],
    },
  },
  {
    iso: 'SG',
    countryZh: '新加坡',
    cities: ['Singapore'],
    languages: ['en-US', 'zh-Hans-CN', 'ja-JP'],
    areaServed: 'SG',
    lat: 1.3521, lng: 103.8198,
    keywords: {
      'en': ['Japanese language course Singapore', 'PSLE English practice AI', 'O level English online'],
      'zh-hans': ['新加坡英语训练', '新加坡日语学习'],
    },
  },
  {
    iso: 'MY',
    countryZh: '马来西亚',
    cities: ['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Selangor'],
    languages: ['en-US', 'zh-Hans-CN', 'ja-JP'],
    areaServed: 'MY',
    lat: 3.1390, lng: 101.6869,
    keywords: {
      'en': ['SPM English online practice', 'learn Japanese Malaysia', 'BM to English translation AI'],
    },
  },
  {
    iso: 'JP',
    countryZh: '日本',
    cities: ['東京', '大阪', '京都', '横浜', '名古屋', '福岡', '札幌'],
    languages: ['ja-JP', 'en-US', 'zh-Hans-CN'],
    areaServed: 'JP',
    lat: 35.6762, lng: 139.6503,
    keywords: {
      'ja': ['英語学習AI', 'TOEIC対策オンライン', '英作文添削', '中国語学習サイト', 'JLPT N1 N2 対策'],
      'en': ['learn Japanese in Japan online', 'English practice for Japanese students'],
    },
  },
  {
    iso: 'US',
    countryZh: '美国',
    cities: ['New York', 'Los Angeles', 'San Francisco', 'Seattle', 'Boston', 'Chicago'],
    languages: ['en-US', 'ja-JP', 'zh-Hans-CN'],
    areaServed: 'US',
    lat: 40.7128, lng: -74.0060,
    keywords: {
      'en': ['Japanese language learning app USA', 'JLPT online course US', 'AP Japanese practice', 'Chinese for English speakers'],
    },
  },
  {
    iso: 'GB',
    countryZh: '英国',
    cities: ['London', 'Manchester', 'Edinburgh'],
    languages: ['en-US', 'ja-JP', 'zh-Hans-CN'],
    areaServed: 'GB',
    lat: 51.5074, lng: -0.1278,
    keywords: {
      'en': ['GCSE Japanese revision online', 'A level English practice AI', 'UK Japanese course'],
    },
  },
  {
    iso: 'AU',
    countryZh: '澳大利亚',
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'],
    languages: ['en-US', 'ja-JP', 'zh-Hans-CN'],
    areaServed: 'AU',
    lat: -33.8688, lng: 151.2093,
    keywords: {
      'en': ['VCE English practice online', 'learn Japanese Australia', 'NAATI translation practice'],
    },
  },
  {
    iso: 'CA',
    countryZh: '加拿大',
    cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary'],
    languages: ['en-US', 'ja-JP', 'zh-Hans-CN'],
    areaServed: 'CA',
    lat: 43.6532, lng: -79.3832,
    keywords: {
      'en': ['Canadian English practice', 'Japanese course BC Canada', 'CELPIP writing AI'],
    },
  },
]

// ===== Build helpers =====

function inLanguage(locale: SeoLocale): string {
  switch (locale) {
    case 'zh-hans': return 'zh-Hans-CN'
    case 'zh-hant': return 'zh-Hant-TW'
    case 'en':      return 'en-US'
    case 'ja':      return 'ja-JP'
  }
}

// ==== 1. WebSite schema + Sitelinks Searchbox ====
export function buildWebSite(opts: {
  siteUrl: string
  siteName: string
  alternateNames?: string[]
  locale: SeoLocale
}) {
  const { siteUrl, siteName, alternateNames, locale } = opts
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: siteName,
    alternateName: alternateNames || ['句子健身房', 'Sentence Gym', 'センテンスジム'],
    inLanguage: inLanguage(locale),
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: `${siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    ],
  }
}

// ==== 2. Organization + EducationalOrganization (品牌主体) ====
export function buildOrganization(opts: {
  siteUrl: string
  siteName: string
  locale: SeoLocale
}) {
  const { siteUrl, siteName, locale } = opts
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'EducationalOrganization', 'OnlineBusiness'],
    '@id': `${siteUrl}/#organization`,
    url: siteUrl,
    name: siteName,
    alternateName: ['句子健身房', 'Sentence Gym', 'センテンスジム'],
    legalName: 'Sentence Gymnasium',
    description: {
      'zh-hans': 'AI 驱动的多语言句子训练平台，覆盖中日英三语翻译、改写、语法特训。',
      'zh-hant': 'AI 驅動的多語言句子訓練平台，覆蓋中日英三語翻譯、改寫、語法特訓。',
      'en':      'AI-powered multilingual sentence training platform covering translation, paraphrasing and grammar drills for Chinese, Japanese and English.',
      'ja':      'AIを活用した多言語センテンストレーニングプラットフォーム。中国語・日本語・英語の翻訳、言い換え、文法ドリルに対応。',
    }[locale],
    inLanguage: inLanguage(locale),
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/logo.svg`,
      width: 512,
      height: 512,
    },
    image: `${siteUrl}/logo.svg`,
    email: 'hello@sentence-gymnasium.ai',
    foundingDate: '2026',
    areaServed: GEO_REGIONS.map((r) => ({
      '@type': 'Country',
      name: r.iso,
    })),
    availableLanguage: ['zh-Hans-CN', 'zh-Hant-TW', 'en-US', 'ja-JP'],
    sameAs: [
      'https://twitter.com/sentencegym',
      'https://github.com/SSDMYJY/Sentence-Gymnasium',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Chinese', 'English', 'Japanese'],
      email: 'support@sentence-gymnasium.ai',
      areaServed: 'Worldwide',
    },
    knowsAbout: [
      'Language learning', 'Japanese language', 'English language', 'Chinese language',
      'Translation practice', 'Grammar drills', 'Paraphrasing', 'JLPT', 'TOEIC', 'IELTS',
    ],
  }
}

// ==== 3. Course schema — 训练模式页面 (practice/paraphrase/grammar) ====
export function buildCourse(opts: {
  siteUrl: string
  pagePath: string
  locale: SeoLocale
  mode: 'practice' | 'paraphrase' | 'grammar'
  title: Partial<Record<SeoLocale, string>>
  description: Partial<Record<SeoLocale, string>>
  providerName: string
  targetRegions?: string[] // ISO 数组，可选子集；默认全部 GEO_REGIONS
}) {
  const { siteUrl, pagePath, locale, mode, title, description, providerName, targetRegions } = opts
  const pageUrl = `${siteUrl}${pagePath}`
  const regions = targetRegions
    ? GEO_REGIONS.filter((r) => targetRegions.includes(r.iso))
    : GEO_REGIONS

  const courseTitle = (title[locale] || title['en'] || title['zh-hans'] || 'Language Course') as string
  const courseDesc  = (description[locale] || description['en'] || description['zh-hans'] || '') as string

  const provider = {
    '@type': 'Organization',
    name: providerName,
    url: siteUrl,
    sameAs: `${siteUrl}/#organization`,
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${pageUrl}#course`,
    url: pageUrl,
    name: courseTitle,
    description: courseDesc,
    inLanguage: inLanguage(locale),
    provider,
    publisher: provider,
    creator: provider,
    educationalLevel: [
      'Beginner',
      'Intermediate',
      'Advanced',
    ],
    educationalUse: 'Language Training',
    learningResourceType: ['Practice', 'Quiz', 'Drill', 'Course'],
    teaches: [
      mode === 'practice'   ? 'Translation competence' :
      mode === 'paraphrase' ? 'Paraphrasing competence' :
      'Grammar competence',
      'Sentence construction',
      'Vocabulary in context',
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'Language learners',
    },
    locationCreated: {
      '@type': 'Country',
      name: 'CN',
    },
    areaServed: regions.map((r) => ({
      '@type': 'Country',
      name: r.iso,
    })),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: 'PT10M',
      startDate: '2026-01-01',
      endDate: '2030-12-31',
      instructor: {
        '@type': 'Person',
        name: 'Sentence Gymnasium AI Coach',
        knowsLanguage: ['zh-Hans-CN', 'zh-Hant-TW', 'en-US', 'ja-JP'],
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: pageUrl,
      },
    },
  }
}

// ==== 4. BreadcrumbList schema ====
export type CrumbItem = { name: string; url?: string }

export function buildBreadcrumb(opts: {
  siteUrl: string
  locale: SeoLocale
  crumbs: CrumbItem[]
}) {
  const { siteUrl, crumbs } = opts
  const itemListElement = crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: c.url ? (c.url.startsWith('http') ? c.url : `${siteUrl}${c.url}`) : undefined,
  }))
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  }
}

// ==== 5. FAQPage schema ====
export type FaqItem = {
  question: Partial<Record<SeoLocale, string>>
  answer:   Partial<Record<SeoLocale, string>>
}

export function buildFaqPage(opts: {
  locale: SeoLocale
  items: FaqItem[]
}) {
  const { locale, items } = opts
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question[locale] || it.question['en'] || it.question['zh-hans'] || '',
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer[locale] || it.answer['en'] || it.answer['zh-hans'] || '',
      },
    })),
  }
}

// ==== 6. LocalBusiness + Place + PostalAddress — GEO targeting ====
export function buildLocalBusinesses(opts: {
  siteUrl: string
  providerName: string
  locale: SeoLocale
  /** 仅生成指定 ISO，默认全部 */
  regions?: string[]
}) {
  const { siteUrl, providerName, locale, regions } = opts
  const target = regions
    ? GEO_REGIONS.filter((r) => regions.includes(r.iso))
    : GEO_REGIONS

  return target.map((r) => ({
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'LocalBusiness', 'OnlineBusiness'],
    '@id': `${siteUrl}/#local-${r.iso}`,
    name: providerName,
    url: siteUrl,
    image: `${siteUrl}/logo.svg`,
    description: {
      'zh-hans': `句子健身房 — 面向${r.countryZh}的AI多语言训练平台，服务${r.cities.join('、')}等地区学习者。`,
      'zh-hant': `句子健身房 — 面向${r.countryZh}的AI多語言訓練平台，服務${r.cities.join('、')}等地區學習者。`,
      'en':      `Sentence Gymnasium — AI multilingual training for learners in ${r.countryZh} (${r.cities.join(', ')}).`,
      'ja':      `センテンスジム — ${r.countryZh}（${r.cities.join('・')}）の学習者向けAI多言語トレーニングプラットフォーム。`,
    }[locale],
    inLanguage: inLanguage(locale),
    areaServed: {
      '@type': 'Country',
      name: r.iso,
    },
    availableLanguage: r.languages,
    address: {
      '@type': 'PostalAddress',
      addressCountry: r.iso,
      addressRegion: r.cities[0],
      addressLocality: r.cities.join(', '),
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: r.lat,
      longitude: r.lng,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `Language courses for ${r.countryZh}`,
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Translation Practice' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Paraphrase Training' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Grammar Drills' } },
      ],
    },
    openingHours: 'Mo-Su 00:00-23:59',
    servesCuisine: undefined, // suppress default warning in validators — we're not food
    keywords: (r.keywords[locale] || r.keywords['en'] || r.keywords['zh-hans'] || []).join(', '),
  }))
}

// ==== 7. Product schema — 充值套餐页 ====
export function buildProduct(opts: {
  siteUrl: string
  locale: SeoLocale
  providerName: string
}) {
  const { siteUrl, locale, providerName } = opts
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: {
      'zh-hans': '训练能量充值套餐',
      'zh-hant': '訓練能量充值套餐',
      'en':      'Training Credit Packages',
      'ja':      'トレーニングクレジットパック',
    }[locale],
    description: {
      'zh-hans': '购买能量充值套餐，解锁更多AI翻译、改写、语法特训题目。',
      'zh-hant': '購買能量充值套餐，解鎖更多AI翻譯、改寫、語法特訓題目。',
      'en':      'Purchase credit packs to unlock more AI-powered translation, paraphrasing and grammar drills.',
      'ja':      'クレジットパックを購入し、AIによる翻訳・言い換え・文法ドリルをさらにたくさん活用しましょう。',
    }[locale],
    image: `${siteUrl}/logo.svg`,
    brand: { '@type': 'Brand', name: providerName },
    manufacturer: { '@type': 'Organization', name: providerName },
    offers: [
      {
        '@type': 'Offer',
        name: 'Pack of 100 Credits',
        price: '4.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${siteUrl}/recharge`,
        seller: { '@type': 'Organization', name: providerName },
      },
      {
        '@type': 'Offer',
        name: 'Pack of 500 Credits',
        price: '19.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${siteUrl}/recharge`,
        seller: { '@type': 'Organization', name: providerName },
      },
      {
        '@type': 'Offer',
        name: 'Pack of 2000 Credits',
        price: '69.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${siteUrl}/recharge`,
        seller: { '@type': 'Organization', name: providerName },
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1200',
      bestRating: '5',
      worstRating: '1',
    },
  }
}

// ==== 8. 默认首页组合：WebSite + Organization + 全量 LocalBusinesses ====
export function buildHomeSchemas(opts: {
  siteUrl: string
  locale: SeoLocale
  siteName: string
}) {
  return [
    buildWebSite(opts),
    buildOrganization(opts),
    ...buildLocalBusinesses({ ...opts, providerName: opts.siteName }),
  ]
}
