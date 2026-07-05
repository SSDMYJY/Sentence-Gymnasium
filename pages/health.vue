<template>
  <div class="mx-auto min-h-[calc(100svh-4rem)] max-w-2xl px-6 pb-24 pt-32">
    <p class="text-xs uppercase tracking-[0.28em] text-accent-soft">Step 1</p>
    <h1 class="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">链路自检</h1>
    <p class="mt-4 leading-relaxed text-stone-400">
      验证 Nuxt SSR → Cloudflare D1 binding → Prisma 链路是否接通。下方应返回
      <code class="rounded bg-ink-800 px-1.5 py-0.5 text-accent-soft">{ ok: true }</code>。
    </p>

    <div class="mt-10 rounded-2xl border border-white/10 bg-ink-800/60 p-6">
      <div class="flex items-center justify-between">
        <p class="text-xs uppercase tracking-wide text-stone-500">GET /api/health</p>
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
      Nuxt 3 SSR · Cloudflare Workers · D1 · Prisma
    </p>
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
