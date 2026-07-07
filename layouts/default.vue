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
            <div class="hidden items-center gap-1 bg-ink-800 px-3 py-1 text-xs sm:flex">
              <span class="text-accent-soft">●</span>
              <span class="text-stone-300">{{ user.credits }}</span>
            </div>
            <UButton
              variant="ghost"
              :loading="loggingOut"
              class="hidden sm:inline-flex text-stone-400 hover:text-white cursor-pointer"
              @click="onLogout"
            >
              {{ t('auth.logout') }}
            </UButton>
            <UButton
              variant="ghost"
              class="sm:hidden text-stone-400 transition-colors hover:text-white p-2!"
              @click="mobileMenuOpen = !mobileMenuOpen"
              aria-label="menu"
            >
              <span class="block h-5 w-5 relative">
                <span :class="[
                  'absolute left-0 h-0.5 w-5 bg-current transition-all duration-200',
                  mobileMenuOpen ? 'top-2 rotate-45' : 'top-1',
                ]" />
                <span :class="[
                  'absolute left-0 top-2 h-0.5 w-5 bg-current transition-all duration-200',
                  mobileMenuOpen ? 'opacity-0' : 'opacity-100',
                ]" />
                <span :class="[
                  'absolute left-0 h-0.5 w-5 bg-current transition-all duration-200',
                  mobileMenuOpen ? 'top-2 -rotate-45' : 'top-3',
                ]" />
              </span>
            </UButton>
          </template>
          <template v-else>
            <NuxtLink :to="localePath('/login')" class="transition-colors hover:text-white">{{ t('auth.login') }}
            </NuxtLink>
          </template>
        </div>
      </div>

      <Transition name="menu">
        <div v-if="mobileMenuOpen && user" class="border-t border-white/5 bg-ink-950/95 backdrop-blur-xl sm:hidden">
          <nav class="mx-auto max-w-7xl px-6 py-3">
            <NuxtLink v-for="item in navItems" :key="item.key" :to="localePath(item.path)"
              class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors"
              :class="isActive(item.path) ? 'bg-accent/10 text-accent-soft' : 'text-stone-300 hover:text-white'"
              @click="mobileMenuOpen = false">
              <span class="text-base">{{ item.icon }}</span>
              {{ item.label }}
            </NuxtLink>
            <div class="mt-2 border-t border-white/5 pt-3">
              <div class="flex items-center justify-between px-3 py-2 text-sm">
                <span class="text-stone-400">⚡ {{ t('dashboard.stats.energy') }}</span>
                <span class="font-semibold text-accent-soft">{{ user.credits }}</span>
              </div>
              <UButton
                variant="ghost"
                :loading="loggingOut"
                class="mt-1 w-full justify-start text-stone-300 hover:text-white"
                @click="onLogout"
              >
                <template #leading>
                  <span class="text-base">↪</span>
                </template>
                {{ t('auth.logout') }}
              </UButton>
            </div>
          </nav>
        </div>
      </Transition>
    </header>

    <main class="flex-1 pb-20 sm:pb-0">
      <slot />
    </main>

    <nav v-if="user" class="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-ink-950/90 backdrop-blur-xl sm:hidden">
      <div class="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
        <NuxtLink v-for="tab in mobileTabs" :key="tab.key" :to="localePath(tab.path)"
          class="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 transition-colors"
          :class="isActive(tab.path) ? 'text-accent-soft' : 'text-stone-500'">
          <span class="text-lg leading-none">{{ tab.icon }}</span>
          <span class="text-[10px] font-medium leading-tight">{{ tab.shortLabel }}</span>
        </NuxtLink>
      </div>
    </nav>

    <footer class="hidden border-t border-white/5 sm:block">
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
  { key: 'dashboard', label: t('auth.dashboard'), path: '/dashboard', icon: '🏠' },
  { key: 'practice', label: t('boards.practice.subtitle'), path: '/practice', icon: '⚡' },
  { key: 'paraphrase', label: t('boards.paraphrase.subtitle'), path: '/paraphrase', icon: '🔄' },
  { key: 'grammar', label: t('boards.grammar.subtitle'), path: '/grammar', icon: '◎' },
  { key: 'history', label: t('nav.history'), path: '/history', icon: '📝' },
  { key: 'ranking', label: t('ranking.nav'), path: '/ranking', icon: '🏆' },
])

const mobileTabs = computed(() => [
  { key: 'dashboard', shortLabel: t('auth.dashboard'), path: '/dashboard', icon: '🏠' },
  { key: 'practice', shortLabel: t('boards.practice.subtitle'), path: '/practice', icon: '⚡' },
  { key: 'grammar', shortLabel: t('boards.grammar.subtitle'), path: '/grammar', icon: '◎' },
  { key: 'history', shortLabel: t('nav.history'), path: '/history', icon: '📝' },
])

function isActive(path: string): boolean {
  if (path === '/dashboard') {
    return route.path === '/dashboard' || route.path.endsWith('/dashboard')
  }
  return route.path.includes(path)
}

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

<style scoped>
.menu-enter-active {
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.menu-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 1, 1);
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
