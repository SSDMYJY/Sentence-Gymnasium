<template>
  <div class="mx-auto max-w-5xl px-6 pb-24 pt-28">
    <header class="mb-10">
      <h1 class="ds-heading-display text-3xl sm:text-4xl">
        <UIcon name="i-lucide-bookmark" /> {{ t('bookmarks.title') }}
      </h1>
      <p class="mt-2 text-tertiary">{{ t('bookmarks.subtitle') }}</p>
    </header>

    <!-- Filters -->
    <div class="mb-6 flex flex-wrap gap-3">
      <UInput
        v-model="search"
        :placeholder="t('bookmarks.searchPlaceholder')"
        class="w-64"
        @update:model-value="onSearch"
      />
      <USelect
        v-model="sourceLangFilter"
        :options="langOptions"
        class="w-36"
        @update:model-value="loadBookmarks"
      />
      <USelect
        v-model="categoryFilter"
        :options="categoryOptions"
        class="w-36"
        @update:model-value="loadBookmarks"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ds-card p-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      <p class="mt-4 text-sm text-tertiary">{{ t('bookmarks.loading') }}</p>
    </div>

    <!-- Empty -->
    <div v-else-if="bookmarks.length === 0" class="ds-card p-12 text-center">
      <p class="text-tertiary">{{ t('bookmarks.noData') }}</p>
      <UButton :to="localePath('/practice')" class="mt-4 bg-accent text-ink-950 hover:bg-accent-soft">
        {{ t('bookmarks.startPractice') }}
      </UButton>
    </div>

    <!-- List -->
    <div v-else class="space-y-3">
      <div
        v-for="bm in bookmarks"
        :key="bm.id"
        class="group flex items-start justify-between ds-card p-5 transition-colors hover:border-line-strong"
      >
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="font-display text-lg font-semibold text-primary">{{ bm.word }}</span>
            <span v-if="bm.sourceLang" class="rounded bg-accent/10 px-2 py-0.5 text-xs text-accent-soft">
              {{ bm.sourceLang }}
            </span>
            <span v-if="bm.category" class="rounded bg-elevated px-2 py-0.5 text-xs text-tertiary">
              {{ t(`bookmarks.category.${bm.category}`, bm.category) }}
            </span>
          </div>
          <p v-if="bm.sentence" class="mt-2 text-sm text-tertiary italic">"{{ bm.sentence }}"</p>
          <p class="mt-1 text-xs text-muted">{{ formatDate(bm.createdAt) }}</p>
        </div>
        <UButton
          variant="ghost"
          class="ml-4 text-danger hover:text-danger-soft opacity-0 group-hover:opacity-100 transition-opacity"
          @click="onDelete(bm.id)"
        >
          <UIcon name="i-lucide-x" />
        </UButton>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 pt-4">
        <UButton
          variant="outline"
          :disabled="page <= 1"
          class="border-line-strong text-tertiary hover:border-accent hover:text-primary"
          @click="page > 1 && goTo(page - 1)"
        >
          {{ t('bookmarks.prev') }}
        </UButton>
        <span class="text-sm text-muted">{{ t('bookmarks.pageInfo', { page, total: totalPages, count: total }) }}</span>
        <UButton
          variant="outline"
          :disabled="page >= totalPages"
          class="border-line-strong text-tertiary hover:border-accent hover:text-primary"
          @click="page < totalPages && goTo(page + 1)"
        >
          {{ t('bookmarks.next') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

// ===== SEO：登录后页面，noindex =====
useSeo({
  title: {
    'zh-hans': '我的收藏',
    'zh-hant': '我的收藏',
    'en':      'My Bookmarks',
    'ja':      'ブックマーク',
  },
  description: {
    'zh-hans': '收藏你在训练中遇到的重点词汇、句型和表达，支持按语言和分类筛选。',
    'zh-hant': '收藏你在訓練中遇到的重點詞彙、句型和表達，支持按語言和分類篩選。',
    'en':      'Save key vocabulary, phrases and expressions from your training. Filter by language and category.',
    'ja':      'トレーニング中の重要語彙・フレーズ・表現をブックマーク。言語とカテゴリで絞り込み。',
  },
  noindex: true,
})

const { t } = useI18n()
const localePath = useLocalePath()

interface Bookmark {
  id: string
  word: string
  sentence: string | null
  sourceLang: string | null
  category: string | null
  createdAt: string
}

const bookmarks = ref<Bookmark[]>([])
const loading = ref(true)
const search = ref('')
const sourceLangFilter = ref('')
const categoryFilter = ref('')
const page = ref(1)
const total = ref(0)
const totalPages = ref(0)
const pageSize = 20

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const langOptions = [
  { label: t('bookmarks.allLangs'), value: '' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' },
  { label: '中文', value: 'zh' },
]

const categoryOptions = [
  { label: t('bookmarks.allCategories'), value: '' },
  { label: t('bookmarks.category.vocabulary'), value: 'vocabulary' },
  { label: t('bookmarks.category.grammar'), value: 'grammar' },
  { label: t('bookmarks.category.expression'), value: 'expression' },
]

async function loadBookmarks() {
  loading.value = true
  try {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize) })
    if (search.value) params.set('search', search.value)
    if (sourceLangFilter.value) params.set('sourceLang', sourceLangFilter.value)
    if (categoryFilter.value) params.set('category', categoryFilter.value)
    const data = await $fetch<{ items: Bookmark[]; total: number; page: number; totalPages: number }>(`/api/bookmarks?${params}`, { headers })
    bookmarks.value = data.items
    total.value = data.total
    totalPages.value = data.totalPages
  } catch {
    bookmarks.value = []
  } finally {
    loading.value = false
  }
}

function onSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    loadBookmarks()
  }, 300)
}

function goTo(p: number) {
  page.value = p
  loadBookmarks()
}

async function onDelete(id: string) {
  try {
    await $fetch(`/api/bookmarks/${id}`, { method: 'DELETE' })
    bookmarks.value = bookmarks.value.filter(b => b.id !== id)
    total.value--
    if (bookmarks.value.length === 0 && page.value > 1) {
      page.value--
      await loadBookmarks()
    }
  } catch {
    // ignore
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Initial load
await loadBookmarks()
</script>
