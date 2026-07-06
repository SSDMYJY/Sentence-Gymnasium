<template>
  <div class="mx-auto max-w-5xl px-6 pb-24 pt-28">
    <!-- 标题 -->
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

    <!-- 筛选栏 -->
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <button v-for="cat in categories" :key="cat.value" type="button" :class="[
        'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
        selectedCategory === cat.value
          ? 'border-accent bg-accent/10 text-accent-soft'
          : 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white',
      ]" @click="onCategoryChange(cat.value)">
        {{ cat.label }}
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      <p class="mt-4 text-sm text-stone-400">{{ t('history.loading') }}</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="entries.length === 0" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
      <div class="text-5xl">📭</div>
      <p class="mt-4 text-sm text-stone-500">{{ t('history.noData') }}</p>
      <NuxtLink :to="localePath('/practice')"
        class="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-stone-100">
        {{ t('history.startPractice') }}
      </NuxtLink>
    </div>

    <!-- 记录列表 -->
    <div v-else class="space-y-3">
      <div v-for="(entry, idx) in entries" :key="entry.id"
        class="rounded-xl border border-white/10 bg-ink-900/50 overflow-hidden">
        <!-- 记录头部（可点击展开） -->
        <button type="button"
          class="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5"
          @click="toggleExpand(entry.id)">
          <!-- 序号 -->
          <span class="w-8 shrink-0 text-center text-xs text-stone-600">
            {{ (page - 1) * pageSize + idx + 1 }}
          </span>

          <!-- 对错标识 -->
          <span :class="[
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            entry.isCorrect
              ? 'bg-green-500/15 text-green-400'
              : entry.verdict === 'partial'
                ? 'bg-yellow-500/15 text-yellow-400'
                : 'bg-red-500/15 text-red-400',
          ]">
            {{ entry.isCorrect ? '✓' : entry.verdict === 'partial' ? '◐' : '✗' }}
          </span>

          <!-- 题目摘要 -->
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-stone-200">{{ entry.questionText }}</p>
            <div class="mt-1 flex items-center gap-2">
              <span class="rounded bg-ink-800 px-2 py-0.5 text-xs text-stone-400">{{ categoryLabel(entry.category)
                }}</span>
              <span v-if="entry.topic" class="text-xs text-stone-500">{{ entry.topic }}</span>
              <span class="text-xs text-stone-600">·</span>
              <span class="text-xs text-stone-500">{{ formatDate(entry.createdAt) }}</span>
            </div>
          </div>

          <!-- 得分 -->
          <span v-if="entry.score !== null" class="shrink-0 text-sm font-semibold text-stone-300">
            {{ entry.score }}
            <span class="text-xs text-stone-600">/10</span>
          </span>

          <!-- 展开图标 -->
          <span class="shrink-0 text-stone-500 transition-transform duration-200"
            :class="{ 'rotate-180': expandedIds.has(entry.id) }">
            ▾
          </span>
        </button>

        <!-- 展开详情 -->
        <div v-if="expandedIds.has(entry.id)" class="border-t border-white/5 px-5 py-4">
          <div class="space-y-3">
            <!-- 你的答案 -->
            <div>
              <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('history.yourAnswer') }}</p>
              <p class="mt-1 text-sm text-stone-200">{{ entry.userAnswer }}</p>
            </div>

            <!-- AI 反馈 -->
            <div v-if="entry.feedback">
              <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('history.aiFeedback') }}</p>
              <p class="mt-1 text-sm leading-relaxed text-stone-300">{{ entry.feedback }}</p>
            </div>

            <!-- 判定结果 -->
            <div v-if="entry.verdict" class="flex items-center gap-2">
              <span class="text-xs uppercase tracking-wide text-stone-500">{{ t('history.verdict') }}</span>
              <span :class="verdictClass(entry.verdict)" class="text-sm font-medium">
                {{ verdictLabel(entry.verdict) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="mt-6 flex items-center justify-between">
        <span class="text-sm text-stone-500">
          {{ t('history.pageInfo', { page, total: totalPages, count: total }) }}
        </span>
        <div class="flex gap-2">
          <button type="button" :disabled="page <= 1"
            class="rounded-lg border border-white/10 px-4 py-2 text-sm text-stone-300 transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            @click="onPageChange(page - 1)">
            {{ t('history.prev') }}
          </button>
          <button type="button" :disabled="page >= totalPages"
            class="rounded-lg border border-white/10 px-4 py-2 text-sm text-stone-300 transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            @click="onPageChange(page + 1)">
            {{ t('history.next') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const localePath = useLocalePath()

// ---------- 类型 ----------

interface HistoryEntry {
  id: string
  questionText: string
  userAnswer: string
  isCorrect: boolean
  score: number | null
  verdict: string | null
  feedback: string | null
  category: string
  topic: string | null
  createdAt: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// ---------- 状态 ----------

const loading = ref(true)
const entries = ref<HistoryEntry[]>([])
const pagination = ref<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 })

const page = computed(() => pagination.value.page)
const pageSize = computed(() => pagination.value.pageSize)
const total = computed(() => pagination.value.total)
const totalPages = computed(() => pagination.value.totalPages)

const selectedCategory = ref<string>('all')
const expandedIds = ref<Set<string>>(new Set())

// ---------- 筛选选项 ----------

const categories = computed(() => [
  { value: 'all', label: t('history.catAll') },
  { value: 'practice', label: t('boards.practice.subtitle') },
  { value: 'paraphrase', label: t('boards.paraphrase.subtitle') },
  { value: 'grammar', label: t('boards.grammar.subtitle') },
])

function categoryLabel(cat: string): string {
  return categories.value.find((c) => c.value === cat)?.label ?? cat
}

function verdictLabel(v: string): string {
  if (v === 'correct') return t('history.verdictCorrect')
  if (v === 'partial') return t('history.verdictPartial')
  return t('history.verdictIncorrect')
}

function verdictClass(v: string): string {
  if (v === 'correct') return 'text-green-400'
  if (v === 'partial') return 'text-yellow-400'
  return 'text-red-400'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return t('history.justNow')
  if (mins < 60) return t('history.minutesAgo', { n: mins })
  if (hours < 24) return t('history.hoursAgo', { n: hours })
  if (days < 7) return t('history.daysAgo', { n: days })
  return d.toLocaleDateString(locale.value)
}

// ---------- 数据加载 ----------

async function loadData() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      pageSize: String(pageSize.value),
    })
    if (selectedCategory.value !== 'all') {
      params.set('category', selectedCategory.value)
    }
    const data = await $fetch<{ entries: HistoryEntry[]; pagination: Pagination }>(
      `/api/history?${params.toString()}`
    )
    entries.value = data.entries
    pagination.value = data.pagination
  } catch (err) {
    console.error('Failed to load history:', err)
  } finally {
    loading.value = false
  }
}

// ---------- 交互 ----------

function onCategoryChange(cat: string) {
  selectedCategory.value = cat
  pagination.value.page = 1
  expandedIds.value.clear()
  loadData()
}

function onPageChange(newPage: number) {
  pagination.value.page = newPage
  expandedIds.value.clear()
  loadData()
  // 滚动到顶部
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

// ---------- 初始化 ----------

onMounted(() => {
  loadData()
})
</script>
