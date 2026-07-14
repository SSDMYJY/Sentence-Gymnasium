<template>
  <div class="app-root">
    <header
      class="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      :class="scrolled ? 'header-scrolled' : 'header-transparent'"
    >
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <NuxtLink :to="localePath('/')" class="flex items-baseline gap-2">
          <img src="/favicon.svg" alt="Sentence Gymnasium" class="h-12 w-auto" />
        </NuxtLink>

        <nav v-if="user" class="hidden items-center gap-1 text-sm font-medium sm:flex">
          <NuxtLink
            v-for="item in navItems"
            :key="item.key"
            :to="localePath(item.path)"
            class="nav-link rounded-lg px-4 py-2 transition-colors"
            :class="{ 'nav-link-active': isActive(item.path) }"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <template v-if="user">
            <div class="credits-badge hidden items-center gap-1 px-3 py-1 text-xs sm:flex">
              <span class="credits-dot">●</span>
              <span class="credits-text">{{ user.credits }}</span>
            </div>
            <UButton
              variant="ghost"
              :loading="loggingOut"
              class="hidden sm:inline-flex cursor-pointer btn-ghost"
              @click="onLogout"
            >
              {{ t('auth.logout') }}
            </UButton>
            <UButton
              variant="ghost"
              class="sm:hidden btn-ghost-icon p-2!"
              @click="mobileMenuOpen = !mobileMenuOpen"
              aria-label="menu"
            >
              <span class="block h-5 w-5 relative">
                <span
                  :class="[
                    'absolute left-0 h-0.5 w-5 bg-current transition-all duration-200',
                    mobileMenuOpen ? 'top-2 rotate-45' : 'top-1',
                  ]"
                />
                <span
                  :class="[
                    'absolute left-0 top-2 h-0.5 w-5 bg-current transition-all duration-200',
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100',
                  ]"
                />
                <span
                  :class="[
                    'absolute left-0 h-0.5 w-5 bg-current transition-all duration-200',
                    mobileMenuOpen ? 'top-2 -rotate-45' : 'top-3',
                  ]"
                />
              </span>
            </UButton>
          </template>
          <template v-else>
            <NuxtLink :to="localePath('/login')" class="login-link transition-colors">
              {{ t('auth.login') }}
            </NuxtLink>
          </template>
        </div>
      </div>

      <Transition name="menu">
        <div v-if="mobileMenuOpen && user" class="mobile-menu sm:hidden">
          <nav class="mx-auto max-w-7xl px-6 py-3">
            <NuxtLink
              v-for="item in navItems"
              :key="item.key"
              :to="localePath(item.path)"
              class="mobile-nav-link flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors"
              :class="{ 'mobile-nav-link-active': isActive(item.path) }"
              @click="mobileMenuOpen = false"
            >
              <span class="text-base">{{ item.icon }}</span>
              {{ item.label }}
            </NuxtLink>
            <div class="mobile-menu-divider mt-2 pt-3">
              <div class="flex items-center justify-between px-3 py-2 text-sm">
                <span class="mobile-menu-label">⚡ {{ t('dashboard.stats.energy') }}</span>
                <span class="mobile-menu-value">{{ user.credits }}</span>
              </div>
              <UButton
                variant="ghost"
                :loading="loggingOut"
                class="mt-1 w-full justify-start mobile-logout-btn"
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

    <nav v-if="user" class="bottom-nav fixed inset-x-0 bottom-0 z-40 sm:hidden">
      <div class="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
        <NuxtLink
          v-for="tab in mobileTabs"
          :key="tab.key"
          :to="localePath(tab.path)"
          class="bottom-nav-item flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 transition-colors"
          :class="{ 'bottom-nav-item-active': isActive(tab.path) }"
        >
          <span class="text-lg leading-none">{{ tab.icon }}</span>
          <span class="text-[10px] font-medium leading-tight">{{ tab.shortLabel }}</span>
        </NuxtLink>
      </div>
    </nav>

    <footer class="site-footer hidden sm:block">
      <div
        class="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm footer-text sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-baseline gap-3">
          <NuxtLink to="/terms" class="footer-link">{{ t('brand.terms') }}</NuxtLink>
          <NuxtLink to="/privacy" class="footer-link">{{ t('brand.privacy') }}</NuxtLink>
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

