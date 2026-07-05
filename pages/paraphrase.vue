<template>
  <div class="mx-auto max-w-5xl px-6 py-28 text-center">
    <div class="text-6xl mb-6">🔄</div>
    <h1 class="font-display text-2xl font-bold text-stone-100">{{ t('boards.paraphrase.title') }}</h1>
    <p class="mt-4 text-stone-400">{{ t('boards.paraphrase.subtitle') }}</p>
    <p class="mt-2 text-sm text-stone-500">{{ t('boards.paraphrase.desc') }}</p>
    <p class="mt-8 text-xs text-stone-600">Step 6 · 待实现</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { t } = useI18n()
</script>
