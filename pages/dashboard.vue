<template>
  <div class="mx-auto max-w-5xl px-6 pb-24 pt-28">
    <!-- 欢迎标题 / Welcome header -->
    <header class="mb-10">
      <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {{ t('auth.welcome', { name: displayName }) }}
      </h1>
      <p class="mt-2 text-stone-400">{{ t('dashboard.subtitle') }}</p>
    </header>

    <!-- 顶部四项统计卡片 / Top four stat cards -->
    <div class="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
      <!-- 遍历统计项 / Iterate stat items -->
      <div v-for="s in stats" :key="s.label" class="flex flex-col items-center bg-ink-900 px-4 py-6 text-center">
        <span class="text-2xl">{{ s.icon }}</span>
        <p class="mt-3 font-display text-3xl font-semibold text-stone-100">{{ s.value }}</p>
        <p class="mt-1 text-xs uppercase tracking-wide text-stone-500">{{ s.label }}</p>
      </div>
    </div>

    <!-- 等级进度 + 快捷操作 / Level progress + quick actions -->
    <div class="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- 等级卡片 / Level card -->
      <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6 lg:col-span-2">
        <div class="flex items-center gap-3">
          <span class="text-xl">{{ levelInfo.icon }}</span>
          <div>
            <!-- 等级名 / Level name -->
            <p class="font-display text-lg font-semibold text-stone-100">Lv.{{ userLevel }} {{ t(levelInfo.nameKey) }}</p>
            <!-- 当前等级经验 / XP within level -->
            <p class="text-sm text-stone-400">{{ experienceInLevel }} / {{ XP_PER_LEVEL }} {{ t('dashboard.level.label') }}</p>
          </div>
        </div>
        <!-- 经验进度条 / XP progress bar -->
        <div class="mt-4 h-2 overflow-hidden rounded-full bg-ink-800">
          <div
            class="h-full rounded-full bg-accent transition-all duration-500"
            :style="{ width: `${experiencePercent}%` }"
          />
        </div>
        <p class="mt-3 text-xs text-stone-500">{{ t('dashboard.level.hint') }}</p>
      </div>

      <!-- 快捷操作卡片 / Quick actions card -->
      <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
        <h3 class="text-sm font-semibold text-stone-300">{{ t('dashboard.quickActions.title') }}</h3>
        <div class="mt-4 space-y-3">
          <!-- 开始练习 / Start practice -->
          <UButton
            :to="localePath('/practice')"
            class="w-full bg-white text-ink-950 hover:bg-stone-100"
            size="lg"
          >
            <span>⚡</span>
            {{ t('dashboard.quickActions.startPractice') }}
          </UButton>
          <!-- 语法专项 / Grammar focus -->
          <UButton
            :to="localePath('/grammar')"
            variant="outline"
            class="w-full border-white/15 text-stone-300 hover:border-accent hover:text-white"
            size="lg"
          >
            <span>◎</span>
            {{ t('dashboard.quickActions.grammarFocus') }}
          </UButton>
          <!-- 回顾错题 / Review mistakes -->
          <UButton
            :to="localePath('/history')"
            variant="outline"
            class="w-full border-white/15 text-stone-300 hover:border-accent hover:text-white"
            size="lg"
          >
            <span>📝</span>
            {{ t('dashboard.quickActions.reviewMistakes') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- 最近记录 / Recent history -->
    <section class="mt-10 rounded-2xl border border-white/10 bg-ink-900/50 p-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-display text-lg font-semibold text-stone-100">{{ t('dashboard.recent.title') }}</h2>
          <p class="mt-1 text-sm text-stone-500">{{ t('dashboard.recent.label') }}</p>
        </div>
        <!-- 查看全部历史 / View all history -->
        <NuxtLink :to="localePath('/history')" class="text-sm text-accent-soft transition-colors hover:text-accent">
          {{ t('boards.enter') }} →
        </NuxtLink>
      </div>

      <!-- 历史条目列表 / History entry list -->
      <div v-if="historyEntries.length > 0" class="mt-6 border-t border-white/5">
        <!-- 遍历历史条目 / Iterate history entries -->
        <div
          v-for="(entry, i) in historyEntries"
          :key="entry.id"
          class="flex items-start justify-between border-b border-white/5 py-4 last:border-b-0"
        >
          <div class="flex items-start gap-3">
            <!-- 对错图标 / Correct/incorrect icon -->
            <span :class="['mt-1 text-sm', entry.isCorrect ? 'text-green-400' : 'text-red-400']">
              {{ entry.isCorrect ? '✓' : '✗' }}
            </span>
            <div>
              <p class="font-medium text-stone-200">{{ entry.questionText }}</p>
              <p class="mt-1 text-xs text-stone-500">{{ entry.topic }}</p>
            </div>
          </div>
          <!-- 日期 / Date -->
          <span class="text-xs text-stone-500">{{ formatDate(entry.createdAt) }}</span>
        </div>
      </div>

      <!-- 无数据占位 / Empty state -->
      <div v-else class="mt-8 text-center text-sm text-stone-500">
        {{ t('dashboard.recent.noData') }}
      </div>
    </section>

    <!-- 充值按钮 / Recharge button -->
    <div class="mt-8 text-center">
      <UButton
        variant="outline"
        :loading="recharging"
        class="border-white/15 text-stone-300 hover:border-accent hover:text-white"
        @click="onRecharge"
      >
        <template #leading>
          <span class="text-accent-soft">⚡</span>
        </template>
        {{ recharging ? t('dashboard.recharge.loading') : t('dashboard.recharge.button') }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
// 引入用户类型 / Import the user type
import type { SessionUser } from '~/stores/user'

// 启用 auth 路由守卫 / Enable the auth route guard
definePageMeta({ middleware: 'auth' })

// 获取 i18n / Obtain i18n
const { t } = useI18n()
// 获取本地化路径工具 / Obtain the localized-path helper
const localePath = useLocalePath()
// 获取用户 store / Obtain the user store
const store = useUserStore()
// 当前用户（断言为 SessionUser）/ Current user (asserted as SessionUser)
const user = computed(() => store.user as SessionUser)

// 展示名：昵称优先，其次邮箱 / Display name: name first, else email
const displayName = computed(() => user.value?.name || user.value?.email || '')

// 单项统计结构 / Single-board stat shape
interface BoardStat { total: number; correct: number }
// 统计接口返回结构 / Stats response shape
interface StatsResp {
  total: number
  correct: number
  perBoard: { practice: BoardStat; paraphrase: BoardStat; grammar: BoardStat }
}

// 历史条目结构 / History entry shape
interface HistoryEntry {
  id: string
  questionText: string
  isCorrect: boolean
  score: number | null
  topic: string | null
  createdAt: string
}

// 统计响应 / Stats response
const statsResp = ref<StatsResp | null>(null)
// 历史条目列表 / History entries
const historyEntries = ref<HistoryEntry[]>([])

// 加载统计与历史 / Load stats and history
async function loadData() {
  // 服务端转发 cookie，用于识别会话 / Forward cookie on server to identify the session
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  try {
    // 获取统计数据 / Fetch stats
    statsResp.value = await $fetch<StatsResp>('/api/stats', { headers })
    // 获取历史数据 / Fetch history
    const history = await $fetch<{ entries: HistoryEntry[] }>('/api/history', { headers })
    historyEntries.value = history.entries
  } catch {
    // 失败则置空 / Reset on failure
    statsResp.value = null
    historyEntries.value = []
  }
}

// 首次加载 / Initial load
await loadData()

// 正确率 / Accuracy rate
const accRate = computed(() => {
  const total = user.value?.totalAttempts ?? 0
  const correct = user.value?.correctAttempts ?? 0
  if (total === 0) return '—' // 无数据 / No data
  return `${Math.round((correct / total) * 100)}%` // 百分比 / Percentage
})

// ---------- 等级 / Level ----------

// 每次作答获得经验 / XP per attempt
const XP_PER_ATTEMPT = 10
// 每级所需经验 / XP per level
const XP_PER_LEVEL = 500

// 各等级名称与图标 / Level name and icon per level
const LEVEL_NAMES: Record<number, { nameKey: string; icon: string }> = {
  1: { nameKey: 'dashboard.level.name1', icon: '🌱' }, // 萌芽 / Sprout
  2: { nameKey: 'dashboard.level.name2', icon: '📚' }, // 书本 / Books
  3: { nameKey: 'dashboard.level.name3', icon: '⚡' }, // 闪电 / Bolt
  4: { nameKey: 'dashboard.level.name4', icon: '🔥' }, // 火焰 / Fire
  5: { nameKey: 'dashboard.level.name5', icon: '💎' }, // 钻石 / Diamond
  6: { nameKey: 'dashboard.level.name6', icon: '👑' }, // 皇冠 / Crown
}

// 取得等级信息，超出则封顶 / Get level info, capped at max
function getLevelInfo(level: number) {
  return LEVEL_NAMES[level] ?? { nameKey: 'dashboard.level.nameMax', icon: '🏆' }
}

// 当前等级 / Current level
const userLevel = computed(() => user.value?.level ?? 1)
// 累计经验 / Total experience
const experience = computed(() => (user.value?.totalAttempts ?? 0) * XP_PER_ATTEMPT)
// 当前等级内经验 / XP within the current level
const experienceInLevel = computed(() => experience.value % XP_PER_LEVEL)
// 经验百分比 / XP percentage
const experiencePercent = computed(() => Math.round((experienceInLevel.value / XP_PER_LEVEL) * 100))
// 等级信息 / Level info
const levelInfo = computed(() => getLevelInfo(userLevel.value))

// 顶部四张统计卡片 / Top four stat cards
const stats = computed(() => [
  { icon: '⚡', label: t('dashboard.stats.energy'), value: user.value?.credits ?? 0 }, // 能量 / Credits
  { icon: '🔥', label: t('dashboard.stats.streak'), value: user.value?.streak ?? 0 }, // 连续 / Streak
  { icon: '◎', label: t('dashboard.stats.accuracy'), value: accRate.value }, // 正确率 / Accuracy
  { icon: '🏆', label: t('dashboard.stats.total'), value: user.value?.totalAttempts ?? 0 }, // 总数 / Total
])

// 日期格式化 / Format an ISO date
function formatDate(iso: string): string {
  const d = new Date(iso)
  // 返回 月/日/年 / Return MM/DD/YYYY
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

// 充值中标志 / Recharging flag
const recharging = ref(false)
// 充值处理函数 / Recharge handler
const onRecharge = async () => {
  // 防止重复 / Guard against duplicate
  if (recharging.value) return
  recharging.value = true
  try {
    // 调用充值接口 / Call the recharge API
    const updated = await $fetch<SessionUser>('/api/credits/recharge', { method: 'POST' })
    // 更新用户信息 / Update the user
    store.setUser(updated)
    // 重新加载数据 / Reload data
    await loadData()
  } finally {
    // 结束充值 / Stop recharging
    recharging.value = false
  }
}
</script>