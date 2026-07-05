<template>
  <div class="mx-auto max-w-5xl px-6 pb-24 pt-28">
    <!-- 概览：欢迎语 + 关键指标 -->
    <header class="reveal">
      <p class="text-xs uppercase tracking-[0.28em] text-accent-soft">{{ t('auth.dashboard') }}</p>
      <h1 class="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {{ t('auth.welcome', { name: displayName }) }}
      </h1>
    </header>

    <div class="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
      <div v-for="s in stats" :key="s.label" class="bg-ink-900 px-5 py-6">
        <p class="text-xs uppercase tracking-wide text-stone-500">{{ s.label }}</p>
        <p class="mt-2 font-display text-3xl font-semibold text-stone-100">{{ s.value }}</p>
      </div>
    </div>

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
const store = useUserStore()
const user = computed(() => store.user as SessionUser)

const displayName = computed(() => user.value?.name || user.value?.email || '')

const stats = computed(() => [
  { label: 'Credits', value: user.value?.credits ?? 0 },
  { label: t('flow.answer.title'), value: user.value?.totalAttempts ?? 0 },
  { label: t('flow.judge.title'), value: user.value?.correctAttempts ?? 0 },
  {
    label: t('flow.feedback.caption'),
    value: accRate.value,
  },
])

const accRate = computed(() => {
  const total = user.value?.totalAttempts ?? 0
  const correct = user.value?.correctAttempts ?? 0
  if (total === 0) return '—'
  return `${Math.round((correct / total) * 100)}%`
})

const boardKeys = ['practice', 'paraphrase', 'grammar'] as const
const boardEntries = computed(() =>
  boardKeys.map((k) => ({
    no: t(`boards.${k}.no`),
    title: t(`boards.${k}.title`),
    subtitle: t(`boards.${k}.subtitle`),
    to: `/${k}`,
  })),
)

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
