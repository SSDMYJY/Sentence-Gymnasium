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
					<UButton
						v-for="lang in languages"
						:key="lang.value"
						variant="ghost"
						:class="[
							'flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
							selectedLang === lang.value
								? 'border-accent bg-accent/10 text-accent-soft'
								: 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white',
						]"
						@click="selectedLang = lang.value; selectedTag = filteredGrammarTags[0]?.value ?? 'te-form'"
					>
						{{ lang.label }}
					</UButton>
				</div>
			</div>

			<!-- 语法点选择（随语言切换） -->
			<div class="mt-5">
				<label class="text-xs uppercase tracking-wide text-stone-500">{{ t('grammar.grammarPoint') }}</label>
				<div class="mt-3 grid gap-3"
					:class="filteredGrammarTags.length % 3 === 0 ? 'grid-cols-3' : 'grid-cols-2'">
					<UButton
						v-for="tag in filteredGrammarTags"
						:key="tag.value"
						variant="ghost"
						:class="[
							'rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
							selectedTag === tag.value
								? 'border-accent bg-accent/10 text-accent-soft'
								: 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white',
						]"
						@click="selectedTag = tag.value"
					>
						{{ tag.label }}
					</UButton>
				</div>
			</div>

			<!-- 题型选择（仅填空题 + 改错题） -->
			<div class="mt-6">
				<label class="text-xs uppercase tracking-wide text-stone-500">{{ t('grammar.questionType') }}</label>
				<div class="mt-3 flex gap-3">
					<UButton
						v-for="qt in questionTypes"
						:key="qt.value"
						variant="ghost"
						:class="[
							'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
							selectedType === qt.value
								? 'border-accent bg-accent/10 text-accent-soft'
								: 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white',
						]"
						@click="selectedType = qt.value"
					>
						{{ qt.label }}
					</UButton>
				</div>
			</div>

			<!-- 开始按钮（免费） -->
			<div class="mt-6 flex items-center justify-end border-t border-white/5 pt-4">
				<UButton
					:loading="generating"
					class="bg-white text-ink-950 hover:bg-stone-100"
					@click="onGenerate"
				>
					{{ t('grammar.start') }}
				</UButton>
			</div>
		</div>

		<!-- 加载中 -->
		<div v-if="phase === 'generating'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
			<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
			<p class="mt-4 text-sm text-stone-400">{{ t('grammar.generating') }}</p>
		</div>

		<!-- 答题 / 判题 / 结果 -->
		<AnswerCard v-if="phase !== 'idle' && phase !== 'generating'" v-model="userAnswer"
			:question-text="currentQuestion?.questionText ?? ''" :judging="judging" :judge-result="judgeResult"
			:rows="3" :placeholder="t('grammar.answerPlaceholder')"
			:result-labels="{ question: 'grammar.question', yourAnswer: 'grammar.yourAnswer', reference: 'grammar.correctAnswer' }"
			submit-label="grammar.submit" judging-label="grammar.judging" submit-hint="grammar.submit"
			your-answer-label="grammar.yourAnswer" feedback-label="grammar.feedback" errors-label="grammar.errors"
			suggestion-label="grammar.suggestion" next-button-label="grammar.nextQuestion"
			back-button-label="grammar.backToSettings" :next-first="true" @submit="onJudge" @next="onNext"
			@back="onBackToSettings">
			<template #question-meta>
				<div class="flex items-center justify-between">
					<span class="rounded-full bg-ink-800 px-3 py-1 text-xs text-stone-400">
						{{ tagLabel(currentQuestion!.grammarTag) }}
					</span>
					<span class="text-xs text-stone-500">{{ typeLabel(currentQuestion!.questionType) }}</span>
				</div>
			</template>
			<template #result-extra>
				<div v-if="currentQuestion?.explanation || judgeResult?.explanation"
					class="rounded-2xl border border-accent/20 bg-accent/5 p-6">
					<h3 class="text-sm font-semibold text-accent-soft">{{ t('grammar.explanation') }}</h3>
					<p class="mt-2 text-sm leading-relaxed text-stone-300">
						{{ judgeResult?.explanation || currentQuestion?.explanation }}
					</p>
				</div>
			</template>
		</AnswerCard>
	</div>
</template>

<script setup lang="ts">
import type { SessionUser } from '~/stores/user'
import type { GrammarTag } from '~/server/types/ai'

definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const store = useUserStore()
const toast = useToast()
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
	const allTags = [...grammarTagsByLang.ja, ...grammarTagsByLang.en]
	return allTags.find((x) => x.value === tag)?.label ?? tag
}

function typeLabel(type: string): string {
	return questionTypes.find((x) => x.value === type)?.label ?? type
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
			toast.error(err.statusMessage)
		} else {
			toast.error(t('grammar.generateError'))
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
		toast.error(err?.statusMessage || t('grammar.judgeError'))
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
