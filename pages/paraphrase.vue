<template>
	<div class="mx-auto max-w-3xl px-6 pb-24 pt-28">
		<!-- 标题 -->
		<header class="mb-8">
			<div class="flex items-center gap-3">
				<!-- <span class="text-3xl">🔄</span> -->
				<div>
					<h1 class="font-display text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl">
						{{ t('boards.paraphrase.subtitle') }}
					</h1>
					<p class="mt-1 text-sm text-stone-500">{{ t('boards.paraphrase.desc') }}</p>
				</div>
			</div>
		</header>

		<!-- 设置面板（选择语言 + 难度） -->
		<div v-if="phase === 'idle'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
			<h2 class="text-sm font-semibold text-stone-300">{{ t('paraphrase.settings') }}</h2>

			<!-- 源语言选择 -->
			<div class="mt-5">
				<label class="text-xs uppercase tracking-wide text-stone-500">{{ t('paraphrase.sourceLang') }}</label>
				<div class="mt-3 grid grid-cols-2 gap-3">
					<UButton v-for="lang in sourceLangs" :key="lang.value" variant="ghost" :class="[
						'w-full rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
						selectedLang === lang.value
							? 'border-accent bg-accent/10 text-accent-soft'
							: 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white',
					]" @click="selectedLang = lang.value">
						{{ lang.label }}
					</UButton>
				</div>
			</div>

			<DifficultyLevelSwitcher v-model="selectedDifficulty" :lang="selectedLang === 'ja' ? 'ja' : 'en'"
				label-key="paraphrase.difficulty" />

			<!-- 能量提示 -->
			<div class="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
				<span class="text-sm text-stone-500">
					⚡ {{ store.credits }} {{ t('paraphrase.credits') }}
					<span class="text-stone-600"> · {{ t('paraphrase.cost', { cost: 1 }) }}</span>
				</span>
				<UButton :loading="generating" :disabled="store.credits < 1"
					class="bg-white text-ink-950 hover:bg-stone-100" @click="onGenerate">
					{{ t('paraphrase.start') }}
				</UButton>
			</div>
		</div>

		<!-- 加载中 -->
		<div v-if="phase === 'generating'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
			<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
			<p class="mt-4 text-sm text-stone-400">{{ t('paraphrase.generating') }}</p>
		</div>

		<!-- 答题 / 判题 / 结果 -->
		<AnswerCard v-if="phase !== 'idle' && phase !== 'generating'" v-model="userAnswer"
			:question-text="currentQuestion?.questionText ?? ''" :judging="judging" :judge-result="judgeResult"
			:rows="4" :placeholder="t('paraphrase.answerPlaceholder')"
			:result-labels="{ question: 'paraphrase.originalText', yourAnswer: 'paraphrase.yourAnswer', reference: 'paraphrase.referenceParaphrase' }"
			submit-label="paraphrase.submit" judging-label="paraphrase.judging" submit-hint="paraphrase.submit"
			your-answer-label="paraphrase.yourAnswer" feedback-label="paraphrase.feedback" errors-label="paraphrase.errors"
			suggestion-label="paraphrase.suggestion" next-button-label="paraphrase.nextQuestion"
			back-button-label="paraphrase.backToSettings" @submit="onJudge" @next="onNext" @back="onBackToSettings">
			<template #question-meta>
				<div class="flex items-center justify-between">
					<span class="rounded-full bg-ink-800 px-3 py-1 text-xs text-stone-400">
						{{ langLabel(currentQuestion!.sourceLang) }}
					</span>
					<span class="text-xs text-stone-500">{{ difficultyLabel(currentQuestion!.difficulty) }}</span>
				</div>
			</template>
			<template #question-extra>
				<div v-if="currentQuestion?.hint" class="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-3">
					<p class="text-xs text-accent-soft">{{ t('paraphrase.hint') }}</p>
					<p class="mt-1 text-sm text-stone-300">{{ currentQuestion.hint }}</p>
				</div>
			</template>
			<template #answer-hint>
				<p class="mt-1 text-xs text-stone-500">{{ t('paraphrase.answerHint') }}</p>
			</template>
		</AnswerCard>
	</div>
</template>

<script setup lang="ts">
import type { SessionUser } from '~/stores/user'
import type { LangCode, PracticeDifficulty } from '~/server/types/ai'

definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const store = useUserStore()
const toast = useToast()
const user = computed(() => store.user as SessionUser)

// ---------- 状态 ----------

type Phase = 'idle' | 'generating' | 'answering' | 'judging' | 'result'
const phase = ref<Phase>('idle')

const selectedLang = ref<LangCode>('ja')
const selectedDifficulty = ref<PracticeDifficulty>('random')

const generating = ref(false)
const judging = ref(false)

interface QuestionData {
	questionId: string
	questionText: string
	sourceLang: LangCode
	hint: string | null
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

const sourceLangs: { value: LangCode; label: string }[] = [
	{ value: 'ja', label: '日(日本語 Japanese)' },
	{ value: 'en', label: '英(英語 English)' },
]

function langLabel(lang: LangCode): string {
	return sourceLangs.find((l) => l.value === lang)?.label ?? lang
}

function difficultyLabel(d: number): string {
	if (d === 1) return t('practice.diffEasy')
	if (d === 2) return t('practice.diffMedium')
	return t('practice.diffHard')
}

// ---------- 出题 ----------

async function onGenerate() {
	if (generating.value) return
	generating.value = true
	phase.value = 'generating'
	userAnswer.value = ''
	judgeResult.value = null

	try {
		const data = await $fetch<QuestionData>('/api/paraphrase/generate', {
			method: 'POST',
			body: {
				sourceLang: selectedLang.value,
				difficulty: selectedDifficulty.value,
			},
		})
		currentQuestion.value = data
		store.setUser({ ...user.value, credits: data.credits })
		phase.value = 'answering'
	} catch (err: any) {
		phase.value = 'idle'
		if (err?.statusCode === 402) {
			toast.error(t('paraphrase.noCredits'))
		} else if (err?.statusMessage) {
			toast.error(err.statusMessage)
		} else {
			toast.error(t('paraphrase.generateError'))
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
		const data = await $fetch<JudgeResultData>('/api/paraphrase/judge', {
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
		toast.error(err?.statusMessage || t('paraphrase.judgeError'))
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
