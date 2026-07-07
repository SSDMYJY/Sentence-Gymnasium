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
					<button v-for="lang in sourceLangs" :key="lang.value" type="button" :class="[
						'rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
						selectedLang === lang.value
							? 'border-accent bg-accent/10 text-accent-soft'
							: 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white',
					]" @click="selectedLang = lang.value">
						{{ lang.label }}
					</button>
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
				<button type="button" :disabled="generating || store.credits < 1"
					class="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
					@click="onGenerate">
					{{ generating ? t('paraphrase.generating') : t('paraphrase.start') }}
				</button>
			</div>
		</div>

		<!-- 加载中 -->
		<div v-if="phase === 'generating'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
			<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
			<p class="mt-4 text-sm text-stone-400">{{ t('paraphrase.generating') }}</p>
		</div>

		<!-- 答题阶段 -->
		<div v-if="phase === 'answering' && currentQuestion" class="space-y-6">
			<!-- 题目卡片 -->
			<div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
				<div class="flex items-center justify-between">
					<span class="rounded-full bg-ink-800 px-3 py-1 text-xs text-stone-400">
						{{ langLabel(currentQuestion.sourceLang) }}
					</span>
					<span class="text-xs text-stone-500">{{ difficultyLabel(currentQuestion.difficulty) }}</span>
				</div>
				<p class="mt-6 font-display text-xl font-medium leading-relaxed text-stone-100">
					{{ currentQuestion.questionText }}
				</p>
				<div v-if="currentQuestion.hint" class="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-3">
					<p class="text-xs text-accent-soft">{{ t('paraphrase.hint') }}</p>
					<p class="mt-1 text-sm text-stone-300">{{ currentQuestion.hint }}</p>
				</div>
			</div>

			<!-- 作答区 -->
			<div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
				<label class="text-xs uppercase tracking-wide text-stone-500">{{ t('paraphrase.yourAnswer') }}</label>
				<p class="mt-1 text-xs text-stone-500">{{ t('paraphrase.answerHint') }}</p>
				<textarea v-model="userAnswer" rows="4" :placeholder="t('paraphrase.answerPlaceholder')"
					:disabled="judging"
					class="mt-3 w-full resize-none rounded-lg border border-white/10 bg-ink-950 px-4 py-3 text-stone-100 placeholder-stone-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
					@keydown.meta.enter="onJudge" @keydown.ctrl.enter="onJudge" />
				<div class="mt-3 flex items-center justify-between">
					<span class="text-xs text-stone-600">⌘/Ctrl + Enter {{ t('paraphrase.submit') }}</span>
					<button type="button" :disabled="judging || !userAnswer.trim()"
						class="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
						@click="onJudge">
						{{ judging ? t('paraphrase.judging') : t('paraphrase.submit') }}
					</button>
				</div>
			</div>
		</div>

		<!-- 判题加载 -->
		<div v-if="phase === 'judging'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
			<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
			<p class="mt-4 text-sm text-stone-400">{{ t('paraphrase.judging') }}</p>
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
						<p class="text-xs uppercase tracking-wide text-stone-500">{{ t('paraphrase.originalText') }}</p>
						<p class="mt-1 text-stone-200">{{ currentQuestion?.questionText }}</p>
					</div>
					<div>
						<p class="text-xs uppercase tracking-wide text-stone-500">{{ t('paraphrase.yourAnswer') }}</p>
						<p class="mt-1 text-stone-200">{{ userAnswer }}</p>
					</div>
					<div>
						<p class="text-xs uppercase tracking-wide text-stone-500">{{ t('paraphrase.referenceParaphrase')
						}}</p>
						<p class="mt-1 text-accent-soft">{{ judgeResult.correctAnswer }}</p>
					</div>
				</div>
			</div>

			<!-- AI 反馈 -->
			<div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
				<h3 class="text-sm font-semibold text-stone-300">{{ t('paraphrase.feedback') }}</h3>
				<p class="mt-3 text-sm leading-relaxed text-stone-300">{{ judgeResult.feedback }}</p>

				<div v-if="judgeResult.errors?.length" class="mt-4">
					<p class="text-xs uppercase tracking-wide text-stone-500">{{ t('paraphrase.errors') }}</p>
					<ul class="mt-2 space-y-1">
						<li v-for="(err, i) in judgeResult.errors" :key="i"
							class="flex items-start gap-2 text-sm text-stone-400">
							<span class="mt-0.5 text-red-400">·</span>
							<span>{{ err }}</span>
						</li>
					</ul>
				</div>

				<div v-if="judgeResult.suggestion" class="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
					<p class="text-xs uppercase tracking-wide text-accent-soft">{{ t('paraphrase.suggestion') }}</p>
					<p class="mt-1 text-sm text-stone-200">{{ judgeResult.suggestion }}</p>
				</div>
			</div>

			<!-- 操作按钮 -->
			<div class="flex gap-3">
				<button type="button"
					class="flex-1 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-stone-100"
					@click="onNext">
					{{ t('paraphrase.nextQuestion') }}
				</button>
				<button type="button"
					class="flex-1 rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-stone-300 transition-colors hover:border-white/30 hover:text-white"
					@click="onBackToSettings">
					{{ t('paraphrase.backToSettings') }}
				</button>
			</div>
		</div>
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
}
const judgeResult = ref<JudgeResultData | null>(null)

// ---------- 选项 ----------

const sourceLangs: { value: LangCode; label: string }[] = [
	{ value: 'ja', label: '日本語' },
	{ value: 'en', label: 'English' },
]

function langLabel(lang: LangCode): string {
	return sourceLangs.find((l) => l.value === lang)?.label ?? lang
}

function difficultyLabel(d: number): string {
	if (d === 1) return t('practice.diffEasy')
	if (d === 2) return t('practice.diffMedium')
	return t('practice.diffHard')
}

function verdictLabel(v: string): string {
	if (v === 'correct') return t('paraphrase.verdictCorrect')
	if (v === 'partial') return t('paraphrase.verdictPartial')
	return t('paraphrase.verdictIncorrect')
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
		})
		if (data.streakIncreased && data.streak > 1) {
			toast.success(`🔥 ${t('dashboard.stats.streak')} ${data.streak} ${t('streak.days')}`)
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
