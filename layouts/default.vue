<template>
  <div class="flex min-h-screen flex-col bg-ink-950 text-stone-100">
    <header :class="[
      'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
      scrolled
        ? 'border-b border-white/5 bg-ink-950/80 backdrop-blur-md'
        : 'border-b border-transparent bg-transparent',
    ]">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <NuxtLink :to="localePath('/')" class="flex items-baseline gap-2">
          <img src="/logo.svg" alt="Sentence Gymnasium" class="h-12 w-auto" />
        </NuxtLink>

        <nav v-if="user" class="hidden items-center gap-1 text-sm font-medium sm:flex">
          <NuxtLink v-for="item in navItems" :key="item.key" :to="localePath(item.path)" :class="[
            'rounded-lg px-4 py-2 transition-colors',
            route.path.includes(item.path) && route.path !== '/'
              ? 'bg-accent/10 text-accent-soft'
              : 'text-stone-400 hover:text-white',
          ]">
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-4">
          <LanguageSwitcher />
          <template v-if="user">
            <div class="hidden items-center gap-1 rounded-full bg-ink-800 px-3 py-1 text-xs sm:flex">
              <span class="text-accent-soft">●</span>
              <span class="text-stone-300">{{ user.credits }}</span>
            </div>
            <button type="button" :disabled="loggingOut" class="hidden transition-colors hover:text-white disabled:opacity-60 sm:block"
              @click="onLogout">
              {{ t('auth.logout') }}
            </button>
            <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-stone-400 transition-colors hover:border-white/30 hover:text-white sm:hidden"
              @click="mobileMenuOpen = !mobileMenuOpen" :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'">
              <svg v-if="!mobileMenuOpen" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </template>
          <template v-else>
            <NuxtLink :to="localePath('/login')" class="transition-colors hover:text-white">{{ t('auth.login') }}
            </NuxtLink>
          </template>
        </div>
      </div>

      <div v-if="user && mobileMenuOpen" class="border-t border-white/5 bg-ink-950/95 backdrop-blur-md sm:hidden">
        <nav class="mx-auto max-w-7xl px-6 py-3">
          <div class="flex items-center gap-2 rounded-lg bg-ink-800 px-3 py-2 text-xs">
            <span class="text-accent-soft">⚡</span>
            <span class="text-stone-300">{{ user.credits }} {{ t('dashboard.stats.energy') }}</span>
          </div>
          <div class="mt-2 space-y-1">
            <NuxtLink v-for="item in navItems" :key="item.key" :to="localePath(item.path)" :class="[
              'block rounded-lg px-4 py-3 text-sm font-medium transition-colors',
              route.path.includes(item.path) && route.path !== '/'
                ? 'bg-accent/10 text-accent-soft'
                : 'text-stone-400 hover:bg-white/5 hover:text-white',
            ]" @click="mobileMenuOpen = false">
              {{ item.label }}
            </NuxtLink>
          </div>
          <button type="button" :disabled="loggingOut" class="mt-2 w-full rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-stone-400 transition-colors hover:border-white/30 hover:text-white disabled:opacity-60"
            @click="onLogout">
            {{ t('auth.logout') }}
          </button>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-white/5">
      <div
        class="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-baseline gap-3">
          <NuxtLink to="/terms" class="font-display text-stone-300">{{ t('brand.terms') }}</NuxtLink>
          <NuxtLink to="/privacy" class="font-display text-stone-300">{{ t('brand.privacy') }}</NuxtLink>
        </div>
        <div class="text-xs tracking-wide">
          {{ t('footer.copyright') }}
        </div>
      </div>
    </footer>

    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const store = useUserStore()
const user = computed(() => store.user)
const loggingOut = ref(false)
const mobileMenuOpen = ref(false)

const navItems = computed(() => [
  { key: 'dashboard', label: t('auth.dashboard'), path: '/dashboard' },
  { key: 'practice', label: t('boards.practice.subtitle'), path: '/practice' },
  { key: 'paraphrase', label: t('boards.paraphrase.subtitle'), path: '/paraphrase' },
  { key: 'grammar', label: t('boards.grammar.subtitle'), path: '/grammar' },
  { key: 'history', label: t('nav.history'), path: '/history' },
  { key: 'ranking', label: t('ranking.nav'), path: '/ranking' },
])

const onLogout = async () => {
  loggingOut.value = true
  mobileMenuOpen.value = false
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
  window.removeEventListener('scroll', onScroll, { passive: true })
})

watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>
