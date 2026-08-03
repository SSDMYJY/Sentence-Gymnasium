<template>
  <div class="mx-auto max-w-2xl px-6 pb-24 pt-28">
    <!-- 排行榜标题 / Ranking page title -->
    <header class="mb-8 text-center">
      <h1 class="ds-heading-display text-3xl sm:text-4xl">
        {{ t('ranking.title') }}
      </h1>
      <p class="mt-2 text-tertiary">{{ t('ranking.subtitle') }}</p>
    </header>

    <!-- 加载中 / Loading -->
    <div v-if="loading" class="ds-card p-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      <p class="mt-4 text-sm text-tertiary">{{ t('history.loading') }}</p>
    </div>

    <template v-else>
    <!-- 当前用户排名卡片 / Current user's rank card -->
    <div v-if="currentUserRank" class="mb-8 ds-card p-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <!-- 头像首字母 / Avatar initial -->
          <div class="flex h-12 w-12 items-center justify-center bg-accent/20">
            <span class="font-display text-xl font-bold text-accent">{{ getInitial(currentUserRank.name) }}</span>
          </div>
          <div>
            <!-- 用户名或邮箱 / User name or email -->
            <p class="font-display font-semibold text-primary">{{ currentUserRank.name || currentUserRank.email }}</p>
            <!-- 你的排名 / Your rank -->
            <p class="text-sm text-muted">{{ t('ranking.yourRank') }} #{{ currentUserRank.position }}</p>
          </div>
        </div>
        <div class="text-right">
          <!-- 经验值 / Experience -->
          <p class="font-display text-2xl font-bold text-accent">{{ currentUserRank.experience }} XP</p>
          <p class="text-xs text-muted">{{ t('ranking.experience') }}</p>
        </div>
      </div>
    </div>

    <!-- 榜单容器 / Leaderboard container -->
    <div class="ds-card p-0 overflow-hidden">
      <!-- 榜单头部 / Leaderboard header -->
      <div class="flex items-center gap-3 border-b border-line-default px-5 py-3">
        <UIcon name="i-lucide-trophy" class="text-lg" />
        <div>
          <p class="font-display text-sm font-semibold text-primary">{{ t('ranking.topPlayers') }}</p>
          <p class="text-xs text-muted">{{ t('ranking.leaderboard') }}</p>
        </div>
      </div>

      <div>
        <!-- 遍历前 20 名 / Iterate top 20 -->
        <div
          v-for="(item, index) in ranking.slice(0, 20)"
          :key="item.id"
          :class="[
            'flex items-center justify-between px-5 py-4 transition-colors hover:bg-hover-subtle',
            index === 0 && 'border-b border-accent/30 bg-linear-to-r from-accent/10 to-transparent', // 第一名 / 1st
            index === 1 && 'border-b border-line-default bg-linear-to-r from-elevated/40 to-transparent', // 第二名 / 2nd
            index === 2 && 'border-b border-accent-soft/20 bg-linear-to-r from-accent-soft/5 to-transparent', // 第三名 / 3rd
          ]"
        >
          <div class="flex items-center gap-4">
            <!-- 名次徽章 / Rank badge -->
            <span
              :class="[
                'flex h-8 w-8 items-center justify-center text-sm font-bold',
                index === 0 ? 'bg-accent text-accent-fg' : '', // 金 / Gold
                index === 1 ? 'bg-line-strong text-secondary' : '', // 银 / Silver
                index === 2 ? 'bg-accent-soft/30 text-accent-soft' : '', // 铜 / Bronze
                index > 2 && 'text-muted', // 其余 / Others
              ]"
            >
              {{ index + 1 }}
            </span>
            <!-- 头像 / Avatar -->
            <div class="flex h-10 w-10 items-center justify-center" :class="getAvatarBg(index)">
              <span class="font-display font-semibold" :class="getAvatarText(index)">
                {{ getInitial(item.name) }}
              </span>
            </div>
            <div>
              <!-- 用户名或邮箱 / Name or email -->
              <p class="font-medium text-secondary">{{ item.name || item.email }}</p>
              <p class="text-xs text-muted">
                {{ item.totalAttempts }} {{ t('ranking.attempts') }} · {{ item.accuracy }}% {{ t('ranking.accuracy') }}
              </p>
            </div>
          </div>
          <!-- 经验分数 / Experience score -->
          <span class="font-display text-lg font-bold" :class="getScoreColor(index)">
            {{ item.experience }} XP
          </span>
        </div>
      </div>

      <!-- 空数据 / Empty state -->
      <div v-if="ranking.length === 0" class="px-5 py-12 text-center">
        <p class="text-muted">{{ t('ranking.noData') }}</p>
      </div>
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

