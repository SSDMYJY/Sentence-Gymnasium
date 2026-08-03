<template>
  <div class="mx-auto max-w-5xl px-6 pb-24 pt-28">
    <!-- 欢迎标题 / Welcome header -->
    <header class="mb-10">
      <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {{ t('auth.welcome', { name: displayName }) }}
      </h1>
      <p class="mt-2 text-tertiary">{{ t('dashboard.subtitle') }}</p>
    </header>

    <!-- 加载中 / Loading -->
    <div v-if="loading" class="ds-card p-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      <p class="mt-4 text-sm text-tertiary">{{ t('history.loading') }}</p>
    </div>

    <template v-else>
    <!-- Daily Goal Progress Ring + Top Stats -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <!-- Daily Goal Ring -->
      <div class="ds-card relative flex flex-col items-center justify-center">
        <svg class="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="8"
            class="text-line-default" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="goalOffset"
            class="text-accent transition-all duration-700" />
        </svg>
        <div class="absolute top-1/2.25 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <span class="text-2xl font-bold text-primary">{{ todayAttempts }}/{{ dailyGoal }}</span>
          <span class="text-xs text-muted">{{ t('dashboard.dailyGoal.title') }}</span>
        </div>
        <div class="relative mt-2">
          <UButton variant="ghost" size="xs" class="text-xs text-tertiary hover:text-accent"
            @click="showGoalPopover = !showGoalPopover">
            {{ t('dashboard.dailyGoal.adjust') }}
          </UButton>
          <div v-if="showGoalPopover"
            class="absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 border border-line-default bg-elevated p-3 shadow-lg">
            <div class="flex gap-2">
              <UButton v-for="g in goalOptions" :key="g" size="xs"
                :variant="dailyGoal === g ? 'solid' : 'outline'"
                :class="dailyGoal === g ? 'bg-accent text-ink-950' : 'border-line-strong text-tertiary'"
                @click="onSetGoal(g)">
                {{ g }}
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Top four stat cards -->
      <div class="col-span-1 lg:col-span-3 grid grid-cols-2 gap-px overflow-hidden border border-line-default bg-line-default sm:grid-cols-4">
        <div v-for="s in stats" :key="s.label" class="flex flex-col items-center bg-card px-4 py-6 text-center">
          <UIcon :name="s.icon" class="text-2xl" />
          <p class="mt-3 font-display text-3xl font-semibold text-primary">{{ s.value }}</p>
          <p class="mt-1 text-xs uppercase tracking-wide text-muted">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Weekly Activity Bars -->
    <div v-if="weeklyActivity.length > 0" class="mt-6 ds-card">
      <h3 class="text-sm font-semibold text-tertiary mb-4">{{ t('dashboard.weekly.title') }}</h3>
      <div class="flex items-end justify-between gap-2">
        <div v-for="day in weeklyActivity" :key="day.date" class="flex flex-1 flex-col items-center gap-1">
          <div class="w-full bg-accent/30 transition-all duration-500"
            :style="{ height: `${Math.max(4, (day.count / maxWeeklyCount) * 80)}px` }" />
          <span class="text-[10px] text-muted">{{ formatDayLabel(day.date) }}</span>
        </div>
      </div>
    </div>

    <!-- 等级进度 + 快捷操作 / Level progress + quick actions -->
    <div class="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- 等级卡片 / Level card -->
      <div class="ds-card lg:col-span-2">
        <div class="flex items-center gap-3">
          <span class="text-xl">{{ levelInfo.icon }}</span>
          <div>
            <!-- 等级名 / Level name -->
            <p class="font-display text-lg font-semibold text-primary">Lv.{{ userLevel }} {{ t(levelInfo.nameKey) }}</p>
            <!-- 当前等级经验 / XP within level -->
            <p class="text-sm text-tertiary">{{ experienceInLevel }} / {{ XP_PER_LEVEL }} {{ t('dashboard.level.label') }}</p>
          </div>
        </div>
        <!-- 经验进度条 / XP progress bar -->
        <div class="mt-4 h-2 overflow-hidden bg-elevated">
          <div
            class="h-full bg-accent transition-all duration-500"
            :style="{ width: `${experiencePercent}%` }"
          />
        </div>
        <p class="mt-3 text-xs text-muted">{{ t('dashboard.level.hint') }}</p>
      </div>

      <!-- 快捷操作卡片 / Quick actions card -->
      <div class="ds-card">
        <h3 class="text-sm font-semibold text-tertiary">{{ t('dashboard.quickActions.title') }}</h3>
        <div class="mt-4 space-y-3">
          <!-- 开始练习 / Start practice -->
          <UButton
            :to="localePath('/practice')"
            class="w-full bg-accent text-ink-950 hover:bg-accent-soft"
            size="lg"
          >
            <UIcon name="i-lucide-zap" />
            {{ t('dashboard.quickActions.startPractice') }}
          </UButton>
          <!-- 语法专项 / Grammar focus -->
          <UButton
            :to="localePath('/grammar')"
            variant="outline"
            class="w-full border-line-strong text-tertiary hover:border-accent hover:text-primary"
            size="lg"
          >
            <UIcon name="i-lucide-circle" />
            {{ t('dashboard.quickActions.grammarFocus') }}
          </UButton>
          <!-- 复习错题 / Review mistakes -->
          <UButton
            :to="localePath('/review')"
            variant="outline"
            class="w-full border-line-strong text-tertiary hover:border-accent hover:text-primary"
            size="lg"
          >
            <UIcon name="i-lucide-rotate-cw" />
            {{ t('dashboard.quickActions.reviewMistakes') }}
            <span v-if="reviewDueCount > 0"
              class="ml-auto bg-accent/20 px-2 py-0.5 text-xs text-accent-soft">
              {{ reviewDueCount }}
            </span>
          </UButton>
        </div>
      </div>
    </div>

    <!-- Weak Areas Section -->
    <div v-if="weakAreas.length > 0" class="mt-6 ds-card">
      <h3 class="text-sm font-semibold text-tertiary">{{ t('dashboard.weakAreas.title') }}</h3>
      <p class="mt-1 text-xs text-muted">{{ t('dashboard.weakAreas.label') }}</p>
      <div class="mt-4 space-y-3">
        <div v-for="area in weakAreas" :key="area.tag" class="flex items-center gap-4">
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="text-sm text-secondary">{{ area.label }}</span>
              <span class="text-sm font-medium"
                :class="area.accuracy < 50 ? 'text-danger' : area.accuracy < 70 ? 'text-warning' : 'text-success'">
                {{ area.accuracy }}%
              </span>
            </div>
            <div class="mt-1 h-1.5 overflow-hidden bg-elevated">
              <div class="h-full transition-all duration-500"
                :class="area.accuracy < 50 ? 'bg-danger' : area.accuracy < 70 ? 'bg-warning' : 'bg-success'"
                :style="{ width: `${area.accuracy}%` }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近记录 / Recent history -->
    <section class="mt-10 ds-card">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-display text-lg font-semibold text-primary">{{ t('dashboard.recent.title') }}</h2>
          <p class="mt-1 text-sm text-muted">{{ t('dashboard.recent.label') }}</p>
        </div>
        <!-- 查看全部历史 / View all history -->
        <NuxtLink :to="localePath('/history')" class="text-sm text-accent-soft transition-colors hover:text-accent">
          {{ t('boards.enter') }} →
        </NuxtLink>
      </div>

      <!-- 历史条目列表 / History entry list -->
      <div v-if="historyEntries.length > 0" class="mt-6 border-t border-line-subtle">
        <!-- 遍历历史条目 / Iterate history entries -->
        <div
          v-for="(entry, i) in historyEntries"
          :key="entry.id"
          class="flex items-start justify-between border-b border-line-subtle py-4 last:border-b-0"
        >
          <div class="flex items-start gap-3">
            <!-- 对错图标 / Correct/incorrect icon -->
            <UIcon :name="entry.isCorrect ? 'i-lucide-check' : 'i-lucide-x'"
              :class="['mt-1 text-sm', entry.isCorrect ? 'text-success' : 'text-danger']" />
            <div>
              <p class="font-medium text-secondary">{{ entry.questionText }}</p>
              <p class="mt-1 text-xs text-muted">{{ entry.topic }}</p>
            </div>
          </div>
          <!-- 日期 / Date -->
          <span class="text-xs text-muted">{{ formatDate(entry.createdAt) }}</span>
        </div>
      </div>

      <!-- 无数据占位 / Empty state -->
      <div v-else class="mt-8 text-center text-sm text-muted">
        {{ t('dashboard.recent.noData') }}
      </div>
    </section>

    <!-- 充值入口 / Recharge entry -->
    <div class="mt-8 text-center">
      <UButton
        variant="outline"
        :to="localePath('/recharge')"
        class="border-line-strong text-tertiary hover:border-accent hover:text-primary"
      >
        <template #leading>
          <UIcon name="i-lucide-zap" class="text-accent-soft" />
        </template>
        {{ t('dashboard.recharge.button') }}
      </UButton>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// 引入用户类型 / Import the user type
