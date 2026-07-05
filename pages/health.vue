<template>
  <div class="mx-auto min-h-[calc(100svh-4rem)] max-w-2xl px-6 pb-24 pt-32">
    <p class="text-xs uppercase tracking-[0.28em] text-accent-soft">{{ t('health.step') }}</p>
    <h1 class="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{{ t('health.title') }}</h1>
    <p class="mt-4 leading-relaxed text-stone-400" v-html="bodyHtml"></p>

    <div class="mt-10 rounded-2xl border border-white/10 bg-ink-800/60 p-6">
      <div class="flex items-center justify-between">
        <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('health.endpoint') }}</p>
        <span
          :class="[
            'inline-flex h-2 w-2 rounded-full',
            health.ok ? 'bg-accent' : 'bg-stone-600',
          ]"
        />
      </div>
      <pre class="mt-4 whitespace-pre-wrap break-all text-sm text-stone-200">{{ health }}</pre>
    </div>

    <p class="mt-8 text-xs text-stone-500">
      {{ t('health.stack') }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

// { ok: true } 含花括号，会与 vue-i18n 插值语法冲突，
// 因此把 okCode 作为参数传入，并在 v-html 中渲染带样式的 <code>。
const bodyHtml = computed(() => {
  const text = t('health.body', { okCode: '{ ok: true }' })
  return text.replace(
    '{ ok: true }',
    '<code class="rounded bg-ink-800 px-1.5 py-0.5 text-accent-soft">{ ok: true }</code>',
  )
})

const health = ref<{ ok?: boolean; users?: number; ts?: string; error?: string }>({})
try {
  health.value = await $fetch('/api/health')
} catch (e: any) {
  health.value = { error: e?.message ?? String(e) }
}
</script>
