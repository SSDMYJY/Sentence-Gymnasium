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
          <UInput id="email" v-model="email" type="email" :placeholder="t('auth.emailPlaceholder')" :ui="{
            root: 'w-full',
            wrapper: 'mt-2 w-full',
            input: 'border-white/10 bg-ink-800/60 text-stone-100 placeholder-stone-500 focus:border-accent focus:ring-accent/30',
          }" />
        </div>

        <div>
          <label class="block text-xs uppercase tracking-wide text-stone-500" for="password">{{
            t('auth.password')
          }}</label>
          <UInput id="password" v-model="password" type="password" :placeholder="t('auth.passwordPlaceholder')" :ui="{
            root: 'w-full',
            wrapper: 'mt-2 w-full',
            input: 'border-white/10 bg-ink-800/60 text-stone-100 placeholder-stone-500 focus:border-accent focus:ring-accent/30',
          }" />
        </div>

        <NuxtTurnstile ref="turnstileRef" v-model="token" :options="turnstileOptions" />

        <p v-if="error" class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {{ error }}
        </p>

        <UButton type="submit" :loading="loading" :disabled="loading || !token"
          class="w-full bg-accent text-ink-950 hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60">
          {{ loading ? t('auth.loading') : t('auth.loginSubmit') }}
        </UButton>
      </form>

      <NuxtLink :to="localePath('/register')"
        class="mt-8 inline-block text-sm text-stone-400 transition-colors hover:text-white">
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

if (!store.fetched) {
  await store.fetch()
}
if (store.isAuthenticated) {
  await navigateTo((route.query.redirect as string) || localePath('/dashboard'))
}

const email = ref('')
const password = ref('')
const token = ref('')
const loading = ref(false)
const error = ref('')

type TurnstileRef = { reset: () => void }
const turnstileRef = ref<TurnstileRef | null>(null)

const turnstileOptions = {
  'error-callback': () => {
    token.value = ''
    error.value = t('auth.errors.turnstile_failed')
  },
  'expired-callback': () => {
    token.value = ''
    error.value = t('auth.errors.turnstile_expired')
  },
}

watch(token, (v) => {
  if (v) {
    error.value = ''
  }
})

const onSubmit = async () => {
  if (!token.value) {
    error.value = t('auth.errors.turnstile_required')
    return
  }

  error.value = ''
  loading.value = true
  try {
    await store.login(email.value, password.value, token.value)
    await navigateTo((route.query.redirect as string) || localePath('/dashboard'))
  } catch (e: any) {
    error.value = mapError(e)
    token.value = ''
    turnstileRef.value?.reset()
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
