<template>
  <div class="mx-auto max-w-5xl px-6 pb-24 pt-28 sm:pb-24">
    <!-- 标题 / Title -->
    <header class="mb-8">
      <div class="flex items-center gap-3">
        <div>
          <h1 class="font-display text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl">
            {{ t('nav.history') }}
          </h1>
          <p class="mt-1 text-sm text-stone-500">{{ t('history.subtitle') }}</p>
        </div>
      </div>
    </header>

    <!-- 分类筛选按钮 / Category filter buttons -->
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <!-- 遍历分类 / Iterate categories -->
      <UButton
        v-for="cat in categories"
        :key="cat.value"
        variant="outline"
        size="sm"
        :class="[
          selectedCategory === cat.value
            ? 'border-accent bg-accent/10 text-accent-soft' // 选中态 / Selected
            : 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white', // 未选中 / Unselected
        ]"
        @click="onCategoryChange(cat.value)"
      >
        {{ cat.label }}
      </UButton>
    </div>

    <!-- 加载中 / Loading -->
    <div v-if="loading" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      <p class="mt-4 text-sm text-stone-400">{{ t('history.loading') }}</p>
    </div>

    <!-- 空数据 / Empty data -->
    <div v-else-if="entries.length === 0" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
      <div class="text-5xl">📭</div>
      <p class="mt-4 text-sm text-stone-500">{{ t('history.noData') }}</p>
      <UButton
        :to="localePath('/practice')"
        class="mt-6 bg-white text-ink-950 hover:bg-stone-100"
      >
        {{ t('history.startPractice') }}
      </UButton>
    </div>

    <!-- 历史条目列表 / History entry list -->
    <div v-else class="space-y-3">
      <!-- 遍历条目 / Iterate entries -->
      <div v-for="(entry, idx) in entries" :key="entry.id"
        class="rounded-xl border border-white/10 bg-ink-900/50 overflow-hidden">
        <!-- 条目头部（可点击展开）/ Entry header (click to expand) -->
        <UButton
          variant="ghost"
          class="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5 justify-start! rounded-none! p-0!"
          @click="toggleExpand(entry.id)"
        >
          <!-- 序号 / Index -->
          <span class="w-8 shrink-0 text-center text-xs text-stone-600">
            {{ (page - 1) * pageSize + idx + 1 }}
          </span>

          <!-- 对错标记 / Correct/incorrect badge -->
          <span :class="[
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            entry.isCorrect
              ? 'bg-green-500/15 text-green-400' // 全对 / Correct
              : entry.verdict === 'partial'
                ? 'bg-yellow-500/15 text-yellow-400' // 部分 / Partial
                : 'bg-red-500/15 text-red-400', // 错误 / Incorrect
          ]">
            {{ entry.isCorrect ? '✓' : entry.verdict === 'partial' ? '◐' : '✗' }}
          </span>

          <!-- 题目与元信息 / Question and meta -->
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-stone-200">{{ entry.questionText }}</p>
            <div class="mt-1 flex items-center gap-2">
              <!-- 分类标签 / Category tag -->
              <span class="rounded bg-ink-800 px-2 py-0.5 text-xs text-stone-400">{{ categoryLabel(entry.category)
                }}</span>
              <!-- 主题标签 / Topic tag -->
              <span v-if="entry.topic" class="text-xs text-stone-500">{{ topicLabel(entry) }}</span>
              <span class="text-xs text-stone-600">·</span>
              <!-- 时间 / Time -->
              <span class="text-xs text-stone-500">{{ formatDate(entry.createdAt) }}</span>
            </div>
          </div>

          <!-- 得分 / Score -->
          <span v-if="entry.score !== null" class="shrink-0 text-sm font-semibold text-stone-300">
            {{ entry.score }}
            <span class="text-xs text-stone-600">/10</span>
          </span>

          <!-- 展开箭头 / Expand arrow -->
          <span class="shrink-0 text-stone-500 transition-transform duration-200"
            :class="{ 'rotate-180': expandedIds.has(entry.id) }">
            ▾
          </span>
        </UButton>

        <!-- 展开详情 / Expanded detail -->
        <Transition name="expand">
          <div v-if="expandedIds.has(entry.id)" class="border-t border-white/5">
            <div class="space-y-4 px-5 py-4">
              <!-- 你的答案 / Your answer -->
              <div>
                <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('history.yourAnswer') }}</p>
                <p class="mt-1 text-sm text-stone-200">{{ entry.userAnswer }}</p>
              </div>

              <!-- 参考答案 / Correct answer -->
              <div v-if="entry.correctAnswer">
                <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('history.correctAnswer') }}</p>
                <p class="mt-1 text-sm text-accent-soft">{{ entry.correctAnswer }}</p>
              </div>

              <!-- 解析 / Explanation -->
              <div v-if="entry.explanation" class="rounded-lg border border-accent/20 bg-accent/5 p-3">
                <p class="text-xs uppercase tracking-wide text-accent-soft">{{ t('history.explanation') }}</p>
                <p class="mt-1 text-sm leading-relaxed text-stone-300">{{ entry.explanation }}</p>
              </div>

              <!-- AI 反馈 / AI feedback -->
              <div v-if="entry.feedback">
                <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('history.aiFeedback') }}</p>
                <p class="mt-1 text-sm leading-relaxed text-stone-300">{{ entry.feedback }}</p>
              </div>

              <!-- 判定 / Verdict -->
              <div v-if="entry.verdict" class="flex items-center gap-2">
                <span class="text-xs uppercase tracking-wide text-stone-500">{{ t('history.verdict') }}</span>
                <span :class="verdictClass(entry.verdict)" class="text-sm font-medium">
                  {{ verdictLabel(entry.verdict) }}
                </span>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 分页 / Pagination -->
      <div v-if="totalPages > 1" class="mt-6 flex items-center justify-between">
        <span class="text-sm text-stone-500">
          {{ t('history.pageInfo', { page, total: totalPages, count: total }) }}
        </span>
        <div class="flex gap-2">
          <!-- 上一页 / Previous -->
          <UButton
            variant="outline"
            :disabled="page <= 1"
            class="border-white/10 text-stone-300 hover:border-white/30 hover:text-white disabled:opacity-40"
            @click="onPageChange(page - 1)"
          >
            {{ t('history.prev') }}
          </UButton>
          <!-- 下一页 / Next -->
          <UButton
            variant="outline"
            :disabled="page >= totalPages"
            class="border-white/10 text-stone-300 hover:border-white/30 hover:text-white disabled:opacity-40"
            @click="onPageChange(page + 1)"
          >
            {{ t('history.next') }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 启用 auth 路由守卫 / Enable the auth route guard
definePageMeta({ middleware: 'auth' })

// 获取 i18n 与当前语言 / Obtain i18n and current locale
const { t, locale } = useI18n()
// 获取本地化路径工具 / Obtain the localized-path helper
const localePath = useLocalePath()

// 历史条目结构 / History entry shape
interface HistoryEntry {
  id: string // id
  questionText: string // 题目文本 / Question text
  userAnswer: string // 用户答案 / User answer
  correctAnswer: string | null // 参考答案 / Correct answer
  isCorrect: boolean // 是否全对 / Fully correct
  score: number | null // 得分 / Score
  verdict: string | null // 等级 / Verdict
  feedback: string | null // 反馈 / Feedback
  explanation: string | null // 解析 / Explanation
  category: string // 分类 / Category
  topic: string | null // 主题 / Topic
  createdAt: string // 创建时间 / Created time
}

// 分页结构 / Pagination shape
interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// 加载中标志 / Loading flag
const loading = ref(true)
// 历史条目 / History entries
const entries = ref<HistoryEntry[]>([])
// 分页信息 / Pagination info
const pagination = ref<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 })

