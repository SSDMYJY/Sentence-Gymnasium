<template>
  <div ref="rootRef" class="home-page">
    <section class="js-hero relative min-h-svh w-full overflow-hidden">
      <img
        :src="heroImg"
        alt=""
        aria-hidden="true"
        class="js-hero-image absolute inset-0 h-full w-full object-cover will-change-transform"
        loading="eager"
        fetchpriority="high"
      />
      <div class="absolute inset-0 bg-linear-to-r from-ink-950 via-ink-950/85 to-ink-950/20" />
      <div class="absolute inset-0 bg-linear-to-t from-ink-950 via-transparent to-ink-950/50" />

      <div class="js-hero-copy relative z-10 mx-auto flex min-h-svh max-w-7xl flex-col justify-center px-6 pb-20 pt-28 will-change-transform">
        <div class="max-w-2xl">
          <p class="js-hero-item text-xs uppercase tracking-[var(--tracking-eyebrow)] text-accent-soft sm:text-sm">
            {{ t('hero.eyebrow') }}
          </p>

          <h1 class="js-hero-item mt-6 font-display text-5xl font-bold leading-[0.95] tracking-tightest sm:text-7xl lg:text-8xl">
            Sentence<br />Gymnasium
          </h1>

          <p class="js-hero-item mt-5 font-display text-xl text-secondary sm:text-2xl">
            {{ t('hero.subtitle') }}
          </p>

          <p class="js-hero-item mt-5 max-w-xl leading-relaxed text-tertiary">
            {{ t('hero.body') }}
          </p>

          <div class="js-hero-item mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#boards"
              class="js-hero-cta-primary group inline-flex items-center gap-2 bg-accent px-7 py-3.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft/70"
            >
              {{ t('hero.ctaPrimary') }}
              <UIcon name="i-lucide-arrow-right" class="js-hero-cta-arrow inline-block" />
            </a>
            <a
              href="#flow"
              class="js-hero-cta-secondary inline-flex items-center gap-2 border border-line-strong px-7 py-3.5 text-sm font-medium text-secondary transition-colors hover:border-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              {{ t('hero.ctaSecondary') }}
            </a>
          </div>
        </div>
      </div>

      <div class="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div class="js-scroll-hint text-[10px] uppercase tracking-[var(--tracking-eyebrow)] text-muted">
          {{ t('hero.scroll') }}
        </div>
      </div>
    </section>

    <section id="boards" class="relative border-t border-line-subtle">
      <div class="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div class="js-direction-reveal max-w-2xl">
          <p class="ds-eyebrow">{{ t('boards.eyebrow') }}</p>
          <h2 class="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            {{ t('boards.title') }}
          </h2>
          <p class="mt-4 leading-relaxed text-tertiary">
            {{ t('boards.body') }}
          </p>
        </div>

        <div class="boards-grid mt-16 grid grid-cols-1 border-t border-line-default md:grid-cols-3">
          <NuxtLink
            v-for="b in boards"
            :key="b.no"
            :to="b.to"
            class="js-direction-reveal js-board-card group relative border-b border-line-default px-6 py-10 transition-colors hover:bg-hover-subtle sm:px-8 md:border-b-0 md:border-r md:last:border-r-0 will-change-transform"
          >
            <span class="js-board-line absolute left-0 top-0 h-px w-full origin-left scale-x-0 bg-accent" />
            <span class="block font-display text-sm text-muted">{{ b.no }}</span>
            <span class="mt-6 block font-display text-2xl font-semibold">{{ b.title }}</span>
            <span class="mt-1 block text-sm text-accent-soft">{{ b.subtitle }}</span>
            <p class="mt-4 text-sm leading-relaxed text-tertiary">{{ b.desc }}</p>
            <span class="mt-8 inline-flex items-center gap-2 text-sm text-tertiary transition-colors group-hover:text-primary">
              {{ t('boards.enter') }}
              <UIcon name="i-lucide-arrow-right" class="js-board-arrow inline-block" />
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section id="flow" class="relative border-t border-line-subtle bg-elevated">
      <div class="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div class="js-direction-reveal max-w-2xl">
          <p class="ds-eyebrow">{{ t('flow.eyebrow') }}</p>
          <h2 class="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            {{ t('flow.title') }}
          </h2>
          <p class="mt-4 leading-relaxed text-tertiary">
            {{ t('flow.body') }}
          </p>
        </div>

        <ol class="flow-grid mt-16 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4">
          <li
            v-for="s in steps"
            :key="s.no"
            class="js-direction-reveal js-flow-step relative border-t border-line-default pt-8"
          >
            <span class="js-flow-line absolute left-0 top-0 h-px w-10 origin-left scale-x-0 bg-accent" />
            <span class="font-display text-sm text-accent">{{ s.no }}</span>
            <h3 class="mt-5 font-display text-xl font-semibold">{{ s.title }}</h3>
            <p class="mt-1 text-sm text-muted">{{ s.caption }}</p>
            <p class="mt-4 text-sm leading-relaxed text-tertiary">{{ s.desc }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="relative border-t border-line-subtle">
      <div class="mx-auto max-w-5xl px-6 py-28 text-center sm:py-36">
        <h2 class="js-reveal font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          {{ t('cta.title') }}
        </h2>
        <p class="js-reveal mt-6 text-tertiary">
          {{ t('cta.body') }}
        </p>
        <div class="js-reveal mt-10 flex flex-wrap items-center justify-center gap-4">
          <UButton
            :to="localePath('/practice')"
            size="xl"
            class="group bg-accent justify-start! text-ink-950 hover:bg-accent-soft"
          >
            {{ t('cta.button') }}
            <template #trailing>
              <UIcon name="i-lucide-arrow-right" class="transition-transform group-hover:translate-x-0.5" />
            </template>
          </UButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()

// ===== SEO + GEO Optimization =====
const { canonicalHref, currentLocale, siteUrl } = useSeo({
  title: {
    'zh-hans': '句子健身房 · AI 多语言句子训练平台',
    'zh-hant': '句子健身房 · AI 多語言句子訓練平台',
    'en':      'Sentence Gymnasium · AI Multilingual Sentence Training',
    'ja':      'センテンスジム · AI 多言語センテンストレーニング',
  },
  description: {
    'zh-hans': 'AI 驱动的中日英三语句子训练平台。翻译练习、同义改写、语法特训三种模式闭环，智能出题、即时反馈、题目复用，支持 JLPT/托福/雅思/TOEIC 备考。',
    'zh-hant': 'AI 驅動的中日英三語句子訓練平台。翻譯練習、同義改寫、語法特訓三種模式閉環，智能出題、即時反饋、題目復用，支援 JLPT/托福/雅思/TOEIC 備考。',
    'en':      'AI-powered multilingual sentence training for Chinese, Japanese and English. Translation drills, paraphrasing practice and grammar focus — closed-loop AI grading with instant feedback. Perfect for JLPT, TOEFL, IELTS and TOEIC prep.',
    'ja':      'AIを活用した中国語・日本語・英語のセンテンストレーニングプラットフォーム。翻訳ドリル・言い換え練習・文法特訓の3モードで閉ループ学習。JLPT・TOEFL・IELTS・TOEIC対策に最適。',
  },
  keywords: {
    'zh-hans': 'AI日语学习,AI英语学习,中文训练,翻译练习网站,句子改写工具,JLPT N1,JLPT N2,托福写作,雅思口语,语法在线练习,多语言学习平台,在线日语课,英语AI批改',
    'zh-hant': 'AI日文學習,AI英文學習,翻譯練習網站,句子改寫工具,JLPT考古題,托福寫作,雅思口說,文法線上練習,多語言學習平台',
    'en':      'AI Japanese course,AI English practice,Chinese language app,translation drill,JLPT online,TOEFL writing AI,IELTS speaking,grammar checker free,paraphrasing tool,language learning website',
    'ja':      'AI英語学習,AI中国語学習,翻訳ドリル,言い換えツール,JLPT N1対策,TOEIC スコアアップ,英文添削AI,文法オンライン',
  },
  ogType: 'website',
})

// 首页注入重量级 JSON-LD：WebSite + Organization + 10 个 GEO LocalBusiness
const siteNameByLocale = (config.public?.siteName as Record<string, string>)?.[currentLocale] || 'Sentence Gymnasium'
const homeSchemas = buildHomeSchemas({
  siteUrl,
  locale: currentLocale,
  siteName: siteNameByLocale,
})
// 面包屑（首页）
const breadcrumb = buildBreadcrumb({
  siteUrl,
  locale: currentLocale,
  crumbs: [{ name: siteNameByLocale, url: canonicalHref }],
})
// 三种训练模式的 Course schema（因训练页受 auth 保护，挂到首页公开索引）
const coursePractice = buildCourse({
  siteUrl,
  pagePath: `/${currentLocale}/practice`,
  locale: currentLocale,
  mode: 'practice',
  providerName: siteNameByLocale,
  title: {
    'zh-hans': '翻译练习 · 中日英互译',
    'zh-hant': '翻譯練習 · 中日英互譯',
    'en':      'Translation Practice · EN-JP-ZH Drills',
    'ja':      '翻訳ドリル · 日中英三言語',
  },
  description: {
    'zh-hans': '覆盖 ja-en、en-ja、zh-ja、zh-en 四个语言方向的 AI 翻译练习，三级难度 + 数十组真实场景，支持 JLPT、TOEIC、雅思备考。',
    'zh-hant': '覆蓋 ja-en、en-ja、zh-ja、zh-en 四個語言方向的 AI 翻譯練習，三級難度 + 數十組真實場景。',
    'en':      'AI-powered translation drills across 4 language pairs (ja-en, en-ja, zh-ja, zh-en), 3 difficulty levels, dozens of real-life scenarios. Ideal for JLPT, TOEIC and IELTS prep.',
    'ja':      'AI による 4 言語ペア（日英・英日・中日・中英）の翻訳ドリル。3 難易度・数十の実生活シチュエーション。JLPT・TOEIC・IELTS 対策に最適。',
  },
})
const courseParaphrase = buildCourse({
  siteUrl,
  pagePath: `/${currentLocale}/paraphrase`,
  locale: currentLocale,
  mode: 'paraphrase',
  providerName: siteNameByLocale,
  title: {
    'zh-hans': '句子改写 · 同义表达训练',
    'zh-hant': '句子改寫 · 同義表達訓練',
    'en':      'Paraphrase Training · Rewrite Japanese & English',
    'ja':      '言い換えトレーニング · 日本語・英語の同義表現',
  },
  description: {
    'zh-hans': '日语和英语源文本的同义改写训练，AI 同时评分原意保留度和自然度，适合中高级学习者突破表达瓶颈。',
    'zh-hant': '日語和英語源文本的同義改寫訓練，AI 同時評分原意保留度和自然度。',
    'en':      'Paraphrasing drills from Japanese or English source text. AI rates both meaning fidelity and naturalness — perfect for intermediate+ learners.',
    'ja':      '日本語・英語の原文を同義表現に言い換える練習。AI が意味の忠実さと自然さを同時に評価。中上級学習者の表現力強化に最適。',
  },
})
const courseGrammar = buildCourse({
  siteUrl,
  pagePath: `/${currentLocale}/grammar`,
  locale: currentLocale,
  mode: 'grammar',
  providerName: siteNameByLocale,
  title: {
    'zh-hans': '语法特训 · 日语英语专项突破',
    'zh-hant': '語法特訓 · 日語英語專項突破',
    'en':      'Grammar Focus · Japanese & English Tag-based Drills',
    'ja':      '文法特訓 · 日本語・英語 タグ別演習',
  },
  description: {
    'zh-hans': '按语法标签精准刷题：日语 te-form、助词、敬语；英语现在完成时、被动、条件句、关系从句。题型覆盖填空、选择、改错。',
    'zh-hant': '按語法標籤精準刷題：日語 te-form、助詞、敬語；英語現在完成時、被動、條件句、關係從句。',
    'en':      'Tag-based grammar drills: Japanese te-form, particles, honorifics; English present perfect, passive, conditionals, relative clauses. Fill-blank, MCQ and error correction.',
    'ja':      '文法タグ別ピンポイント演習：日本語のて形・助詞・敬語、英語の現在完了・受動態・条件文・関係代名詞。穴埋め・選択・誤り訂正に対応。',
  },
})
// FAQPage schema — 常见问题（针对 GEO 各市场）
const faqPage = buildFaqPage({
  locale: currentLocale,
  items: [
    {
      question: {
        'zh-hans': '句子健身房支持哪些语言的训练？',
        'en':      'Which languages does Sentence Gymnasium support?',
        'ja':      'センテンスジムはどの言語に対応していますか？',
      },
      answer: {
        'zh-hans': '句子健身房覆盖中文、日文、英文三种语言。翻译练习支持 ja-en、en-ja、zh-ja、zh-en 四个方向；改写训练支持日语和英语；语法特训按日语和英语各自的语法标签展开。',
        'en':      'Sentence Gymnasium covers 3 languages: Chinese, Japanese and English. Translation drills span 4 pairs (ja-en, en-ja, zh-ja, zh-en); paraphrasing is for Japanese and English; grammar focus drills use language-specific tags.',
        'ja':      'センテンスジムは中国語・日本語・英語の 3 言語に対応。翻訳ドリルは 4 ペア（日英・英日・中日・中英）、言い換えは日本語と英語、文法特訓は言語別のタグで展開します。',
      },
    },
    {
      question: {
        'zh-hans': '题目是 AI 生成还是固定题库？',
        'en':      'Are questions AI-generated or from a fixed bank?',
        'ja':      '問題は AI 生成ですか、固定問題集ですか？',
      },
      answer: {
        'zh-hans': '每次题目由 AI 动态生成，并且自动入库复用。相同语言对、难度和场景组合下会优先复用历史题目，训练越多出题越快。',
        'en':      'Every question is generated dynamically by AI and then pooled for reuse. The same language pair + difficulty + scenario combo reuses existing questions first — the more you train, the faster it gets.',
        'ja':      'すべての問題は AI が動的に生成し、自動的にデータベースに蓄積されて再利用されます。同じ言語ペア・難易度・シチュエーションの組み合わせでは過去問を優先利用するため、練習するほど出題が高速化します。',
      },
    },
    {
      question: {
        'zh-hans': '新用户有免费额度吗？',
        'en':      'Do new users get a free trial?',
        'ja':      '新規ユーザーは無料枠がありますか？',
      },
      answer: {
        'zh-hans': '有。新用户注册即赠 20 Credits 免费体验金，每次训练消耗 1 Credits。无需绑定信用卡，注册后即可开始训练。',
        'en':      'Yes. Every new user gets 20 free credits on sign-up — each training question costs 1 credit. No credit card required; start training right after registration.',
        'ja':      'はい。新規登録者には 20 クレジットを無料プレゼント。1 問あたり 1 クレジット消費します。クレジットカード不要で、登録後すぐにトレーニングを開始できます。',
      },
    },
    {
      question: {
        'zh-hans': '适合 JLPT 或托福雅思备考吗？',
        'en':      'Is it suitable for JLPT / TOEFL / IELTS preparation?',
        'ja':      'JLPT や TOEFL / IELTS の対策に適していますか？',
      },
      answer: {
        'zh-hans': '适合。翻译练习覆盖 JLPT N1/N2/N3、TOEFL、IELTS、TOEIC 常见话题场景；语法特训支持现在完成时、te-form、敬语等考试高频语法标签。',
        'en':      'Absolutely. Translation drills cover scenarios common in JLPT N1/N2/N3, TOEFL, IELTS and TOEIC; grammar focus drills include high-frequency tags like present perfect, te-form and honorifics.',
        'ja':      'はい、最適です。翻訳ドリルは JLPT N1/N2/N3、TOEFL、IELTS、TOEIC で頻出のシチュエーションをカバー。文法特訓では現在完了・て形・敬語など、試験頻出のタグを中心に演習できます。',
      },
    },
    {
      question: {
        'zh-hans': '训练记录会保存吗？',
        'en':      'Are training records saved?',
        'ja':      'トレーニング記録は保存されますか？',
      },
      answer: {
        'zh-hans': '会。每一次作答、AI 判题结果、解释和建议都会保存到你的历史记录。等级、经验、连胜、错题复习系统也均基于历史数据运行。',
        'en':      'Yes. Every attempt, AI judge result, explanation and suggestion is saved to your history. Levels, XP, streaks and the mistake review system all run on top of historical data.',
        'ja':      'はい、保存されます。毎回の回答・AI 判定・解説・提案はすべて履歴に記録されます。レベル・XP・連続日数・間隔反復復習も全て履歴データを元に動作します。',
      },
    },
    {
      question: {
        'zh-hans': '支持哪些地区的用户？支付方式有哪些？',
        'en':      'Which regions do you support, and what payment methods are available?',
        'ja':      'どの地域のユーザーに対応していますか？支払い方法は？',
      },
      answer: {
        'zh-hans': '服务面向全球开放，重点覆盖中国大陆、港澳台、日本、美国、英国、澳大利亚、新加坡、马来西亚、加拿大等地区。充值支持支付宝、微信支付、国际信用卡等方式。',
        'en':      'The service is globally available with an emphasis on Greater China, Japan, the US, UK, Australia, Singapore, Malaysia and Canada. Recharge payments support Alipay, WeChat Pay and major credit cards.',
        'ja':      'サービスはグローバルに提供しており、特に中国（大陸・台湾・香港・マカオ）・日本・米国・英国・オーストラリア・シンガポール・マレーシア・カナダのユーザーを重点対象としています。Alipay・WeChat Pay・主要クレジットカードでクレジット購入可能です。',
      },
    },
  ],
})
useJsonLd([...homeSchemas, breadcrumb, coursePractice, courseParaphrase, courseGrammar, faqPage])

const heroPrompt =
  'cinematic moody photograph of a quiet minimalist study studio at dawn, warm amber rim light falling on an open book and a single wooden chair, deep shadow negative space on the left half, editorial photography, shallow depth of field, no people, no text, no signage, premium magazine aesthetic'
const heroImg = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
  heroPrompt,
)}&image_size=landscape_16_9`

const boardKeys = ['practice', 'paraphrase', 'grammar'] as const
const boards = computed(() =>
  boardKeys.map((k) => ({
    no: t(`boards.${k}.no`),
    title: t(`boards.${k}.title`),
    subtitle: t(`boards.${k}.subtitle`),
    desc: t(`boards.${k}.desc`),
    to: localePath(`/${k}`),
  })),
)

const stepKeys = ['generate', 'answer', 'judge', 'feedback'] as const
const steps = computed(() =>
  stepKeys.map((k) => ({
    no: t(`flow.${k}.no`),
    title: t(`flow.${k}.title`),
    caption: t(`flow.${k}.caption`),
    desc: t(`flow.${k}.desc`),
  })),
)

const rootRef = ref<HTMLElement | null>(null)
useHomeAnimations(rootRef)
</script>

<style scoped>
.home-page :deep(.js-hero-item),
.home-page :deep(.js-reveal),
.home-page :deep(.js-scroll-hint),
.home-page :deep(.js-direction-reveal) {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .home-page :deep(.js-hero-item),
  .home-page :deep(.js-reveal),
  .home-page :deep(.js-scroll-hint),
  .home-page :deep(.js-direction-reveal) {
    opacity: 1;
  }
}
</style>
