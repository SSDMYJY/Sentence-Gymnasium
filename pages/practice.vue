<template>
  <div class="mx-auto max-w-3xl px-6 pb-24 pt-28">
    <!-- 标题 -->
    <header class="mb-8">
      <div class="flex items-center gap-3">
        <!-- <span class="text-3xl">⚡</span> -->
        <div>
          <h1 class="font-display text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl">
            {{ t('boards.practice.subtitle') }}
          </h1>
          <p class="mt-1 text-sm text-stone-500">{{ t('boards.practice.desc') }}</p>
        </div>
      </div>
    </header>

    <!-- 设置面板（选择语言对 + 难度） -->
    <div v-if="phase === 'idle'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
      <h2 class="text-sm font-semibold text-stone-300">{{ t('practice.settings') }}</h2>

      <!-- 语言对选择 -->
      <div class="mt-5">
        <label class="text-xs uppercase tracking-wide text-stone-500">{{ t('practice.languagePair') }}</label>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <button v-for="pair in languagePairs" :key="pair.value" type="button" :class="[
            'rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
            selectedPair === pair.value
              ? 'border-accent bg-accent/10 text-accent-soft'
              : 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white',
          ]" @click="selectedPair = pair.value">
            {{ pair.label }}
          </button>
        </div>
      </div>

      <DifficultyLevelSwitcher
        v-model="selectedDifficulty"
        :lang="targetLang(selectedPair)"
        @update:model-value="savePreferences"
      />

      <!-- 场景选择 -->
      <div class="mt-6">
        <div class="flex items-center justify-between">
          <label class="text-xs uppercase tracking-wide text-stone-500">{{ t('practice.scenarioTitle') }}</label>
          <span class="text-xs text-stone-600">{{ scenarioDisplayLabel(selectedScenario) }}</span>
        </div>
        <div class="mt-3">
          <ScenarioDropdown v-model="selectedScenario" @update:model-value="savePreferences" />
        </div>
      </div>

      <!-- 能量提示 -->
      <div class="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
        <span class="text-sm text-stone-500">
          ⚡ {{ store.credits }} {{ t('practice.credits') }}
          <span class="text-stone-600"> · {{ t('practice.cost', { cost: 1 }) }}</span>
        </span>
        <button type="button" :disabled="generating || store.credits < 1"
          class="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
          @click="onGenerate">
          {{ generating ? t('practice.generating') : t('practice.start') }}
        </button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="phase === 'generating'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      <p class="mt-4 text-sm text-stone-400">{{ t('practice.generating') }}</p>
    </div>

    <!-- 答题阶段 -->
    <div v-if="phase === 'answering' && currentQuestion" class="space-y-6">
      <!-- 题目卡片 -->
      <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="rounded-full bg-ink-800 px-3 py-1 text-xs text-stone-400">
            {{ pairLabel(currentQuestion.languagePair) }}
          </span>
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-ink-800 px-3 py-1 text-xs text-stone-500">
              {{ difficultyLabel(currentQuestion.difficulty) }}
            </span>
            <span class="rounded-full bg-ink-800 px-3 py-1 text-xs text-stone-500">
              {{ scenarioDisplayLabel(currentQuestion.scenario) }}
            </span>
          </div>
        </div>
        <p class="mt-6 font-display text-xl font-medium leading-relaxed text-stone-100">
          {{ currentQuestion.questionText }}
        </p>
      </div>

      <!-- 作答区 -->
      <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
        <label class="text-xs uppercase tracking-wide text-stone-500">{{ t('practice.yourAnswer') }}</label>
        <textarea v-model="userAnswer" rows="4" :placeholder="t('practice.answerPlaceholder')" :disabled="judging"
          class="mt-3 w-full resize-none rounded-lg border border-white/10 bg-ink-950 px-4 py-3 text-stone-100 placeholder-stone-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 select-none"
          @keydown.meta.enter="onJudge" @keydown.ctrl.enter="onJudge" @paste.prevent @copy.prevent @cut.prevent
          @contextmenu.prevent />
        <div class="mt-3 flex items-center justify-between">
          <span class="text-xs text-stone-600">⌘/Ctrl + Enter {{ t('practice.submit') }}</span>
          <button type="button" :disabled="judging || !userAnswer.trim()"
            class="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            @click="onJudge">
            {{ judging ? t('practice.judging') : t('practice.submit') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 判题加载 -->
    <div v-if="phase === 'judging'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      <p class="mt-4 text-sm text-stone-400">{{ t('practice.judging') }}</p>
    </div>

    <!-- 判题结果 -->
    <div v-if="phase === 'result' && judgeResult" class="space-y-6">
      <!-- 结果概览 -->
      <div :class="[
        'rounded-2xl border p-6',
        judgeResult.isCorrect
          ? 'border-green-500/30 bg-green-500/5'
          : judgeResult.verdict === 'partial'
            ? 'border-yellow-500/30 bg-yellow-500/5'
            : 'border-red-500/30 bg-red-500/5',
      ]">
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
            <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('practice.question') }}</p>
            <p class="mt-1 text-stone-200">{{ currentQuestion?.questionText }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('practice.yourAnswer') }}</p>
            <p class="mt-1 text-stone-200">{{ userAnswer }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('practice.referenceAnswer') }}</p>
            <p class="mt-1 text-accent-soft">{{ judgeResult.correctAnswer }}</p>
          </div>
        </div>
      </div>

      <!-- AI 反馈 -->
      <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
        <h3 class="text-sm font-semibold text-stone-300">{{ t('practice.feedback') }}</h3>
        <p class="mt-3 text-sm leading-relaxed text-stone-300">{{ judgeResult.feedback }}</p>

        <div v-if="judgeResult.errors?.length" class="mt-4">
          <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('practice.errors') }}</p>
          <ul class="mt-2 space-y-1">
            <li v-for="(err, i) in judgeResult.errors" :key="i" class="flex items-start gap-2 text-sm text-stone-400">
              <span class="mt-0.5 text-red-400">·</span>
              <span>{{ err }}</span>
            </li>
          </ul>
        </div>

        <div v-if="judgeResult.suggestion" class="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
          <p class="text-xs uppercase tracking-wide text-accent-soft">{{ t('practice.suggestion') }}</p>
          <p class="mt-1 text-sm text-stone-200">{{ judgeResult.suggestion }}</p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3">
        <button type="button"
          class="flex-1 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-stone-100"
          @click="onNext">
          {{ t('practice.nextQuestion') }}
        </button>
        <button type="button"
          class="flex-1 rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-stone-300 transition-colors hover:border-white/30 hover:text-white"
          @click="onBackToSettings">
          {{ t('practice.backToSettings') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SessionUser } from '~/stores/user'
import type { LanguagePair, PracticeDifficulty, ScenarioValue } from '~/server/types/ai'
import {
  PRACTICE_DIFFICULTIES,
  RANDOM_SCENARIO,
  SCENARIO_CATEGORIES,
  resolveNumericDifficulty,
} from '~/utils/practice-config'

definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const store = useUserStore()
const user = computed(() => store.user as SessionUser)

// ---------- 状态 ----------

type Phase = 'idle' | 'generating' | 'answering' | 'judging' | 'result'
const phase = ref<Phase>('idle')

const selectedPair = ref<LanguagePair>('ja-en')
const selectedDifficulty = ref<PracticeDifficulty>('random')
const selectedScenario = ref<ScenarioValue>({ ...RANDOM_SCENARIO })

const generating = ref(false)
const judging = ref(false)

interface QuestionData {
  questionId: string
  questionText: string
  languagePair: LanguagePair
  difficulty: 1 | 2 | 3
  practiceDifficulty: PracticeDifficulty
  scenario: ScenarioValue
  credits: number
}
const currentQuestion = ref<QuestionData | null>(null)
const userAnswer = ref('')

// 用户偏好持久化 key
const STORAGE_KEY = 'sg-practice-preferences'

interface JudgeResultData {
  isCorrect: boolean
  score: number
  verdict: 'correct' | 'partial' | 'incorrect'
  feedback: string
  suggestion: string | null
  errors: string[]
  correctAnswer: string
  totalAttempts: number
  correctAttempts: number
}
const judgeResult = ref<JudgeResultData | null>(null)

// ---------- 选项 ----------

const languagePairs: { value: LanguagePair; label: string }[] = [
  { value: 'ja-en', label: '日(日本語 Japanese) → 英(英語 English)' },
  { value: 'en-ja', label: '英(英語 English) → 日(日本語 Japanese)' },
  { value: 'zh-ja', label: '中(中国語 Chinese) → 日(日本語 Japanese)' },
  { value: 'zh-en', label: '中(中国語 Chinese) → 英(英語 English)' },
]

function pairLabel(pair: LanguagePair): string {
  return languagePairs.find((p) => p.value === pair)?.label ?? pair
}

/** 目标语言代码 */
function targetLang(pair: LanguagePair): 'en' | 'ja' {
  return pair.endsWith('en') ? 'en' : 'ja'
}

function difficultyLabel(d: number): string {
  if (d === 1) return t('practice.diffEasy')
  if (d === 2) return t('practice.diffMedium')
  return t('practice.diffHard')
}

function verdictLabel(v: string): string {
  if (v === 'correct') return t('practice.verdictCorrect')
  if (v === 'partial') return t('practice.verdictPartial')
  return t('practice.verdictIncorrect')
}

// ---------- 场景选择 ----------

function scenarioDisplayLabel(s: ScenarioValue): string {
  if (s.categoryId === 'random') return t('practice.scenarioRandom')
  const cat = SCENARIO_CATEGORIES.find((c) => c.id === s.categoryId)
  if (!cat) return t('practice.scenarioRandom')
  const catLabel = t(cat.labelKey)
  if (!s.subId) return catLabel
  const sub = cat.subScenarios.find((x) => x.id === s.subId)
  return sub ? `${catLabel} · ${t(sub.labelKey)}` : catLabel
}

// ---------- 本地偏好持久化 ----------

interface StoredPreferences {
  pair?: LanguagePair
  difficulty?: PracticeDifficulty
  scenario?: ScenarioValue
}

function loadPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed: StoredPreferences = JSON.parse(raw)
    if (parsed.pair && languagePairs.some((p) => p.value === parsed.pair)) {
      selectedPair.value = parsed.pair
    }
    if (parsed.difficulty && PRACTICE_DIFFICULTIES.includes(parsed.difficulty)) {
      selectedDifficulty.value = parsed.difficulty
    }
    if (parsed.scenario) {
      selectedScenario.value = parsed.scenario
    }
  } catch {
    // 忽略解析失败
  }
}

