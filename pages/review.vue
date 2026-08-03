<template>
  <div class="mx-auto max-w-3xl px-6 pb-24 pt-28">
    <header class="mb-10">
      <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {{ t('review.title') }}
      </h1>
      <p class="mt-2 text-tertiary">{{ t('review.subtitle') }}</p>
      <p v-if="dueCount > 0" class="mt-1 text-sm text-accent-soft">
        {{ t('review.dueCount', { count: dueCount }) }}
      </p>
      <p v-else class="mt-1 text-sm text-success">
        {{ t('review.noDue') }}
      </p>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="ds-card p-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      <p class="mt-4 text-sm text-tertiary">{{ t('history.loading') }}</p>
    </div>

    <!-- Empty / All caught up -->
    <div v-else-if="items.length === 0" class="ds-card p-12 text-center">
      <p class="text-4xl">🎉</p>
      <p class="mt-4 text-tertiary">{{ t('review.noDue') }}</p>
      <UButton :to="localePath('/dashboard')" class="mt-6 bg-accent text-ink-950 hover:bg-accent-soft">
        {{ t('auth.dashboard') }}
      </UButton>
    </div>

    <!-- Review Items -->
    <div v-else class="space-y-6">
      <div
        v-for="item in items"
        :key="item.id"
        class="ds-card"
      >
        <!-- Question -->
        <div class="mb-4">
          <p class="ds-label">{{ t('practice.question') }}</p>
          <p class="mt-1 font-display text-lg font-medium text-primary">{{ item.question.questionText }}</p>
        </div>

        <!-- Original Answer -->
        <div class="mb-4 bg-elevated p-4">
          <p class="ds-label">{{ t('review.originalAnswer') }}</p>
          <p class="mt-1 text-tertiary">{{ item.userAnswer }}</p>
        </div>

        <!-- Reference -->
        <div class="mb-4">
          <p class="ds-label">{{ t('practice.referenceAnswer') }}</p>
          <p class="mt-1 text-accent-soft">{{ item.question.correctAnswer }}</p>
        </div>

        <!-- Your New Answer -->
        <div class="mb-4">
          <label class="block ds-label">{{ t('review.newAnswer') }}</label>
          <UTextarea
            v-model="newAnswers[item.id]"
            :rows="3"
            :placeholder="t('practice.answerPlaceholder')"
            :ui="{
              root: 'w-full mt-2',
              wrapper: 'w-full',
              textarea: 'w-full resize-none border-line-default bg-surface text-primary placeholder-muted focus:border-accent focus:ring-accent/30',
            }"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <UButton
            variant="outline"
            class="border-line-strong text-tertiary hover:border-accent hover:text-primary"
            @click="onSkip(item.id)"
          >
            {{ t('review.skip') }}
          </UButton>
          <UButton
            class="bg-accent text-ink-950 hover:bg-accent-soft"
            :loading="judging[item.id]"
            :disabled="!newAnswers[item.id]?.trim()"
            @click="onJudge(item)"
          >
            {{ t('practice.submit') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div v-if="reviewStats" class="mt-10 grid grid-cols-3 gap-4">
      <div class="ds-card p-4 text-center">
        <p class="text-2xl font-bold text-warning">{{ reviewStats.dueCount }}</p>
        <p class="mt-1 text-xs text-muted">{{ t('review.reviewStats.due') }}</p>
      </div>
      <div class="ds-card p-4 text-center">
        <p class="text-2xl font-bold text-danger">{{ reviewStats.overdueCount }}</p>
        <p class="mt-1 text-xs text-muted">{{ t('review.reviewStats.overdue') }}</p>
      </div>
      <div class="ds-card p-4 text-center">
        <p class="text-2xl font-bold text-success">{{ reviewStats.masteredCount }}</p>
        <p class="mt-1 text-xs text-muted">{{ t('review.reviewStats.mastered') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ssr:false：纯客户端渲染，避免客户端导航时向云函数请求 SSR payload（冷启动 2~4s）
definePageMeta({ middleware: 'auth', ssr: false })

// ===== SEO：登录后页面，noindex =====
useSeo({
  title: {
    'zh-hans': '错题复习',
    'zh-hant': '錯題複習',
    'en':      'Mistake Review',
    'ja':      '復習モード',
  },
  description: {
    'zh-hans': '基于艾宾浩斯遗忘曲线的错题复习系统，定时提醒你回顾做错的题目，掌握薄弱点。',
    'zh-hant': '基於艾賓浩斯遺忘曲線的錯題複習系統，定時提醒你回顧做錯的題目，掌握薄弱點。',
    'en':      'Spaced-repetition mistake review based on Ebbinghaus forgetting curve. Review your wrong answers on schedule to close weak points.',
    'ja':      'エビングハウスの忘却曲線に基づく間隔反復復習。誤答した問題を計画的に振り返り、弱点を克服。',
  },
  noindex: true,
})

const { t } = useI18n()
const localePath = useLocalePath()

interface ReviewItem {
  id: string
  userAnswer: string
  isCorrect: boolean
  reviewLevel: number
  nextReviewAt: string | null
  question: {
    id: string
    category: string
    questionText: string
    correctAnswer: string
    languagePair: string | null
    grammarTag: string | null
    extraData: string | null
  }
}

interface ReviewStats {
  dueCount: number
  overdueCount: number
  masteredCount: number
  totalReviewable: number
}

const items = ref<ReviewItem[]>([])
const loading = ref(true)
const dueCount = ref(0)
const reviewStats = ref<ReviewStats | null>(null)
const newAnswers = ref<Record<string, string>>({})
const judging = ref<Record<string, boolean>>({})

async function loadData() {
  loading.value = true
  try {
    const [nextData, statsData] = await Promise.all([
      useCachedApi<{ items: ReviewItem[] }>('review:next', () => useApi<{ items: ReviewItem[] }>('/api/review/next'), 20_000),
      useCachedApi<ReviewStats>('review:stats', () => useApi<ReviewStats>('/api/review/stats'), 20_000),
    ])
    items.value = nextData.items
    reviewStats.value = statsData
    dueCount.value = statsData.dueCount
    for (const item of nextData.items) {
      newAnswers.value[item.id] = ''
      judging.value[item.id] = false
    }
  } catch {
    items.value = []
    reviewStats.value = null
  } finally {
    loading.value = false
  }
}

async function onJudge(item: ReviewItem) {
  const answer = newAnswers.value[item.id]?.trim()
  if (!answer) return
  judging.value[item.id] = true
  try {
    const isExactMatch = answer.toLowerCase() === item.question.correctAnswer.toLowerCase()
    const score = isExactMatch ? 10 : 5

    await useApi('/api/review/judge', {
      method: 'POST',
      body: { attemptId: item.id, score },
    })
    clearCachedApi('review:')
    items.value = items.value.filter(i => i.id !== item.id)
    dueCount.value = Math.max(0, dueCount.value - 1)
    try {
      reviewStats.value = await useCachedApi<ReviewStats>('review:stats', () => useApi<ReviewStats>('/api/review/stats'), 20_000)
    } catch {}
  } finally {
    judging.value[item.id] = false
  }
}

async function onSkip(attemptId: string) {
  try {
    await useApi('/api/review/judge', {
      method: 'POST',
      body: { attemptId, score: 0 },
    })
    clearCachedApi('review:')
    items.value = items.value.filter(i => i.id !== attemptId)
    dueCount.value = Math.max(0, dueCount.value - 1)
  } catch {}
}

onMounted(() => {
  loadData()
})
</script>