const reviewDueCount = ref(0)
const showReviewBadge = computed(() => reviewDueCount.value > 0)

// Fetch review due count for badge
async function fetchReviewDueCount() {
  try {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
    const stats = await $fetch<{ dueCount: number }>('/api/review/stats', { headers })
    reviewDueCount.value = stats.dueCount
  } catch {
    reviewDueCount.value = 0
  }
}

const navItems = computed(() => [
  { key: 'dashboard', label: t('auth.dashboard'), path: '/dashboard', icon: '🏠' },
  { key: 'practice', label: t('boards.practice.subtitle'), path: '/practice', icon: '⚡' },
  { key: 'paraphrase', label: t('boards.paraphrase.subtitle'), path: '/paraphrase', icon: '🔄' },
  { key: 'grammar', label: t('boards.grammar.subtitle'), path: '/grammar', icon: '◎' },
  { key: 'history', label: t('nav.history'), path: '/history', icon: '📝' },
  { key: 'review', label: t('review.title'), path: '/review', icon: '🔄' },
  { key: 'bookmarks', label: t('bookmarks.title'), path: '/bookmarks', icon: '🔖' },
  { key: 'ranking', label: t('ranking.nav'), path: '/ranking', icon: '🏆' },
])

const mobileTabs = computed(() => [
  { key: 'dashboard', shortLabel: t('auth.dashboard'), path: '/dashboard', icon: '🏠' },
  { key: 'practice', shortLabel: t('boards.practice.subtitle'), path: '/practice', icon: '⚡' },
  { key: 'grammar', shortLabel: t('boards.grammar.subtitle'), path: '/grammar', icon: '◎' },
  { key: 'review', shortLabel: t('review.title'), path: '/review', icon: '🔄' },
  { key: 'bookmarks', shortLabel: t('bookmarks.title'), path: '/bookmarks', icon: '🔖' },
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
.app-root {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background: transparent;
  color: var(--text-primary);
  transition: color 0.45s ease;
}

.header-scrolled {
  border-bottom: 1px solid var(--header-border);
  background-color: var(--header-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.header-transparent {
  border-bottom: 1px solid transparent;
  background-color: transparent;
}

.nav-link {
  color: var(--text-tertiary);
}
.nav-link:hover {
  color: var(--text-primary);
}
.nav-link-active {
  background-color: color-mix(in srgb, var(--accent-color) 10%, transparent);
  color: var(--accent-soft) !important;
}

.credits-badge {
  background-color: var(--bg-tertiary);
}
.credits-dot {
  color: var(--accent-soft);
}
.credits-text {
  color: var(--text-secondary);
}

.btn-ghost {
  color: var(--text-tertiary);
}
.btn-ghost:hover {
  color: var(--text-primary);
}

.btn-ghost-icon {
  color: var(--text-tertiary);
  transition: color 0.2s ease;
}
.btn-ghost-icon:hover {
  color: var(--text-primary);
}

.login-link {
  color: var(--text-tertiary);
}
.login-link:hover {
  color: var(--text-primary);
}

.mobile-menu {
  border-top: 1px solid var(--border-subtle);
  background-color: var(--mobile-nav-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.mobile-nav-link {
  color: var(--text-secondary);
}
.mobile-nav-link:hover {
  color: var(--text-primary);
}
.mobile-nav-link-active {
  background-color: color-mix(in srgb, var(--accent-color) 10%, transparent);
  color: var(--accent-soft) !important;
}

.mobile-menu-divider {
  border-top: 1px solid var(--border-subtle);
}

.mobile-menu-label {
  color: var(--text-tertiary);
}

.mobile-menu-value {
  font-weight: 600;
  color: var(--accent-soft);
}

.mobile-logout-btn {
  color: var(--text-secondary);
}
.mobile-logout-btn:hover {
  color: var(--text-primary);
}

.bottom-nav {
  border-top: 1px solid var(--border-subtle);
  background-color: var(--mobile-nav-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.bottom-nav-item {
  color: var(--text-muted);
}
.bottom-nav-item-active {
  color: var(--accent-soft);
}

.site-footer {
  border-top: 1px solid var(--border-subtle);
}

.footer-text {
  color: var(--text-muted);
}

.footer-link {
  font-family: var(--font-display);
  color: var(--text-tertiary);
}
.footer-link:hover {
  color: var(--text-primary);
}

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