// 分页派生值 / Pagination derived values
const page = computed(() => pagination.value.page)
const pageSize = computed(() => pagination.value.pageSize)
const total = computed(() => pagination.value.total)
const totalPages = computed(() => pagination.value.totalPages)

// 选中的分类 / Selected category
const selectedCategory = ref<string>('all')
// 已展开条目 id 集合 / Set of expanded entry ids
const expandedIds = ref<Set<string>>(new Set())

// 分类选项 / Category options
const categories = computed(() => [
  { value: 'all', label: t('history.catAll') }, // 全部 / All
  { value: 'practice', label: t('boards.practice.subtitle') }, // 练习 / Practice
  { value: 'paraphrase', label: t('boards.paraphrase.subtitle') }, // 改写 / Paraphrase
  { value: 'grammar', label: t('boards.grammar.subtitle') }, // 语法 / Grammar
])

// 分类显示标签 / Category label
function categoryLabel(cat: string): string {
  return categories.value.find((c) => c.value === cat)?.label ?? cat
}

// 主题显示标签 / Topic label
function topicLabel(entry: HistoryEntry): string {
  // 无主题则返回空 / Return empty if no topic
  if (!entry.topic) return ''
  // 日常/购物等直接用原值 / Daily/shopping topics use raw value
  if (entry.topic.startsWith('dailyLife') || entry.topic.startsWith('shopping')) return entry.topic
  // 语法点转驼峰 key 后尝试翻译 / Convert grammar tag to camelCase key and translate
  const key = `grammar.tag${entry.topic.charAt(0).toUpperCase() + entry.topic.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`
  const { te } = useI18n()
  return te(key) ? t(key) : entry.topic
}