// ===== SEO：登录后页面，noindex =====
useSeo({
  title: {
    'zh-hans': '训练排行榜',
    'zh-hant': '訓練排行榜',
    'en':      'Leaderboard',
    'ja':      'ランキング',
  },
  description: {
    'zh-hans': '查看句子健身房训练排行榜：做题总量、正确率、经验值，和全球学习者一起进步。',
    'zh-hant': '查看句子健身房訓練排行榜：做題總量、正確率、經驗值，和全球學習者一起進步。',
    'en':      'Sentence Gymnasium leaderboard — track total attempts, accuracy and experience with learners worldwide.',
    'ja':      'センテンスジムのランキング — 回答数・正解率・経験値を世界の学習者と競います。',
  },
  noindex: true,
})

// 获取 i18n / Obtain i18n
const { t } = useI18n()
// 获取用户 store / Obtain the user store
const store = useUserStore()
// 当前用户 / Current user
const user = computed(() => store.user as SessionUser | null)

// 榜单条目结构 / Ranking item shape
interface RankingItem {
  id: string // id
  name: string | null // 昵称 / Name
  email: string // 邮箱 / Email
  totalAttempts: number // 总次数 / Total attempts
  correctAttempts: number // 正确次数 / Correct attempts
  accuracy: number // 正确率 / Accuracy
  experience: number // 经验值 / Experience
}

// 榜单列表 / Ranking list
const ranking = ref<RankingItem[]>([])
const loading = ref(true)

// 加载榜单数据 / Load ranking data
async function loadData() {
  loading.value = true
  try {
    const data = await useCachedApi<{ ranking: RankingItem[] }>('ranking', () => useApi<{ ranking: RankingItem[] }>('/api/ranking'), 120_000)
    ranking.value = data.ranking
  } catch {
    ranking.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

// 当前用户排名（在榜单中的位置）/ Current user's rank position in the list
const currentUserRank = computed(() => {
  // 未登录则返回 / Return null if not logged in
  if (!user.value) return null
  // 查找当前用户下标 / Find the current user's index
  const index = ranking.value.findIndex((r) => r.id === user.value?.id)
  if (index === -1) return null
  // 返回条目及名次 / Return item plus position
  return {
    ...ranking.value[index],
    position: index + 1,
  }
})

// 取首字母（邮箱取 @ 前）/ Get the initial letter (use part before @ for email)
function getInitial(nameOrEmail: string | null): string {
  // 无值返回问号 / Return '?' if empty
  if (!nameOrEmail) return '?'
  const parts = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail
  return parts.charAt(0).toUpperCase()
}

// 头像背景类 / Avatar background class
function getAvatarBg(index: number): string {
  if (index === 0) return 'bg-accent/20' // 金 / Gold
  if (index === 1) return 'bg-elevated' // 银 / Silver
  if (index === 2) return 'bg-accent-soft/15' // 铜 / Bronze
  return 'bg-elevated' // 其余 / Others
}

// 头像文字颜色类 / Avatar text color class
function getAvatarText(index: number): string {
  if (index === 0) return 'text-accent-soft'
  if (index === 1) return 'text-secondary'
  if (index === 2) return 'text-accent-soft'
  return 'text-tertiary'
}

// 分数颜色类 / Score color class
function getScoreColor(index: number): string {
  if (index === 0) return 'text-accent-soft'
  if (index === 1) return 'text-secondary'
  if (index === 2) return 'text-accent-soft'
  return 'text-tertiary'
}
</script>