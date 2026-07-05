<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-8">
    <h1 class="text-3xl font-bold mb-2">🏋️ Sentence Gymnasium</h1>
    <p class="text-gray-600 mb-6">句子健身房 · Step 1 链路自检</p>
    <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm w-full max-w-md">
      <p class="text-xs uppercase tracking-wide text-gray-400 mb-2">GET /api/health</p>
      <pre class="text-sm whitespace-pre-wrap break-all">{{ health }}</pre>
    </div>
    <p class="mt-6 text-xs text-gray-400">Nuxt 3 SSR · Cloudflare Workers · D1 · Prisma</p>
  </div>
</template>

<script setup lang="ts">
const health = ref<{ ok?: boolean; users?: number; ts?: string; error?: string }>({})
try {
  health.value = await $fetch('/api/health')
} catch (e: any) {
  health.value = { error: e?.message ?? String(e) }
}
</script>
