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
        <NuxtLink :to="localePath('/')" class="flex items-baseline gap-2">
          <span class="font-display text-base font-bold tracking-tight sm:text-lg">
            {{ t('brand.name') }}
          </span>
          <span class="hidden text-xs text-stone-500 sm:inline">{{ t('brand.subtitle') }}</span>
        </NuxtLink>
        <nav class="flex items-center gap-5 text-sm text-stone-400 sm:gap-7">
          <a :href="localePath('/#boards')" class="transition-colors hover:text-white">{{ t('nav.training') }}</a>
          <a :href="localePath('/#flow')" class="transition-colors hover:text-white">{{ t('nav.flow') }}</a>
          <LanguageSwitcher />
          <template v-if="user">
            <span class="hidden items-center gap-2 sm:flex">
              <span class="text-accent-soft">●</span>
              <span class="text-stone-300">{{ user.credits }}</span>
              <span class="text-xs text-stone-500">Credits</span>
            </span>
            <button
              type="button"
              :disabled="loggingOut"
              class="transition-colors hover:text-white disabled:opacity-60"
              @click="onLogout"
            >
              {{ t('auth.logout') }}
            </button>
          </template>
          <template v-else>
            <NuxtLink :to="localePath('/login')" class="transition-colors hover:text-white">{{ t('auth.login') }}</NuxtLink>
            <NuxtLink
              :to="localePath('/register')"
              class="rounded-full border border-white/15 px-3 py-1 text-xs transition-colors hover:border-white/40 hover:text-white"
            >
              {{ t('auth.register') }}
            </NuxtLink>
          </template>
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
          <span class="font-display text-stone-300">{{ t('brand.name') }}</span>
          <span>· {{ t('brand.subtitle') }}</span>
        </div>
        <div class="text-xs tracking-wide">
          {{ t('footer.stack') }}
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const store = useUserStore()
const user = computed(() => store.user)
const loggingOut = ref(false)

const onLogout = async () => {
  loggingOut.value = true
  try {
    await store.logout()
    await navigateTo(localePath('/'))
  } finally {
    loggingOut.value = false
  }
}

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
