<template>
	<div class="mx-auto max-w-3xl px-6 pb-24 pt-28">
		<!-- 标题 -->
		<header class="mb-8">
			<div class="flex items-center gap-3">
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
					<UButton v-for="pair in languagePairs" :key="pair.value" variant="ghost"
						:color="selectedPair === pair.value ? 'primary' : 'neutral'" :class="[
							'justify-start px-4 py-3 border text-sm font-medium',
							selectedPair === pair.value
								? 'border-accent bg-accent/10 text-accent-soft'
								: 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white',
						]" @click="selectedPair = pair.value">
						{{ pair.label }}
					</UButton>
				</div>
			</div>

			<DifficultyLevelSwitcher v-model="selectedDifficulty" :lang="targetLang(selectedPair)"
				@update:model-value="savePreferences" />

			<!-- 场景选择 -->
			<div class="mt-6">
				<div class="flex items-center justify-between">
					<label class="text-xs uppercase tracking-wide text-stone-500">{{ t('practice.scenarioTitle')
					}}</label>
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
				<UButton :loading="generating || store.credits < 1" :disabled="generating || store.credits < 1"
					class="bg-white text-ink-950 hover:bg-stone-100" @click="onGenerate">
					{{ generating ? t('practice.generating') : t('practice.start') }}
				</UButton>
			</div>
		</div>

		<!-- 加载中 -->
		<div v-if="phase === 'generating'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
			<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
			<p class="mt-4 text-sm text-stone-400">{{ t('practice.generating') }}</p>
		</div>

		<!-- 答题 / 判题 / 结果 -->
		<AnswerCard v-if="phase !== 'idle' && phase !== 'generating'" v-model="userAnswer"
			:question-text="currentQuestion?.questionText ?? ''" :judging="judging" :judge-result="judgeResult"
			:rows="4" :placeholder="t('practice.answerPlaceholder')"
			:result-labels="{ question: 'practice.question', yourAnswer: 'practice.yourAnswer', reference: 'practice.referenceAnswer' }"
			submit-label="practice.submit" judging-label="practice.judging" submit-hint="practice.submit"
			your-answer-label="practice.yourAnswer" feedback-label="practice.feedback" errors-label="practice.errors"
			suggestion-label="practice.suggestion" next-button-label="practice.nextQuestion"
			back-button-label="practice.backToSettings" @submit="onJudge" @next="onNext" @back="onBackToSettings">
			<template #question-meta>
				<div class="flex flex-wrap items-center justify-between gap-2">
					<span class="rounded-full bg-ink-800 px-3 py-1 text-xs text-stone-400">
						{{ pairLabel(currentQuestion!.languagePair) }}
					</span>
					<div class="flex items-center gap-2">
						<span class="rounded-full bg-ink-800 px-3 py-1 text-xs text-stone-500">
							{{ difficultyLabel(currentQuestion!.difficulty) }}
						</span>
						<span class="rounded-full bg-ink-800 px-3 py-1 text-xs text-stone-500">
							{{ scenarioDisplayLabel(currentQuestion!.scenario) }}
						</span>
					</div>
				</div>
			</template>
		</AnswerCard>
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
const toast = useToast()
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
	streak: number
	streakIncreased: boolean
	level: number
	credits: number
	levelUp: boolean
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
			toast.error(t('practice.noCredits'))
		} else if (err?.statusMessage) {
			toast.error(err.statusMessage)
		} else {
			toast.error(t('practice.generateError'))
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
		store.setUser({
			...user.value,
			totalAttempts: data.totalAttempts,
			correctAttempts: data.correctAttempts,
			streak: data.streak,
			level: data.level,
			credits: data.credits,
		})
		if (data.streakIncreased && data.streak > 1) {
			toast.success(`🔥 ${t('dashboard.stats.streak')} ${data.streak} ${t('streak.days')}`)
		}
		if (data.levelUp) {
			toast.success(`🎉 ${t('dashboard.level.upTitle')}`)
		}
		phase.value = 'result'
	} catch (err: any) {
		phase.value = 'answering'
		toast.error(err?.statusMessage || t('practice.judgeError'))
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
