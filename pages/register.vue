<template>
  <!-- 注册页容器，限制最大宽度并垂直居中 / Register page container, centered with a max width -->
  <div class="mx-auto flex min-h-[calc(100svh-4rem)] max-w-md flex-col justify-center px-6 py-16">
    <div class="hero-rise">
      <!-- 标题区 / Heading area -->
      <p class="text-xs uppercase tracking-[0.28em] text-accent-soft">{{ t('auth.register') }}</p>
      <h1 class="mt-3 font-display text-4xl font-bold tracking-tight">{{ t('auth.registerTitle') }}</h1>
      <p class="mt-3 text-sm text-stone-400">{{ t('auth.registerSubtitle') }}</p>

      <!-- 注册表单 / Register form -->
      <form class="mt-10 space-y-5" @submit.prevent="onSubmit">
        <!-- 邮箱输入 / Email input -->
        <div>
          <label class="block text-xs uppercase tracking-wide text-stone-500" for="email">{{
            t('auth.email')
          }}</label>
          <UInput id="email" v-model="email" type="email" :placeholder="t('auth.emailPlaceholder')" :ui="{
            root: 'w-full',
            wrapper: 'mt-2',
            input: 'border-white/10 bg-ink-800/60 text-stone-100 placeholder-stone-500 focus:border-accent focus:ring-accent/30',
          }" />
        </div>

        <!-- 昵称输入 / Name input -->
        <div>
          <label class="block text-xs uppercase tracking-wide text-stone-500" for="name">{{
            t('auth.name')
          }}</label>
          <UInput id="name" v-model="name" type="text" :placeholder="t('auth.namePlaceholder')" :ui="{
            root: 'w-full',
            wrapper: 'mt-2',
            input: 'border-white/10 bg-ink-800/60 text-stone-100 placeholder-stone-500 focus:border-accent focus:ring-accent/30',
          }" />
        </div>

        <!-- 密码输入 / Password input -->
        <div>
          <label class="block text-xs uppercase tracking-wide text-stone-500" for="password">{{
            t('auth.password')
          }}</label>
          <UInput id="password" v-model="password" type="password" :placeholder="t('auth.passwordPlaceholder')" :ui="{
            root: 'w-full',
            wrapper: 'mt-2',
            input: 'border-white/10 bg-ink-800/60 text-stone-100 placeholder-stone-500 focus:border-accent focus:ring-accent/30',
          }" />
        </div>

        <!-- 人机验证组件 / Turnstile human-verification widget -->
        <NuxtTurnstile ref="turnstileRef" v-model="token" :options="turnstileOptions" />

        <!-- 错误提示 / Error message -->
        <p v-if="error" class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {{ error }}
        </p>

        <!-- 提交按钮 / Submit button -->
        <UButton type="submit" :loading="loading" :disabled="loading || !token"
          class="w-full bg-accent text-ink-950 hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60">
          {{ loading ? t('auth.loading') : t('auth.registerSubmit') }}
        </UButton>
      </form>

      <!-- 跳转登录 / Link to login -->
      <NuxtLink :to="localePath('/login')"
        class="mt-8 inline-block text-sm text-stone-400 transition-colors hover:text-white">
        {{ t('auth.toLogin') }} →
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// 获取 i18n 翻译与是否存在某 key 的工具 / Obtain i18n translate and key-existence helpers
const { t, te } = useI18n()
// 获取本地化路径工具 / Obtain the localized-path helper
const localePath = useLocalePath()
// 获取用户状态 store / Obtain the user store
const store = useUserStore()

// 若尚未拉取会话则先拉取 / Fetch session if not yet fetched
if (!store.fetched) {
  await store.fetch()
}
// 已登录则跳转到 dashboard / If authenticated, redirect to dashboard
if (store.isAuthenticated) {
  await navigateTo(localePath('/dashboard'))
}

// 表单字段的响应式引用 / Reactive refs for form fields
const email = ref('')
const name = ref('')
const password = ref('')
const token = ref('') // Turnstile 令牌 / Turnstile token
const loading = ref(false) // 提交中状态 / Submitting state
const error = ref('') // 错误信息 / Error message

// Turnstile 组件引用类型 / Type of the Turnstile component ref
type TurnstileRef = { reset: () => void }
// Turnstile 组件引用 / Ref to the Turnstile component
const turnstileRef = ref<TurnstileRef | null>(null)

// Turnstile 回调配置 / Turnstile callback options
const turnstileOptions = {
  // 验证失败回调 / Error callback
  'error-callback': () => {
    token.value = ''
    error.value = t('auth.errors.turnstile_failed')
  },
  // 令牌过期回调 / Expired callback
  'expired-callback': () => {
    token.value = ''
    error.value = t('auth.errors.turnstile_expired')
  },
}

// 监听令牌变化，有令牌则清除错误 / Watch token; clear error when a token appears
watch(token, (v) => {
  if (v) {
    error.value = ''
  }
})

// 提交处理函数 / Submit handler
const onSubmit = async () => {
  // 无令牌则提示需验证 / Require a token first
  if (!token.value) {
    error.value = t('auth.errors.turnstile_required')
    return
  }

  // 重置状态并开始加载 / Reset error and start loading
  error.value = ''
  loading.value = true
  try {
    // 调用 store 注册 / Call store register
    await store.register({
      email: email.value,
      password: password.value,
      name: name.value || undefined, // 昵称为可选 / Name is optional
      turnstileToken: token.value,
    })
    // 注册成功后跳转 dashboard / Navigate to dashboard after success
    await navigateTo(localePath('/dashboard'))
  } catch (e: any) {
    // 失败则映射错误信息 / Map the error on failure
    error.value = mapError(e)
    token.value = ''
    turnstileRef.value?.reset()
  } finally {
    // 结束加载 / Stop loading
    loading.value = false
  }
}

// 将接口错误映射为本地化文案 / Map an API error to a localized message
function mapError(e: any): string {
  // 取出服务端状态信息 / Extract the server status message
  const status = e?.response?._data?.statusMessage || e?.statusMessage || ''
  // 拼接对应错误 key / Build the matching error key
  const key = `auth.errors.${status}`
  // 命中则用对应文案，否则用通用凭据错误 / Use specific message if present, else generic invalid-credentials
  return te(key) ? t(key) : t('auth.errors.invalid_credentials')
}
</script>