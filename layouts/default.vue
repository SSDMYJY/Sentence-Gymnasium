<template>
  <div class="flex min-h-screen flex-col bg-ink-950 text-stone-100">
    <header
      :class="[
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'border-b border-white/5 bg-ink-950/80 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      ]"
    >
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <NuxtLink to="/" class="flex items-baseline gap-2">
          <span class="font-display text-base font-bold tracking-tight sm:text-lg">
            Sentence Gymnasium
          </span>
          <span class="hidden text-xs text-stone-500 sm:inline">句子健身房</span>
        </NuxtLink>
        <nav class="flex items-center gap-5 text-sm text-stone-400 sm:gap-7">
          <a href="/#boards" class="transition-colors hover:text-white">训练方式</a>
          <a href="/#flow" class="transition-colors hover:text-white">流程</a>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-white/5">
      <div
        class="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-baseline gap-3">
          <span class="font-display text-stone-300">Sentence Gymnasium</span>
          <span>· 句子健身房</span>
        </div>
        <div class="text-xs tracking-wide">
          Nuxt 3 SSR · Cloudflare Workers · D1 · Prisma
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const scrolled = ref(false)

const onScroll = () => {
  scrolled.value = window.scrollY > 24
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>