import type { SessionUser } from '~/stores/user'

// 启用 auth 路由守卫 / Enable the auth route guard
// ssr:false：纯客户端渲染，避免客户端导航时向云函数请求 SSR payload（冷启动 2~4s）
definePageMeta({ middleware: 'auth', ssr: false })

// ===== SEO：登录后仪表板，noindex =====
useSeo({
  title: {
    'zh-hans': '训练仪表板',
    'zh-hant': '訓練儀表板',
    'en':      'Training Dashboard',
    'ja':      'トレーニングダッシュボード',
  },
  description: {
    'zh-hans': '句子健身房个人训练仪表板：能量、连胜、正确率、等级经验、今日目标、本周训练统计一览。',
    'zh-hant': '句子健身房個人訓練儀表板：能量、連勝、正確率、等級經驗、今日目標、本週訓練統計一覽。',
    'en':      'Your Sentence Gymnasium training dashboard — credits, streak, accuracy, XP and level, daily goal, weekly stats.',
    'ja':      'センテンスジム個人ダッシュボード — クレジット・連続日数・正解率・XPとレベル・今日の目標・週間統計。',
  },
  noindex: true,
})

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
interface WeakArea { tag: string; label: string; total: number; correct: number; accuracy: number }
interface WeeklyDay { date: string; count: number }
// 统计接口返回结构 / Stats response shape
interface StatsResp {
  total: number
  correct: number
  perBoard: { practice: BoardStat; paraphrase: BoardStat; grammar: BoardStat }
  todayAttempts: number
  dailyGoal: number
  weeklyActivity: WeeklyDay[]
  weakAreas: WeakArea[]
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
const loading = ref(true)
// Goal popover
const showGoalPopover = ref(false)
const goalOptions = [3, 5, 10, 15]
// Review due count
const reviewDueCount = ref(0)

// 加载统计与历史 / Load stats and history
async function loadData() {
  loading.value = true
  try {
    const [stats, history, reviewStats] = await Promise.all([
      useCachedApi<StatsResp>('dashboard:stats', () => useApi<StatsResp>('/api/stats'), 60_000),
      useCachedApi<{ entries: HistoryEntry[] }>('dashboard:history', () => useApi<{ entries: HistoryEntry[] }>('/api/history'), 60_000),
      useCachedApi<{ dueCount: number }>('dashboard:reviewStats', () => useApi<{ dueCount: number }>('/api/review/stats'), 60_000).catch(() => null),
    ])
    statsResp.value = stats
    historyEntries.value = history.entries
    if (reviewStats) reviewDueCount.value = reviewStats.dueCount
  } catch {
    statsResp.value = null
    historyEntries.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

// 正确率 / Accuracy rate
const accRate = computed(() => {
  const total = user.value?.totalAttempts ?? 0
  const correct = user.value?.correctAttempts ?? 0
  if (total === 0) return '—' // 无数据 / No data
  return `${Math.round((correct / total) * 100)}%` // 百分比 / Percentage
})

// Daily goal
const dailyGoal = computed(() => statsResp.value?.dailyGoal ?? user.value?.dailyGoal ?? 5)
const todayAttempts = computed(() => statsResp.value?.todayAttempts ?? 0)
const circumference = 2 * Math.PI * 42 // r=42
const goalOffset = computed(() => {
  const goal = dailyGoal.value
  const done = Math.min(todayAttempts.value, goal)
  const fraction = goal > 0 ? done / goal : 0
  return circumference * (1 - fraction)
})

// Weekly activity
const weeklyActivity = computed(() => statsResp.value?.weeklyActivity ?? [])
const maxWeeklyCount = computed(() => {
  const counts = weeklyActivity.value.map(d => d.count)
  return Math.max(1, ...counts)
})

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[d.getDay()] as string
}

// Weak areas
const weakAreas = computed(() => statsResp.value?.weakAreas ?? [])

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
  { icon: 'i-lucide-zap', label: t('dashboard.stats.energy'), value: user.value?.credits ?? 0 }, // 能量 / Credits
  { icon: 'i-lucide-flame', label: t('dashboard.stats.streak'), value: user.value?.streak ?? 0 }, // 连续 / Streak
  { icon: 'i-lucide-target', label: t('dashboard.stats.accuracy'), value: accRate.value }, // 正确率 / Accuracy
  { icon: 'i-lucide-trophy', label: t('dashboard.stats.total'), value: user.value?.totalAttempts ?? 0 }, // 总数 / Total
])

// 日期格式化 / Format an ISO date
function formatDate(iso: string): string {
  const d = new Date(iso)
  // 返回 月/日/年 / Return MM/DD/YYYY
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

// Set daily goal
async function onSetGoal(goal: number) {
  showGoalPopover.value = false
  try {
    const updated = await useApi<SessionUser>('/api/stats/goal', {
      method: 'PUT',
      body: { dailyGoal: goal },
    })
    store.setUser(updated)
    if (statsResp.value) {
      statsResp.value.dailyGoal = goal
    }
  } catch {}
}
</script>