// 判定等级文案 / Verdict label
function verdictLabel(v: string): string {
  if (v === 'correct') return t('history.verdictCorrect') // 正确 / Correct
  if (v === 'partial') return t('history.verdictPartial') // 部分 / Partial
  return t('history.verdictIncorrect') // 错误 / Incorrect
}

// 判定等级颜色类 / Verdict color class
function verdictClass(v: string): string {
  if (v === 'correct') return 'text-green-400' // 绿 / Green
  if (v === 'partial') return 'text-yellow-400' // 黄 / Yellow
  return 'text-red-400' // 红 / Red
}

// 相对时间格式化 / Format relative time
function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000) // 分钟 / Minutes
  const hours = Math.floor(diff / 3600000) // 小时 / Hours
  const days = Math.floor(diff / 86400000) // 天 / Days

  // 按粒度返回相对时间 / Return relative time by granularity
  if (mins < 1) return t('history.justNow') // 刚刚 / Just now
  if (mins < 60) return t('history.minutesAgo', { n: mins }) // N 分钟前 / N minutes ago
  if (hours < 24) return t('history.hoursAgo', { n: hours }) // N 小时前 / N hours ago
  if (days < 7) return t('history.daysAgo', { n: days }) // N 天前 / N days ago
  return d.toLocaleDateString(locale.value) // 否则用本地日期 / Otherwise local date
}

// 加载数据 / Load data
async function loadData() {
  loading.value = true
  try {
    // 组装查询参数 / Build query params
    const params = new URLSearchParams({
      page: String(page.value),
      pageSize: String(pageSize.value),
    })
    // 非全部则追加分类 / Append category when not 'all'
    if (selectedCategory.value !== 'all') {
      params.set('category', selectedCategory.value)
    }
    // 请求历史接口 / Fetch history API
    const data = await $fetch<{ entries: HistoryEntry[]; pagination: Pagination }>(
      `/api/history?${params.toString()}`
    )
    entries.value = data.entries
    pagination.value = data.pagination
  } catch (err) {
    // 打印错误 / Log error
    console.error('Failed to load history:', err)
  } finally {
    // 结束加载 / Stop loading
    loading.value = false
  }
}

// 分类切换 / Category change
function onCategoryChange(cat: string) {
  selectedCategory.value = cat
  pagination.value.page = 1 // 回到第一页 / Reset to first page
  expandedIds.value.clear() // 清空展开 / Clear expansion
  loadData()
}

// 页码切换 / Page change
function onPageChange(newPage: number) {
  pagination.value.page = newPage
  expandedIds.value.clear()
  loadData()
  // 客户端平滑滚动到顶部 / Smooth-scroll to top on client
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 切换展开 / Toggle expansion
function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id) // 收起 / Collapse
  } else {
    expandedIds.value.add(id) // 展开 / Expand
  }
}

// 挂载后加载 / Load on mount
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* 展开过渡：进入 / Expand transition: enter */
.expand-enter-active {
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
}
/* 展开过渡：离开 / Expand transition: leave */
.expand-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
  overflow: hidden;
}
/* 收起态 / Collapsed state */
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
/* 展开态 / Expanded state */
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 600px;
}
</style>