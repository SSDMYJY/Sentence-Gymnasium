<template>
  <div class="mx-auto max-w-4xl px-6 py-16">
    <!-- 页头 / Header -->
    <div class="mb-10 text-center">
      <h1 class="font-display text-3xl font-bold tracking-tight text-primary">{{ t('recharge.title') }}</h1>
      <p class="mx-auto mt-3 max-w-xl text-sm text-tertiary">{{ t('recharge.subtitle') }}</p>
      <div class="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-900/50 px-5 py-2 text-sm">
        <UIcon name="i-lucide-zap" class="text-accent-soft" />
        <span class="text-muted">{{ t('recharge.currentBalance') }}</span>
        <span class="font-semibold text-primary">{{ user?.credits ?? 0 }}</span>
      </div>
    </div>

    <!-- 套餐选择 / Pack selection -->
    <section class="mb-8">
      <h2 class="mb-4 font-display text-lg font-semibold text-primary">{{ t('recharge.selectPack') }}</h2>
      <div v-if="packs.length === 0" class="rounded-2xl border border-white/10 bg-ink-900/50 p-6 text-center text-sm text-muted">
        {{ t('recharge.noPacks') }}
      </div>
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          v-for="pack in packs"
          :key="pack.id"
          type="button"
          class="relative rounded-2xl border p-6 text-left transition-all duration-200"
          :class="selectedPack?.id === pack.id
            ? 'border-accent bg-accent-soft/10 ring-1 ring-accent'
            : 'border-white/10 bg-ink-900/50 hover:border-white/25'"
          @click="selectedPack = pack"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="font-display text-3xl font-bold text-primary">{{ pack.credits }}</p>
              <p class="mt-1 text-xs text-muted">{{ t('recharge.creditsUnit') }}</p>
            </div>
            <span class="rounded-full bg-accent-soft/15 px-3 py-1 text-sm font-semibold text-accent-soft">
              ${{ pack.price }}
            </span>
          </div>
          <span
            class="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border"
            :class="selectedPack?.id === pack.id ? 'border-accent bg-accent text-ink-900' : 'border-white/20'"
          >
            <UIcon v-if="selectedPack?.id === pack.id" name="i-lucide-check" class="text-xs" />
          </span>
        </button>
      </div>
    </section>

    <!-- 支付方式（展示性选择，实际支付在 Waffo 托管页完成） / Payment method (display-only) -->
    <section class="mb-8">
      <h2 class="mb-4 font-display text-lg font-semibold text-primary">{{ t('recharge.paymentMethod') }}</h2>
      <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="m in paymentMethods"
            :key="m.id"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors"
            :class="selectedMethod === m.id
              ? 'bg-accent-soft/15 text-accent-soft ring-1 ring-accent'
              : 'bg-white/5 text-tertiary hover:bg-white/10'"
            @click="selectedMethod = m.id"
          >
            <UIcon :name="m.icon" class="text-sm" />
            {{ m.label }}
          </button>
        </div>
        <p class="mt-3 text-xs text-muted">{{ t('recharge.paymentMethodHint') }}</p>
      </div>
    </section>

    <!-- 支付按钮 / Pay button -->
    <div class="text-center">
      <UButton
        size="lg"
        :loading="paying"
        :disabled="!selectedPack"
        class="w-full px-8 sm:w-auto"
        @click="onPay"
      >
        <template #leading>
          <UIcon name="i-lucide-zap" class="text-base" />
        </template>
        {{ paying ? t('recharge.processing') : t('recharge.payNow', { amount: selectedPack ? `$${selectedPack.price}` : '' }) }}
      </UButton>
      <p class="mt-3 text-xs text-muted">{{ t('recharge.secureNote') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SessionUser } from '~/stores/user'

definePageMeta({ middleware: 'auth' })

// ===== SEO：登录后充值页，noindex + Product schema（让 GEO 价格信息可用）=====
const { currentLocale, siteUrl, canonicalHref } = useSeo({
  title: {
    'zh-hans': '充值能量 · Credits',
    'zh-hant': '充值能量 · Credits',
    'en':      'Recharge Credits',
    'ja':      'クレジット購入',
  },
  description: {
    'zh-hans': '购买句子健身房训练能量（Credits），支持支付宝、微信、信用卡。安全支付由 Waffo Pancake 托管处理。',
    'zh-hant': '購買句子健身房訓練能量（Credits），支援支付寶、微信、信用卡。安全支付由 Waffo Pancake 託管處理。',
    'en':      'Purchase Sentence Gymnasium training credits. Pay with Alipay, WeChat Pay or credit card. Secure checkout hosted by Waffo Pancake.',
    'ja':      'センテンスジムのトレーニングクレジットを購入。Alipay・WeChat Pay・クレジットカード対応。Waffo Pancake の安全な決済。',
  },
  noindex: true,
})
const config = useRuntimeConfig()
const siteNameByLocale = (config.public?.siteName as Record<string, string>)?.[currentLocale] || 'Sentence Gymnasium'
useJsonLd([
  buildProduct({ siteUrl, locale: currentLocale, providerName: siteNameByLocale }),
])

const { t } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
const store = useUserStore()
const user = computed(() => store.user as SessionUser)

interface PackOption {
  id: string
  credits: number
  price: string
  currency: string
}

const packs = ref<PackOption[]>([])
const selectedPack = ref<PackOption | null>(null)
const paying = ref(false)
const selectedMethod = ref('all')

const paymentMethods = computed(() => [
  { id: 'all', label: t('recharge.methods.all'), icon: 'i-lucide-wallet' },
  { id: 'card', label: t('recharge.methods.card'), icon: 'i-lucide-credit-card' },
  { id: 'alipay', label: t('recharge.methods.alipay'), icon: 'i-lucide-smartphone' },
  { id: 'wechat', label: t('recharge.methods.wechat'), icon: 'i-lucide-message-circle' },
])

// 首次加载套餐 / Load packs
const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
try {
  const data = await $fetch<{ packs: PackOption[] }>('/api/credits/packages', { headers })
  packs.value = data.packs
  selectedPack.value = data.packs[0] ?? null
} catch {
  packs.value = []
}

// 发起支付：创建订单 + Waffo 托管会话，新窗口打开，然后进入结果页轮询
async function onPay() {
  if (!selectedPack.value || paying.value) return
  paying.value = true
  try {
    const res = await $fetch<{ checkoutUrl: string; orderId: string }>('/api/credits/checkout', {
      method: 'POST',
      body: { packId: selectedPack.value.id },
    })
    // 防御：服务端未返回有效支付链接（如 Waffo 会话创建失败被吞掉）时，
    // 不要跳转到会一直轮询"处理中"的结果页，而是直接提示失败。
    if (!res?.checkoutUrl || !res?.orderId) {
      toast.error(t('recharge.checkoutFailed'))
      return
    }
    // 新标签页打开托管支付页，保留本站页面状态
    window.open(res.checkoutUrl, '_blank', 'noopener,noreferrer')
    await navigateTo(localePath(`/recharge/success?orderId=${res.orderId}`))
  } catch (err: any) {
    const msg = err?.data?.statusMessage
    toast.error(msg === 'checkout_failed' ? t('recharge.checkoutFailed') : t('recharge.error'))
  } finally {
    paying.value = false
  }
}
</script>