function savePreferences() {
  try {
    const payload: StoredPreferences = {
      pair: selectedPair.value,
      difficulty: selectedDifficulty.value,
      scenario: selectedScenario.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 忽略写入失败
  }
}

onMounted(() => {
  loadPreferences()
})

// ---------- 出题 ----------

async function onGenerate() {
  if (generating.value) return
  generating.value = true
  phase.value = 'generating'
  userAnswer.value = ''
  judgeResult.value = null
  savePreferences()

  try {
    const data = await $fetch<QuestionData>('/api/practice/generate', {
      method: 'POST',
      body: {
        languagePair: selectedPair.value,
        difficulty: selectedDifficulty.value,
        scenario: selectedScenario.value,
      },
    })
    currentQuestion.value = data
    // 同步 credits
    store.setUser({ ...user.value, credits: data.credits })
    phase.value = 'answering'
  } catch (err: any) {
    phase.value = 'idle'
    if (err?.statusCode === 402) {
      alert(t('practice.noCredits'))
    } else if (err?.statusMessage) {
      alert(err.statusMessage)
    } else {
      alert(t('practice.generateError'))
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
    const data = await $fetch<JudgeResultData>('/api/practice/judge', {
      method: 'POST',
      body: {
        questionId: currentQuestion.value.questionId,
        userAnswer: userAnswer.value,
        uiLang: locale.value,
      },
    })
    judgeResult.value = data
    // 同步用户统计
    store.setUser({
      ...user.value,
      totalAttempts: data.totalAttempts,
      correctAttempts: data.correctAttempts,
    })
    phase.value = 'result'
  } catch (err: any) {
    phase.value = 'answering'
    alert(err?.statusMessage || t('practice.judgeError'))
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
