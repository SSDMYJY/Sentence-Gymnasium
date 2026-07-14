<template>
  <div class="mx-auto max-w-3xl px-6 pb-24 pt-28">
    <header class="mb-10">
      <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {{ t('review.title') }}
      </h1>
      <p class="mt-2 text-stone-400">{{ t('review.subtitle') }}</p>
      <p v-if="dueCount > 0" class="mt-1 text-sm text-accent-soft">
        {{ t('review.dueCount', { count: dueCount }) }}
      </p>
      <p v-else class="mt-1 text-sm text-green-400">
        {{ t('review.noDue') }}
      </p>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      <p class="mt-4 text-sm text-stone-400">{{ t('history.loading') }}</p>
    </div>

    <!-- Empty / All caught up -->
    <div v-else-if="items.length === 0" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
      <p class="text-4xl">🎉</p>
      <p class="mt-4 text-stone-400">{{ t('review.noDue') }}</p>
      <UButton :to="localePath('/dashboard')" class="mt-6 bg-white text-ink-950 hover:bg-stone-100">
        {{ t('auth.dashboard') }}
      </UButton>
    </div>

    <!-- Review Items -->
    <div v-else class="space-y-6">
      <div
        v-for="item in items"
        :key="item.id"
        class="rounded-2xl border border-white/10 bg-ink-900/50 p-6"
      >
        <!-- Question -->
        <div class="mb-4">
          <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('practice.question') }}</p>
          <p class="mt-1 font-display text-lg font-medium text-stone-100">{{ item.question.questionText }}</p>
        </div>

        <!-- Original Answer -->
        <div class="mb-4 rounded-lg bg-ink-800/50 p-4">
          <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('review.originalAnswer') }}</p>
          <p class="mt-1 text-stone-300">{{ item.userAnswer }}</p>
        </div>

        <!-- Reference -->
        <div class="mb-4">
          <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('practice.referenceAnswer') }}</p>
          <p class="mt-1 text-accent-soft">{{ item.question.correctAnswer }}</p>
        </div>

        <!-- Your New Answer -->
        <div class="mb-4">
          <label class="block text-xs uppercase tracking-wide text-stone-500">{{ t('review.newAnswer') }}</label>
          <UTextarea
            v-model="newAnswers[item.id]"
            :rows="3"
            :placeholder="t('practice.answerPlaceholder')"
            :ui="{
              root: 'w-full mt-2',
              wrapper: 'w-full',
              textarea: 'w-full resize-none border-white/10 bg-ink-950 text-stone-100 placeholder-stone-600 focus:border-accent focus:ring-accent/30',
            }"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <UButton
            variant="outline"
            class="border-white/15 text-stone-300 hover:border-accent hover:text-white"
            @click="onSkip(item.id)"
          >
            {{ t('review.skip') }}
          </UButton>
          <UButton
            class="bg-white text-ink-950 hover:bg-stone-100"
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
      <div class="rounded-xl border border-white/10 bg-ink-900/50 p-4 text-center">
        <p class="text-2xl font-bold text-yellow-400">{{ reviewStats.dueCount }}</p>
        <p class="mt-1 text-xs text-stone-500">{{ t('review.reviewStats.due') }}</p>
      </div>
      <div class="rounded-xl border border-white/10 bg-ink-900/50 p-4 text-center">
        <p class="text-2xl font-bold text-red-400">{{ reviewStats.overdueCount }}</p>
        <p class="mt-1 text-xs text-stone-500">{{ t('review.reviewStats.overdue') }}</p>
      </div>
      <div class="rounded-xl border border-white/10 bg-ink-900/50 p-4 text-center">
        <p class="text-2xl font-bold text-green-400">{{ reviewStats.masteredCount }}</p>
        <p class="mt-1 text-xs text-stone-500">{{ t('review.reviewStats.mastered') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
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

const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined

async function loadData() {
  loading.value = true
  try {
    const [nextData, statsData] = await Promise.all([
      $fetch<{ items: ReviewItem[] }>('/api/review/next', { headers }),
      $fetch<ReviewStats>('/api/review/stats', { headers }),
    ])
    items.value = nextData.items
    reviewStats.value = statsData
    dueCount.value = statsData.dueCount
    // Initialize new answers
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
    // Send score based on correctness
    // We use a simple approach: if answer matches correct answer, score=10, else we ask AI
    const isExactMatch = answer.toLowerCase() === item.question.correctAnswer.toLowerCase()
    const score = isExactMatch ? 10 : 5

    await $fetch('/api/review/judge', {
      method: 'POST',
      body: { attemptId: item.id, score },
    })
    // Remove from list
    items.value = items.value.filter(i => i.id !== item.id)
    dueCount.value = Math.max(0, dueCount.value - 1)
    // Refresh stats
    try {
      reviewStats.value = await $fetch<ReviewStats>('/api/review/stats', { headers })
    } catch {}
  } finally {
    judging.value[item.id] = false
  }
}

async function onSkip(attemptId: string) {
  // Skip by setting score to 0 (bad) → reset to level 1
  try {
    await $fetch('/api/review/judge', {
      method: 'POST',
      body: { attemptId, score: 0 },
    })
    items.value = items.value.filter(i => i.id !== attemptId)
    dueCount.value = Math.max(0, dueCount.value - 1)
  } catch {}
}

await loadData()
</script>
