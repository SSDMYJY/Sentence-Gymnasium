<template>
  <div class="mx-auto flex min-h-[calc(100svh-4rem)] max-w-md flex-col justify-center px-6 py-16">
    <div class="hero-rise">
      <p class="text-xs uppercase tracking-[0.28em] text-accent-soft">{{ t('auth.login') }}</p>
      <h1 class="mt-3 font-display text-4xl font-bold tracking-tight">{{ t('auth.loginTitle') }}</h1>
      <p class="mt-3 text-sm text-stone-400">{{ t('auth.loginSubtitle') }}</p>

      <form class="mt-10 space-y-5" @submit.prevent="onSubmit">
        <div>
          <label class="block text-xs uppercase tracking-wide text-stone-500" for="email">{{
            t('auth.email')
          }}</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            :placeholder="t('auth.emailPlaceholder')"
            class="mt-2 w-full rounded-lg border border-white/10 bg-ink-800/60 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 transition-colors focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs uppercase tracking-wide text-stone-500" for="password">{{
            t('auth.password')
          }}</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            :placeholder="t('auth.passwordPlaceholder')"
            class="mt-2 w-full rounded-lg border border-white/10 bg-ink-800/60 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 transition-colors focus:border-accent focus:outline-none"
          />
        </div>

        <p v-if="error" class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {{ error }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink-950 transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? t('auth.loading') : t('auth.loginSubmit') }}
          <span v-if="!loading" class="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      </form>

      <NuxtLink
        :to="localePath('/register')"
        class="mt-8 inline-block text-sm text-stone-400 transition-colors hover:text-white"
      >
        {{ t('auth.toRegister') }} →
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t, te } = useI18n()
const localePath = useLocalePath()
const store = useUserStore()
const route = useRoute()

// SSR 阶段 store 尚未填充，需主动拉一次 session 判断登录态
if (!store.fetched) {
  await store.fetch()
}
// 已登录则直接回 dashboard / 目标页
if (store.isAuthenticated) {
  await navigateTo((route.query.redirect as string) || localePath('/dashboard'))
}

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const onSubmit = async () => {
  error.value = ''
  loading.value = true
  try {
    await store.login(email.value, password.value)
    await navigateTo((route.query.redirect as string) || localePath('/dashboard'))
  } catch (e: any) {
    error.value = mapError(e)
  } finally {
    loading.value = false
  }
}

function mapError(e: any): string {
  const status = e?.response?._data?.statusMessage || e?.statusMessage || ''
  const key = `auth.errors.${status}`
  return te(key) ? t(key) : t('auth.errors.invalid_credentials')
}
</script>
