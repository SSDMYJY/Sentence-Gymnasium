<template>
  <div class="mx-auto max-w-2xl px-6 py-24 text-center">
    <!-- 处理中 / Processing -->
    <div v-if="status === 'pending'">
      <div class="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <h1 class="font-display text-2xl font-bold text-primary">{{ t('rechargeSuccess.processing') }}</h1>
      <p class="mx-auto mt-3 max-w-md text-sm text-tertiary">{{ t('rechargeSuccess.processingHint') }}</p>
    </div>

    <!-- 成功 / Completed -->
    <div v-else-if="status === 'completed'">
      <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-3xl text-green-400">
        <UIcon name="i-lucide-check" class="h-8 w-8" />
      </div>
      <h1 class="font-display text-2xl font-bold text-primary">{{ t('rechargeSuccess.completed') }}</h1>
      <p class="mt-3 text-sm text-tertiary">{{ t('rechargeSuccess.completedHint', { credits }) }}</p>
      <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <UButton :to="localePath('/practice')">{{ t('rechargeSuccess.goPractice') }}</UButton>
        <UButton variant="outline" :to="localePath('/dashboard')">{{ t('rechargeSuccess.goDashboard') }}</UButton>
      </div>
    </div>

    <!-- 失败 / 已退款 / Failed or refunded -->
    <div v-else-if="status === 'failed' || status === 'refunded'">
      <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-3xl text-red-400">
        <UIcon name="i-lucide-x" class="h-8 w-8" />
      </div>
      <h1 class="font-display text-2xl font-bold text-primary">{{ t('rechargeSuccess.failed') }}</h1>
      <p class="mt-3 text-sm text-tertiary">{{ t('rechargeSuccess.failedHint') }}</p>
      <div class="mt-8">
        <UButton :to="localePath('/recharge')">{{ t('rechargeSuccess.retry') }}</UButton>
      </div>
    </div>

    <!-- 订单不存在 / Order not found -->
    <div v-else>
      <h1 class="font-display text-2xl font-bold text-primary">{{ t('rechargeSuccess.notFound') }}</h1>
      <div class="mt-8">
        <UButton :to="localePath('/recharge')">{{ t('rechargeSuccess.retry') }}</UButton>
      </div>
    </div>

    <!-- 手动刷新 / Manual refresh -->
    <div v-if="status === 'pending'" class="mt-8">
      <UButton variant="outline" :loading="refreshing" @click="refresh">
        {{ t('rechargeSuccess.refresh') }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

// ===== SEO：支付结果页（临时性），noindex =====
useSeo({
  title: {
    'zh-hans': '支付结果',
    'zh-hant': '支付結果',
    'en':      'Payment Status',
    'ja':      '支払いステータス',
  },
  description: {
    'zh-hans': '句子健身房充值支付处理中或完成页面。',
    'zh-hant': '句子健身房充值支付處理中或完成頁面。',
    'en':      'Sentence Gymnasium recharge payment processing or completion page.',
    'ja':      'センテンスジム クレジット購入の支払い処理ページ。',
  },
  noindex: true,
})

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const store = useUserStore()
const toast = useToast()

const orderId = computed(() => (route.query.orderId as string) || '')
type OrderStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'missing'
const status = ref<OrderStatus>('pending')
const credits = ref(0)
const refreshing = ref(false)
let credited = false
let timer: ReturnType<typeof setInterval> | null = null

async function refresh() {
  if (!orderId.value) {
    status.value = 'missing'
    return
  }
  refreshing.value = true
  try {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
    const order = await useApi<{ status: string; credits: number }>(`/api/credits/orders/${orderId.value}`, { headers })
    status.value = order.status as OrderStatus
    credits.value = order.credits
    if (order.status === 'completed' && !credited) {
      credited = true
      await store.fetch(true) // 从会话刷新用户能量 / refresh user credits from session
      toast.success(t('rechargeSuccess.toast'))
      stopPolling()
    }
  } catch {
    status.value = 'missing'
    stopPolling()
  } finally {
    refreshing.value = false
  }
}

function startPolling() {
  if (status.value === 'pending' && !timer) {
    timer = setInterval(refresh, 5000)
  }
}
function stopPolling() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// SSR 首帧即查询一次；随后客户端轮询
await refresh()
onMounted(startPolling)
onBeforeUnmount(stopPolling)
watch(status, (s) => {
  if (s !== 'pending') stopPolling()
})
</script>
