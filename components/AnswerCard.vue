<script setup lang="ts">
/**
 * 可复用答题组件
 * 统一管理 practice / grammar / paraphrase 三个页面的答题区域 UI
 */

interface JudgeResult {
	isCorrect: boolean
	score: number
	verdict: 'correct' | 'partial' | 'incorrect'
	feedback: string
	suggestion: string | null
	errors: string[]
	correctAnswer: string
	[key: string]: unknown
}

interface ResultLabels {
	question: string
	yourAnswer: string
	reference: string
}

const props = withDefaults(defineProps<{
	/** 用户答案（v-model） */
	modelValue: string
	/** 当前题目文本 */
	questionText: string
	/** 是否正在判题 */
	judging?: boolean
	/** 判题结果 */
	judgeResult?: JudgeResult | null
	/** textarea 行数 */
	rows?: number
	/** 输入框占位文本 */
	placeholder?: string
	/** 结果区标签 */
	resultLabels?: ResultLabels
	/** 提交按钮文本 */
	submitLabel?: string
	/** 判题中按钮文本 */
	judgingLabel?: string
	/** 提交快捷键提示 */
	submitHint?: string
	/** 你的答案 label */
	yourAnswerLabel?: string
	/** 反馈标题 */
	feedbackLabel?: string
	/** 错误列表标题 */
	errorsLabel?: string
	/** 建议标题 */
	suggestionLabel?: string
	/** 下一题按钮文本 */
	nextButtonLabel?: string
	/** 返回设置按钮文本 */
	backButtonLabel?: string
	/** 是否将"下一题"按钮放在前面（grammar 为 true） */
	nextFirst?: boolean
	/** 是否禁止剪贴板操作（practice 为 true） */
	restrictClipboard?: boolean
}>(), {
	judging: false,
	judgeResult: null,
	rows: 4,
	placeholder: '',
	resultLabels: () => ({
		question: 'practice.question',
		yourAnswer: 'practice.yourAnswer',
		reference: 'practice.referenceAnswer',
	}),
	submitLabel: 'practice.submit',
	judgingLabel: 'practice.judging',
	submitHint: '',
	yourAnswerLabel: 'practice.yourAnswer',
	feedbackLabel: 'practice.feedback',
	errorsLabel: 'practice.errors',
	suggestionLabel: 'practice.suggestion',
	nextButtonLabel: 'practice.nextQuestion',
	backButtonLabel: 'practice.backToSettings',
	nextFirst: false,
	restrictClipboard: true,
})

const emit = defineEmits<{
	'update:modelValue': [value: string]
	/** 提交判题 */
	submit: []
	/** 下一题 */
	next: []
	/** 返回设置 */
	back: []
}>()

const { t } = useI18n()

const answer = computed({
	get: () => props.modelValue,
	set: (v: string) => emit('update:modelValue', v),
})

const hasResult = computed(() => !!props.judgeResult)
const showAnswering = computed(() => !props.judging && !hasResult.value)
const showJudging = computed(() => props.judging)
const showResult = computed(() => hasResult.value)

function verdictLabel(v: string): string {
	if (v === 'correct') return t('practice.verdictCorrect')
	if (v === 'partial') return t('practice.verdictPartial')
	return t('practice.verdictIncorrect')
}
</script>

