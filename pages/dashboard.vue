<template>
  <div class="mx-auto max-w-5xl px-6 pb-24 pt-28">
    <header class="mb-10">
      <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {{ t('auth.welcome', { name: displayName }) }}
      </h1>
      <p class="mt-2 text-stone-400">{{ t('dashboard.subtitle') }}</p>
    </header>

    <div class="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
      <div v-for="s in stats" :key="s.label" class="flex flex-col items-center bg-ink-900 px-4 py-6 text-center">
        <span class="text-2xl">{{ s.icon }}</span>
        <p class="mt-3 font-display text-3xl font-semibold text-stone-100">{{ s.value }}</p>
        <p class="mt-1 text-xs uppercase tracking-wide text-stone-500">{{ s.label }}</p>
      </div>
    </div>

    <div class="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6 lg:col-span-2">
        <div class="flex items-center gap-3">
          <span class="text-xl">🌱</span>
          <div>
            <p class="font-display text-lg font-semibold text-stone-100">{{ t('dashboard.level.title') }}</p>
            <p class="text-sm text-stone-400">{{ experience }} / 500 {{ t('dashboard.level.label') }}</p>
          </div>
        </div>
        <div class="mt-4 h-2 overflow-hidden rounded-full bg-ink-800">
          <div
            class="h-full rounded-full bg-accent transition-all duration-500"
            :style="{ width: `${experiencePercent}%` }"
          />
        </div>
        <p class="mt-3 text-xs text-stone-500">{{ t('dashboard.level.hint') }}</p>
      </div>

      <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
        <h3 class="text-sm font-semibold text-stone-300">{{ t('dashboard.quickActions.title') }}</h3>
        <div class="mt-4 space-y-3">
          <NuxtLink
            :to="localePath('/practice')"
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-stone-100"
          >
            <span>⚡</span>
            {{ t('dashboard.quickActions.startPractice') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/grammar')"
            class="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm text-stone-300 transition-colors hover:border-accent hover:text-white"
          >
            <span>◎</span>
            {{ t('dashboard.quickActions.grammarFocus') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/history')"
            class="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm text-stone-300 transition-colors hover:border-accent hover:text-white"
          >
            <span>📝</span>
            {{ t('dashboard.quickActions.reviewMistakes') }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <section class="mt-10 rounded-2xl border border-white/10 bg-ink-900/50 p-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-display text-lg font-semibold text-stone-100">{{ t('dashboard.recent.title') }}</h2>
          <p class="mt-1 text-sm text-stone-500">{{ t('dashboard.recent.label') }}</p>
        </div>
        <NuxtLink :to="localePath('/history')" class="text-sm text-accent-soft transition-colors hover:text-accent">
          {{ t('boards.enter') }} →
        </NuxtLink>
      </div>

      <div v-if="historyEntries.length > 0" class="mt-6 border-t border-white/5">
        <div
          v-for="(entry, i) in historyEntries"
          :key="entry.id"
          class="flex items-start justify-between border-b border-white/5 py-4 last:border-b-0"
        >
          <div class="flex items-start gap-3">
            <span :class="['mt-1 text-sm', entry.isCorrect ? 'text-green-400' : 'text-red-400']">
              {{ entry.isCorrect ? '✓' : '✗' }}
            </span>
            <div>
              <p class="font-medium text-stone-200">{{ entry.questionText }}</p>
              <p class="mt-1 text-xs text-stone-500">{{ entry.topic }}</p>
            </div>
          </div>
          <span class="text-xs text-stone-500">{{ formatDate(entry.createdAt) }}</span>
        </div>
      </div>

      <div v-else class="mt-8 text-center text-sm text-stone-500">
        {{ t('dashboard.recent.noData') }}
      </div>
    </section>

    <div class="mt-8 text-center">
      <button
        type="button"
        :disabled="recharging"
        class="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-stone-300 transition-colors hover:border-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        @click="onRecharge"
      >
        <span class="text-accent-soft">⚡</span>
        {{ recharging ? t('dashboard.recharge.loading') : t('dashboard.recharge.button') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SessionUser } from '~/stores/user'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const localePath = useLocalePath()
const store = useUserStore()
const user = computed(() => store.user as SessionUser)

const displayName = computed(() => user.value?.name || user.value?.email || '')

interface BoardStat { total: number; correct: number }
interface StatsResp {
  total: number
  correct: number
  perBoard: { practice: BoardStat; paraphrase: BoardStat; grammar: BoardStat }
}

interface HistoryEntry {
  id: string
  questionText: string
  isCorrect: boolean
  score: number | null
  topic: string | null
  createdAt: string
}

const statsResp = ref<StatsResp | null>(null)
const historyEntries = ref<HistoryEntry[]>([])

async function loadData() {
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  try {
    statsResp.value = await $fetch<StatsResp>('/api/stats', { headers })
    const history = await $fetch<{ entries: HistoryEntry[] }>('/api/history', { headers })
    historyEntries.value = history.entries
  } catch {
    statsResp.value = null
    historyEntries.value = []
  }
}

await loadData()

const accRate = computed(() => {
  const total = user.value?.totalAttempts ?? 0
  const correct = user.value?.correctAttempts ?? 0
  if (total === 0) return '—'
  return `${Math.round((correct / total) * 100)}%`
})

const experience = computed(() => {
  const total = user.value?.totalAttempts ?? 0
  return Math.min(total * 10, 499)
})

const experiencePercent = computed(() => {
  return Math.round((experience.value / 500) * 100)
})

const stats = computed(() => [
  { icon: '⚡', label: t('dashboard.stats.energy'), value: user.value?.credits ?? 0 },
  { icon: '🔥', label: t('dashboard.stats.streak'), value: 1 },
  { icon: '◎', label: t('dashboard.stats.accuracy'), value: accRate.value },
  { icon: '🏆', label: t('dashboard.stats.total'), value: user.value?.totalAttempts ?? 0 },
])

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

const recharging = ref(false)
const onRecharge = async () => {
  if (recharging.value) return
  recharging.value = true
  try {
    const updated = await $fetch<SessionUser>('/api/credits/recharge', { method: 'POST' })
    store.setUser(updated)
    await loadData()
  } finally {
    recharging.value = false
  }
}
</script>
