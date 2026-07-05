<template>
  <div class="mx-auto max-w-5xl px-6 pb-24 pt-28">
    <!-- 概览：欢迎语 + 充值入口 -->
    <header class="reveal">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.28em] text-accent-soft">{{ t('auth.dashboard') }}</p>
          <h1 class="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {{ t('auth.welcome', { name: displayName }) }}
          </h1>
        </div>
        <button
          type="button"
          :disabled="recharging"
          class="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-stone-200 transition-colors hover:border-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          @click="onRecharge"
        >
          <span :class="['inline-block h-1.5 w-1.5 rounded-full', recharging ? 'bg-stone-500' : 'bg-accent']" />
          {{ recharging ? t('dashboard.recharge.loading') : t('dashboard.recharge.button') }}
        </button>
      </div>
    </header>

    <div class="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
      <div v-for="s in stats" :key="s.label" class="bg-ink-900 px-5 py-6">
        <p class="text-xs uppercase tracking-wide text-stone-500">{{ s.label }}</p>
        <p class="mt-2 font-display text-3xl font-semibold text-stone-100">{{ s.value }}</p>
      </div>
    </div>

    <!-- 各板块统计 -->
    <section class="mt-16">
      <h2 class="font-display text-lg font-semibold text-stone-200">{{ t('dashboard.perBoard.title') }}</h2>

      <div
        v-if="perBoardData && perBoardData.total > 0"
        class="mt-6 overflow-hidden rounded-2xl border border-white/10"
      >
        <div class="grid grid-cols-4 gap-px bg-white/10 text-xs uppercase tracking-wide text-stone-500">
          <div class="bg-ink-900 px-5 py-3">{{ t('dashboard.perBoard.board') }}</div>
          <div class="bg-ink-900 px-5 py-3 text-right">{{ t('dashboard.perBoard.total') }}</div>
          <div class="bg-ink-900 px-5 py-3 text-right">{{ t('dashboard.perBoard.correct') }}</div>
          <div class="bg-ink-900 px-5 py-3 text-right">{{ t('dashboard.perBoard.rate') }}</div>
        </div>
        <div
          v-for="b in perBoardData.rows"
          :key="b.key"
          class="grid grid-cols-4 gap-px bg-white/10"
        >
          <div class="bg-ink-900 px-5 py-4">
            <span class="font-display text-sm text-stone-500">{{ b.no }}</span>
            <span class="ml-2 font-display text-base font-semibold text-stone-100">{{ b.title }}</span>
          </div>
          <div class="bg-ink-900 px-5 py-4 text-right font-display text-base text-stone-200">{{ b.total }}</div>
          <div class="bg-ink-900 px-5 py-4 text-right font-display text-base text-stone-200">{{ b.correct }}</div>
          <div class="bg-ink-900 px-5 py-4 text-right font-display text-base text-accent-soft">{{ b.rate }}</div>
        </div>
      </div>

      <div
        v-else
        class="mt-6 rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center text-sm text-stone-500"
      >
        {{ t('dashboard.empty') }}
      </div>
    </section>

    <!-- 训练入口 -->
    <section class="mt-16">
      <h2 class="font-display text-lg font-semibold text-stone-200">{{ t('boards.eyebrow') }}</h2>
      <div class="mt-6 grid grid-cols-1 border-t border-white/10 md:grid-cols-3">
        <NuxtLink
          v-for="(b, i) in boardEntries"
          :key="b.no"
          v-reveal
          :to="b.to"
          class="group relative border-b border-white/10 px-6 py-8 transition-colors hover:bg-ink-800/30 sm:px-8 md:border-b-0 md:border-r md:last:border-r-0"
          :style="{ transitionDelay: `${i * 60}ms` }"
        >
          <span class="absolute left-0 top-0 h-px w-0 bg-accent transition-all duration-500 group-hover:w-full" />
          <span class="block font-display text-sm text-stone-500">{{ b.no }}</span>
          <span class="mt-4 block font-display text-xl font-semibold">{{ b.title }}</span>
          <span class="mt-1 block text-sm text-accent-soft">{{ b.subtitle }}</span>
          <span class="mt-6 inline-flex items-center gap-2 text-sm text-stone-300 transition-colors group-hover:text-white">
            {{ t('boards.enter') }}
            <span class="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </NuxtLink>
      </div>
    </section>
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

// 各板块统计：SSR 阶段需转发 cookie 才能命中会话。
interface BoardStat { total: number; correct: number }
interface StatsResp {
  total: number
  correct: number
  perBoard: { practice: BoardStat; paraphrase: BoardStat; grammar: BoardStat }
}

const statsResp = ref<StatsResp | null>(null)

async function loadStats() {
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  try {
    statsResp.value = await $fetch<StatsResp>('/api/stats', { headers })
  } catch {
    statsResp.value = null
  }
}

await loadStats()

// 概览卡片：Credits / 总题数 / 正确数 / 正确率
const accRate = computed(() => {
  const total = user.value?.totalAttempts ?? 0
  const correct = user.value?.correctAttempts ?? 0
  if (total === 0) return '—'
  return `${Math.round((correct / total) * 100)}%`
})

const stats = computed(() => [
  { label: t('dashboard.stats.credits'), value: user.value?.credits ?? 0 },
  { label: t('dashboard.stats.total'), value: user.value?.totalAttempts ?? 0 },
  { label: t('dashboard.stats.correct'), value: user.value?.correctAttempts ?? 0 },
  { label: t('dashboard.stats.accuracy'), value: accRate.value },
])

// 各板块表格行
const boardKeys = ['practice', 'paraphrase', 'grammar'] as const
const perBoardData = computed(() => {
  const s = statsResp.value
  if (!s) return null
  const rows = boardKeys.map((k) => {
    const b = s.perBoard[k]
    const rate = b.total === 0 ? '—' : `${Math.round((b.correct / b.total) * 100)}%`
    return {
      key: k,
      no: t(`boards.${k}.no`),
      title: t(`boards.${k}.title`),
      total: b.total,
      correct: b.correct,
      rate,
    }
  })
  return { total: s.total, rows }
})

const boardEntries = computed(() =>
  boardKeys.map((k) => ({
    no: t(`boards.${k}.no`),
    title: t(`boards.${k}.title`),
    subtitle: t(`boards.${k}.subtitle`),
    to: localePath(`/${k}`),
  })),
)

// 模拟充值：调接口 +20 → 用返回的最新用户信息刷新 store。
const recharging = ref(false)
const onRecharge = async () => {
  if (recharging.value) return
  recharging.value = true
  try {
    const updated = await $fetch<SessionUser>('/api/credits/recharge', { method: 'POST' })
    store.setUser(updated)
    await loadStats()
  } finally {
    recharging.value = false
  }
}

const vReveal = {
  mounted(el: HTMLElement) {
    el.classList.add('reveal')
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('reveal-visible')
            io.unobserve(el)
          }
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
  },
}
</script>