<template>
	<!-- 判题加载 -->
	<div v-if="showJudging" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
		<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
		<p class="mt-4 text-sm text-stone-400">{{ t(judgingLabel) }}</p>
	</div>

	<!-- 判题结果 -->
	<div v-else-if="showResult && judgeResult" class="space-y-6">
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
					<p class="text-xs uppercase tracking-wide text-stone-500">{{ t(resultLabels.question) }}</p>
					<p class="mt-1 text-stone-200">{{ questionText }}</p>
				</div>
				<div>
					<p class="text-xs uppercase tracking-wide text-stone-500">{{ t(resultLabels.yourAnswer) }}</p>
					<p class="mt-1 text-stone-200">{{ modelValue }}</p>
				</div>
				<div>
					<p class="text-xs uppercase tracking-wide text-stone-500">{{ t(resultLabels.reference) }}</p>
					<p class="mt-1 text-accent-soft">{{ judgeResult.correctAnswer }}</p>
				</div>
			</div>
		</div>

		<!-- 结果区额外内容（如 grammar 的 explanation） -->
		<slot name="result-extra" />

		<!-- AI 反馈 -->
		<div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
			<h3 class="text-sm font-semibold text-stone-300">{{ t(feedbackLabel) }}</h3>
			<p class="mt-3 text-sm leading-relaxed text-stone-300">{{ judgeResult.feedback }}</p>

			<div v-if="judgeResult.errors?.length" class="mt-4">
				<p class="text-xs uppercase tracking-wide text-stone-500">{{ t(errorsLabel) }}</p>
				<ul class="mt-2 space-y-1">
					<li v-for="(err, i) in judgeResult.errors" :key="i"
						class="flex items-start gap-2 text-sm text-stone-400">
						<span class="mt-0.5 text-red-400">·</span>
						<span>{{ err }}</span>
					</li>
				</ul>
			</div>

			<div v-if="judgeResult.suggestion" class="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
				<p class="text-xs uppercase tracking-wide text-accent-soft">{{ t(suggestionLabel) }}</p>
				<p class="mt-1 text-sm text-stone-200">{{ judgeResult.suggestion }}</p>
			</div>
		</div>

		<!-- 操作按钮 -->
		<div class="flex gap-3">
			<template v-if="nextFirst">
				<UButton class="flex-1 bg-white text-ink-950 hover:bg-stone-100" @click="emit('next')">
					{{ t(nextButtonLabel) }}
				</UButton>
				<UButton variant="outline"
					class="flex-1 border-white/15 text-stone-300 hover:border-white/30 hover:text-white" @click="emit('back')">
					{{ t(backButtonLabel) }}
				</UButton>
			</template>
			<template v-else>
				<UButton variant="outline"
					class="flex-1 border-white/15 text-stone-300 hover:border-white/30 hover:text-white" @click="emit('back')">
					{{ t(backButtonLabel) }}
				</UButton>
				<UButton class="flex-1 bg-white text-ink-950 hover:bg-stone-100" @click="emit('next')">
					{{ t(nextButtonLabel) }}
				</UButton>
			</template>
		</div>
	</div>

	<!-- 答题阶段 -->
	<div v-else-if="showAnswering" class="space-y-6">
		<!-- 题目卡片 -->
		<div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
			<slot name="question-meta" />
			<p class="mt-6 font-display text-xl font-medium leading-relaxed text-stone-100">
				{{ questionText }}
			</p>
			<slot name="question-extra" />
		</div>

		<!-- 作答区 -->
		<div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
			<label class="block text-xs uppercase tracking-wide text-stone-500">{{ t(yourAnswerLabel) }}</label>
			<slot name="answer-hint" />
			<UTextarea v-model="answer" :rows="rows" :placeholder="placeholder" :disabled="judging" :ui="{
				root: 'w-full',
				wrapper: 'mt-3',
				textarea: 'w-full resize-none border-white/10 bg-ink-950 text-stone-100 placeholder-stone-600 focus:border-accent focus:ring-accent/30 select-none',
			}" @keydown.meta.enter="emit('submit')" @keydown.ctrl.enter="emit('submit')"
				@paste="restrictClipboard ? $event.preventDefault() : undefined"
				@copy="restrictClipboard ? $event.preventDefault() : undefined"
				@cut="restrictClipboard ? $event.preventDefault() : undefined"
				@contextmenu="restrictClipboard ? $event.preventDefault() : undefined" />
			<div class="mt-3 flex items-center justify-between">
				<span class="text-xs text-stone-600">⌘/Ctrl + Enter {{ t(submitHint) }}</span>
				<UButton :loading="judging || !answer.trim()" :disabled="judging || !answer.trim()"
					class="bg-white text-ink-950 hover:bg-stone-100" @click="emit('submit')">
					{{ judging ? t(judgingLabel) : t(submitLabel) }}
				</UButton>
			</div>
		</div>
	</div>
</template>
