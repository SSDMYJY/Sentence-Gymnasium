<template>
  <div class="mx-auto max-w-3xl px-6 pb-24 pt-28">
    <!-- 标题 -->
    <header class="mb-8">
      <div class="flex items-center gap-3">
        <!-- <span class="text-3xl">◎</span> -->
        <div>
          <h1 class="font-display text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl">
            {{ t('boards.grammar.subtitle') }}
          </h1>
          <p class="mt-1 text-sm text-stone-500">{{ t('boards.grammar.desc') }}</p>
        </div>
      </div>
    </header>

    <!-- 设置面板（语言 + 语法点 + 题型同时展示） -->
    <div v-if="phase === 'idle'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
      <h2 class="text-sm font-semibold text-stone-300">{{ t('grammar.settings') }}</h2>

      <!-- 语言选择 -->
      <div class="mt-5">
        <label class="text-xs uppercase tracking-wide text-stone-500">{{ t('grammar.language') }}</label>
        <div class="mt-3 flex gap-3">
          <button
            v-for="lang in languages"
            :key="lang.value"
            type="button"
            :class="[
              'flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
              selectedLang === lang.value
                ? 'border-accent bg-accent/10 text-accent-soft'
                : 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white',
            ]"
            @click="selectedLang = lang.value; selectedTag = filteredGrammarTags[0]?.value ?? 'te-form'"
          >
            {{ lang.label }}
          </button>
        </div>
      </div>

      <!-- 语法点选择（随语言切换） -->
      <div class="mt-5">
        <label class="text-xs uppercase tracking-wide text-stone-500">{{ t('grammar.grammarPoint') }}</label>
        <div
          class="mt-3 grid gap-3"
          :class="filteredGrammarTags.length % 3 === 0 ? 'grid-cols-3' : 'grid-cols-2'"
        >
          <button
            v-for="tag in filteredGrammarTags"
            :key="tag.value"
            type="button"
            :class="[
              'rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
              selectedTag === tag.value
                ? 'border-accent bg-accent/10 text-accent-soft'
                : 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white',
            ]"
            @click="selectedTag = tag.value"
          >
            {{ tag.label }}
          </button>
        </div>
      </div>

      <!-- 题型选择（仅填空题 + 改错题） -->
      <div class="mt-6">
        <label class="text-xs uppercase tracking-wide text-stone-500">{{ t('grammar.questionType') }}</label>
        <div class="mt-3 flex gap-3">
          <button
            v-for="qt in questionTypes"
            :key="qt.value"
            type="button"
            :class="[
              'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
              selectedType === qt.value
                ? 'border-accent bg-accent/10 text-accent-soft'
                : 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white',
            ]"
            @click="selectedType = qt.value"
          >
            {{ qt.label }}
          </button>
        </div>
      </div>

      <!-- 开始按钮（免费） -->
      <div class="mt-6 flex items-center justify-end border-t border-white/5 pt-4">
        <button
          type="button"
          :disabled="generating"
          class="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
          @click="onGenerate"
        >
          {{ generating ? t('grammar.generating') : t('grammar.start') }}
        </button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="phase === 'generating'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      <p class="mt-4 text-sm text-stone-400">{{ t('grammar.generating') }}</p>
    </div>

    <!-- 答题阶段 -->
    <div v-if="phase === 'answering' && currentQuestion" class="space-y-6">
      <!-- 题目卡片 -->
      <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
        <div class="flex items-center justify-between">
          <span class="rounded-full bg-ink-800 px-3 py-1 text-xs text-stone-400">
            {{ tagLabel(currentQuestion.grammarTag) }}
          </span>
          <span class="text-xs text-stone-500">{{ typeLabel(currentQuestion.questionType) }}</span>
        </div>
        <p class="mt-6 font-display text-xl font-medium leading-relaxed text-stone-100">
          {{ currentQuestion.questionText }}
        </p>
      </div>

      <!-- 作答区 -->
      <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
        <label class="text-xs uppercase tracking-wide text-stone-500">{{ t('grammar.yourAnswer') }}</label>

        <!-- 填空 / 改错 -->
        <textarea
          v-model="userAnswer"
          rows="3"
          :placeholder="t('grammar.answerPlaceholder')"
          :disabled="judging"
          class="mt-3 w-full resize-none rounded-lg border border-white/10 bg-ink-950 px-4 py-3 text-stone-100 placeholder-stone-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 select-none"
          @keydown.meta.enter="onJudge"
          @keydown.ctrl.enter="onJudge"
          @paste.prevent
          @copy.prevent
          @cut.prevent
          @contextmenu.prevent
        />

        <div class="mt-3 flex items-center justify-between">
          <span class="text-xs text-stone-600">⌘/Ctrl + Enter {{ t('grammar.submit') }}</span>
          <button
            type="button"
            :disabled="judging || !userAnswer.trim()"
            class="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            @click="onJudge"
          >
            {{ judging ? t('grammar.judging') : t('grammar.submit') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 判题加载 -->
    <div v-if="phase === 'judging'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      <p class="mt-4 text-sm text-stone-400">{{ t('grammar.judging') }}</p>
    </div>

    <!-- 判题结果 -->
    <div v-if="phase === 'result' && judgeResult" class="space-y-6">
      <!-- 结果概览 -->
      <div
        :class="[
          'rounded-2xl border p-6',
          judgeResult.isCorrect
            ? 'border-green-500/30 bg-green-500/5'
            : judgeResult.verdict === 'partial'
              ? 'border-yellow-500/30 bg-yellow-500/5'
              : 'border-red-500/30 bg-red-500/5',
        ]"
      >
        <div class="flex items-center gap-4">
          <span class="text-4xl">
            {{ judgeResult.isCorrect ? '✓' : judgeResult.verdict === 'partial' ? '◐' : '✗' }}
          </span>
          <div>
            <p class="font-display text-xl font-bold text-stone-100">
              {{ verdictLabel(judgeResult.verdict) }}
            </p>
            <p class="text-sm text-stone-400">{{ judgeResult.score }} / 10</p>
          </div>
        </div>
      </div>

      <!-- 题目 + 答案回顾 -->
      <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
        <div class="space-y-4">
          <div>
            <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('grammar.question') }}</p>
            <p class="mt-1 text-stone-200">{{ currentQuestion?.questionText }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('grammar.yourAnswer') }}</p>
            <p class="mt-1 text-stone-200">{{ userAnswer }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('grammar.correctAnswer') }}</p>
            <p class="mt-1 text-accent-soft">{{ judgeResult.correctAnswer }}</p>
          </div>
        </div>
      </div>

      <!-- 语法点说明 -->
      <div v-if="currentQuestion?.explanation || judgeResult.explanation" class="rounded-2xl border border-accent/20 bg-accent/5 p-6">
        <h3 class="text-sm font-semibold text-accent-soft">{{ t('grammar.explanation') }}</h3>
        <p class="mt-2 text-sm leading-relaxed text-stone-300">
          {{ judgeResult.explanation || currentQuestion?.explanation }}
        </p>
      </div>

      <!-- AI 反馈 -->
      <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
        <h3 class="text-sm font-semibold text-stone-300">{{ t('grammar.feedback') }}</h3>
        <p class="mt-3 text-sm leading-relaxed text-stone-300">{{ judgeResult.feedback }}</p>

        <div v-if="judgeResult.errors?.length" class="mt-4">
          <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('grammar.errors') }}</p>
          <ul class="mt-2 space-y-1">
            <li v-for="(err, i) in judgeResult.errors" :key="i" class="flex items-start gap-2 text-sm text-stone-400">
              <span class="mt-0.5 text-red-400">·</span>
              <span>{{ err }}</span>
            </li>
          </ul>
        </div>

        <div v-if="judgeResult.suggestion" class="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
          <p class="text-xs uppercase tracking-wide text-accent-soft">{{ t('grammar.suggestion') }}</p>
          <p class="mt-1 text-sm text-stone-200">{{ judgeResult.suggestion }}</p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3">
        <button
          type="button"
          class="flex-1 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-stone-100"
          @click="onNext"
        >
          {{ t('grammar.nextQuestion') }}
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-stone-300 transition-colors hover:border-white/30 hover:text-white"
          @click="onBackToSettings"
        >
          {{ t('grammar.backToSettings') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SessionUser } from '~/stores/user'
import type { GrammarTag } from '~/server/types/ai'

definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const store = useUserStore()
const user = computed(() => store.user as SessionUser)

// ---------- 状态 ----------

type Phase = 'idle' | 'generating' | 'answering' | 'judging' | 'result'
const phase = ref<Phase>('idle')

const selectedLang = ref<'ja' | 'en'>('ja')
const selectedTag = ref<GrammarTag>('te-form')
const selectedType = ref<'fill-blank' | 'error-correction'>('fill-blank')

const generating = ref(false)
const judging = ref(false)

interface QuestionData {
  questionId: string
  questionText: string
  grammarTag: GrammarTag
  questionType: 'fill-blank' | 'error-correction'
  options: string[] | null
  explanation: string | null
  difficulty: number
}
const currentQuestion = ref<QuestionData | null>(null)
const userAnswer = ref('')

interface JudgeResultData {
  isCorrect: boolean
  score: number
  verdict: 'correct' | 'partial' | 'incorrect'
  feedback: string
  suggestion: string | null
  errors: string[]
  correctAnswer: string
  explanation: string | null
}
const judgeResult = ref<JudgeResultData | null>(null)

// ---------- 选项 ----------

const languages: { value: 'ja' | 'en'; label: string }[] = [
  { value: 'ja', label: t('grammar.langJa') },
  { value: 'en', label: t('grammar.langEn') },
]

const grammarTagsByLang: Record<'ja' | 'en', { value: GrammarTag; label: string }[]> = {
  ja: [
    { value: 'te-form', label: 'て形 (te-form)' },
    { value: 'passive', label: t('grammar.tagPassive') },
    { value: 'conditionals', label: t('grammar.tagConditionals') },
    { value: 'relative-clauses', label: t('grammar.tagRelativeClauses') },
    { value: 'particles', label: t('grammar.tagParticles') },
    { value: 'honorifics', label: t('grammar.tagHonorifics') },
  ],
  en: [
    { value: 'present-perfect', label: t('grammar.tagPresentPerfect') },
    { value: 'passive', label: t('grammar.tagPassive') },
    { value: 'conditionals', label: t('grammar.tagConditionals') },
    { value: 'relative-clauses', label: t('grammar.tagRelativeClauses') },
  ],
}

const filteredGrammarTags = computed(() => grammarTagsByLang[selectedLang.value])

const questionTypes: { value: 'fill-blank' | 'error-correction'; label: string }[] = [
  { value: 'fill-blank', label: t('grammar.typeFillBlank') },
  { value: 'error-correction', label: t('grammar.typeErrorCorrection') },
]

function tagLabel(tag: GrammarTag): string {
  return grammarTags.find((x) => x.value === tag)?.label ?? tag
}

function typeLabel(type: string): string {
  return questionTypes.find((x) => x.value === type)?.label ?? type
}

function verdictLabel(v: string): string {
  if (v === 'correct') return t('grammar.verdictCorrect')
  if (v === 'partial') return t('grammar.verdictPartial')
  return t('grammar.verdictIncorrect')
}

// ---------- 出题 ----------

async function onGenerate() {
  if (generating.value) return
  generating.value = true
  phase.value = 'generating'
  userAnswer.value = ''
  judgeResult.value = null

  try {
    const data = await $fetch<QuestionData>('/api/grammar/generate', {
      method: 'POST',
      body: {
        language: selectedLang.value,
        grammarTag: selectedTag.value,
        questionType: selectedType.value,
      },
    })
    currentQuestion.value = data
    phase.value = 'answering'
  } catch (err: any) {
    phase.value = 'idle'
    if (err?.statusMessage) {
      alert(err.statusMessage)
    } else {
      alert(t('grammar.generateError'))
    }
  } finally {
    generating.value = false
  }
}

// ---------- 判题 ----------

async function onJudge() {
  if (judging.value || !userAnswer.value.trim() || !currentQuestion.value) return
  judging.value = true
  phase.value = 'judging'

  try {
    const data = await $fetch<JudgeResultData>('/api/grammar/judge', {
      method: 'POST',
      body: {
        questionId: currentQuestion.value.questionId,
        userAnswer: userAnswer.value,
        uiLang: locale.value,
      },
    })
    judgeResult.value = data
    store.setUser({
      ...user.value,
      totalAttempts: data.totalAttempts,
      correctAttempts: data.correctAttempts,
    })
    phase.value = 'result'
  } catch (err: any) {
    phase.value = 'answering'
    alert(err?.statusMessage || t('grammar.judgeError'))
  } finally {
    judging.value = false
  }
}

// ---------- 下一步 ----------

function onNext() {
  phase.value = 'idle'
  currentQuestion.value = null
  userAnswer.value = ''
  judgeResult.value = null
  onGenerate()
}

function onBackToSettings() {
  phase.value = 'idle'
  currentQuestion.value = null
  userAnswer.value = ''
  judgeResult.value = null
}
</script>
