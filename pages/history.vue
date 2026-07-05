<template>
  <div class="mx-auto max-w-5xl px-6 py-28 text-center">
    <div class="text-6xl mb-6">📝</div>
    <h1 class="font-display text-2xl font-bold text-stone-100">{{ t('nav.history') }}</h1>
    <p class="mt-8 text-sm text-stone-500">{{ t('dashboard.recent.noData') }}</p>
    <p class="mt-8 text-xs text-stone-600">Step 9 · 待实现</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { t } = useI18n()
</script>
