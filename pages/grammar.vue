<template>
	<div class="mx-auto max-w-3xl px-6 pb-24 pt-28">
		<!-- 标题 / Title -->
		<header class="mb-8">
			<div class="flex items-center gap-3">
				<!-- 图标占位（已注释）/ Icon placeholder (commented out) -->
				<div>
					<!-- 页面主标题 / Page heading -->
					<h1 class="font-display text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl">
						{{ t('boards.grammar.subtitle') }}
					</h1>
					<!-- 页面描述 / Page description -->
					<p class="mt-1 text-sm text-stone-500">{{ t('boards.grammar.desc') }}</p>
				</div>
			</div>
		</header>

		<!-- 设置面板（语言 + 语法点 + 题型同时展示）/ Settings panel (language, grammar point, question type) -->
		<div v-if="phase === 'idle'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
			<h2 class="text-sm font-semibold text-stone-300">{{ t('grammar.settings') }}</h2>

			<!-- 语言选择 / Language selection -->
			<div class="mt-5">
				<label class="text-xs uppercase tracking-wide text-stone-500">{{ t('grammar.language') }}</label>
				<div class="mt-3 flex gap-3">
					<!-- 遍历语言 / Iterate languages -->
					<UButton
						v-for="lang in languages"
						:key="lang.value"
						variant="ghost"
						:class="[
							'flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
							selectedLang === lang.value
								? 'border-accent bg-accent/10 text-accent-soft' // 选中态 / Selected
								: 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white', // 未选中 / Unselected
						]"
						@click="selectedLang = lang.value; selectedTag = filteredGrammarTags[0]?.value ?? 'te-form'"
					>
						{{ lang.label }}
					</UButton>
				</div>
			</div>

			<!-- 语法点选择（随语言切换）/ Grammar point selection (varies by language) -->
			<div class="mt-5">
				<label class="text-xs uppercase tracking-wide text-stone-500">{{ t('grammar.grammarPoint') }}</label>
				<div class="mt-3 grid gap-3"
					:class="filteredGrammarTags.length % 3 === 0 ? 'grid-cols-3' : 'grid-cols-2'">
					<!-- 遍历语法点 / Iterate grammar tags -->
					<UButton
						v-for="tag in filteredGrammarTags"
						:key="tag.value"
						variant="ghost"
						:class="[
							'rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
							selectedTag === tag.value
								? 'border-accent bg-accent/10 text-accent-soft' // 选中态 / Selected
								: 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white', // 未选中 / Unselected
						]"
						@click="selectedTag = tag.value"
					>
						{{ tag.label }}
					</UButton>
				</div>
			</div>

			<!-- 题型选择（仅填空题 + 改错题）/ Question type selection (fill-blank or error-correction) -->
			<div class="mt-6">
				<label class="text-xs uppercase tracking-wide text-stone-500">{{ t('grammar.questionType') }}</label>
				<div class="mt-3 flex gap-3">
					<!-- 遍历题型 / Iterate question types -->
					<UButton
						v-for="qt in questionTypes"
						:key="qt.value"
						variant="ghost"
						:class="[
							'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
							selectedType === qt.value
								? 'border-accent bg-accent/10 text-accent-soft' // 选中态 / Selected
								: 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white', // 未选中 / Unselected
						]"
						@click="selectedType = qt.value"
					>
						{{ qt.label }}
					</UButton>
				</div>
			</div>

			<!-- 开始按钮（免费）/ Start button (free) -->
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

		<!-- 加载中 / Generating state -->
		<div v-if="phase === 'generating'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
			<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
			<p class="mt-4 text-sm text-stone-400">{{ t('grammar.generating') }}</p>
		</div>

		<!-- 答题 / 判题 / 结果 / Answer / judge / result -->
		<AnswerCard v-if="phase !== 'idle' && phase !== 'generating'" v-model="userAnswer"
			:question-text="currentQuestion?.questionText ?? ''" :judging="judging" :judge-result="judgeResult"
			:rows="3" :placeholder="t('grammar.answerPlaceholder')"
			:result-labels="{ question: 'grammar.question', yourAnswer: 'grammar.yourAnswer', reference: 'grammar.correctAnswer' }"
			submit-label="grammar.submit" judging-label="grammar.judging" submit-hint="grammar.submit"
			your-answer-label="grammar.yourAnswer" feedback-label="grammar.feedback" errors-label="grammar.errors"
			suggestion-label="grammar.suggestion" next-button-label="grammar.nextQuestion"
			back-button-label="grammar.backToSettings" :next-first="true" @submit="onJudge" @next="onNext"
			@back="onBackToSettings">
			<!-- 题头元信息：语法点 + 题型 / Question meta: grammar tag and type -->
			<template #question-meta>
				<div class="flex items-center justify-between">
					<span class="rounded-full bg-ink-800 px-3 py-1 text-xs text-stone-400">
						{{ tagLabel(currentQuestion!.grammarTag) }}
					</span>
					<span class="text-xs text-stone-500">{{ typeLabel(currentQuestion!.questionType) }}</span>
				</div>
			</template>
			<!-- 结果额外：语法解析 / Result extra: grammar explanation -->
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
// 引入用户类型 / Import the user type
import type { SessionUser } from '~/stores/user'
// 引入语法点类型 / Import the grammar tag type
import type { GrammarTag } from '~/server/types/ai'

// 启用 auth 路由守卫 / Enable the auth route guard
definePageMeta({ middleware: 'auth' })

// 获取 i18n 与当前语言 / Obtain i18n and current locale
const { t, locale } = useI18n()
// 获取用户 store / Obtain the user store
const store = useUserStore()
// 获取 toast 提示 / Obtain the toast helper
const user = computed(() => store.user as SessionUser)

// ---------- 状态 / State ----------

// 页面阶段枚举 / Page phase enum
type Phase = 'idle' | 'generating' | 'answering' | 'judging' | 'result'
// 当前阶段（默认空闲）/ Current phase (defaults to idle)
const phase = ref<Phase>('idle')

// 选中的语言 / Selected language
const selectedLang = ref<'ja' | 'en'>('ja')
// 选中的语法点 / Selected grammar tag
const selectedTag = ref<GrammarTag>('te-form')
// 选中的题型 / Selected question type
const selectedType = ref<'fill-blank' | 'error-correction'>('fill-blank')

// 生成中标志 / Generating flag
const generating = ref(false)
// 判题中标志 / Judging flag
const judging = ref(false)

// 题目数据结构 / Question data structure
interface QuestionData {
	questionId: string // 题目 id / Question id
	questionText: string // 题目文本 / Question text
	grammarTag: GrammarTag // 语法点 / Grammar tag
	questionType: 'fill-blank' | 'error-correction' // 题型 / Question type
	options: string[] | null // 选项（可空）/ Options (nullable)
	explanation: string | null // 解析 / Explanation
	difficulty: number // 难度 / Difficulty
}
// 当前题目 / Current question
const currentQuestion = ref<QuestionData | null>(null)
// 用户答案 / User answer
const userAnswer = ref('')

// 判题结果数据结构 / Judge result data structure
interface JudgeResultData {
	isCorrect: boolean // 是否全对 / Fully correct
	score: number // 得分 / Score
	verdict: 'correct' | 'partial' | 'incorrect' // 等级 / Verdict
	feedback: string // 反馈 / Feedback
	suggestion: string | null // 建议 / Suggestion
	errors: string[] // 错误 / Errors
	correctAnswer: string // 参考答案 / Reference answer
	explanation: string | null // 解析 / Explanation
	totalAttempts: number // 总次数 / Total attempts
	correctAttempts: number // 正确次数 / Correct attempts
	streak: number // 连续天数 / Streak
	streakIncreased: boolean // 是否增加 / Streak increased
	level: number // 等级 / Level
	credits: number // 积分 / Credits
	levelUp: boolean // 是否升级 / Leveled up
}
// 判题结果 / Judge result
const judgeResult = ref<JudgeResultData | null>(null)

// ---------- 选项 / Options ----------

// 语言列表 / Language options
const languages: { value: 'ja' | 'en'; label: string }[] = [
	{ value: 'ja', label: t('grammar.langJa') }, // 日语 / Japanese
	{ value: 'en', label: t('grammar.langEn') }, // 英语 / English
]

// 按语言分组的语法点 / Grammar tags grouped by language
const grammarTagsByLang: Record<'ja' | 'en', { value: GrammarTag; label: string }[]> = {
	ja: [
		{ value: 'te-form', label: 'て形 (te-form)' }, // て形 / te-form
		{ value: 'passive', label: t('grammar.tagPassive') }, // 被动 / Passive
		{ value: 'conditionals', label: t('grammar.tagConditionals') }, // 条件 / Conditionals
		{ value: 'relative-clauses', label: t('grammar.tagRelativeClauses') }, // 关系从句 / Relative clauses
		{ value: 'particles', label: t('grammar.tagParticles') }, // 助词 / Particles
		{ value: 'honorifics', label: t('grammar.tagHonorifics') }, // 敬语 / Honorifics
	],
	en: [
		{ value: 'present-perfect', label: t('grammar.tagPresentPerfect') }, // 现在完成时 / Present perfect
		{ value: 'passive', label: t('grammar.tagPassive') }, // 被动 / Passive
		{ value: 'conditionals', label: t('grammar.tagConditionals') }, // 条件 / Conditionals
		{ value: 'relative-clauses', label: t('grammar.tagRelativeClauses') }, // 关系从句 / Relative clauses
	],
}

// 当前语言对应的语法点 / Grammar tags for the selected language
const filteredGrammarTags = computed(() => grammarTagsByLang[selectedLang.value])

// 题型列表 / Question type options
const questionTypes: { value: 'fill-blank' | 'error-correction'; label: string }[] = [
	{ value: 'fill-blank', label: t('grammar.typeFillBlank') }, // 填空 / Fill blank
	{ value: 'error-correction', label: t('grammar.typeErrorCorrection') }, // 改错 / Error correction
]

// 语法点显示标签 / Grammar tag label
function tagLabel(tag: GrammarTag): string {
	// 合并两种语言的语法点后查找 / Merge both languages' tags and find
	const allTags = [...grammarTagsByLang.ja, ...grammarTagsByLang.en]
	return allTags.find((x) => x.value === tag)?.label ?? tag
}

// 题型显示标签 / Question type label
function typeLabel(type: string): string {
	return questionTypes.find((x) => x.value === type)?.label ?? type
}

// ---------- 出题 / Generate question ----------

// 出题处理函数 / Generate handler
async function onGenerate() {
	// 防止重复点击 / Guard against duplicate clicks
	if (generating.value) return
	generating.value = true
	phase.value = 'generating'
	userAnswer.value = ''
	judgeResult.value = null

	try {
		// 调用出题接口 / Call the generate API
		const data = await $fetch<QuestionData>('/api/grammar/generate', {
			method: 'POST',
			body: {
				language: selectedLang.value,
				grammarTag: selectedTag.value,
				questionType: selectedType.value,
			},
		})
		// 保存题目 / Store the question
		currentQuestion.value = data
		phase.value = 'answering'
	} catch (err: any) {
		// 失败回空闲 / Revert to idle on failure
		phase.value = 'idle'
		// 错误信息提示 / Error toast
		if (err?.statusMessage) {
			toast.error(err.statusMessage)
		} else {
			toast.error(t('grammar.generateError'))
		}
	} finally {
		// 结束生成 / Stop generating
		generating.value = false
	}
}

// ---------- 判题 / Judge answer ----------

// 判题处理函数 / Judge handler
async function onJudge() {
	// 守卫 / Guards
	if (judging.value || !userAnswer.value.trim() || !currentQuestion.value) return
	judging.value = true
	phase.value = 'judging'

	try {
		// 调用判题接口 / Call the judge API
		const data = await $fetch<JudgeResultData>('/api/grammar/judge', {
			method: 'POST',
			body: {
				questionId: currentQuestion.value.questionId,
				userAnswer: userAnswer.value,
				uiLang: locale.value,
			},
		})
		// 保存判题结果 / Store the judge result
		judgeResult.value = data
		// 更新用户统计 / Update user stats
		store.setUser({
			...user.value,
			totalAttempts: data.totalAttempts,
			correctAttempts: data.correctAttempts,
			streak: data.streak,
			level: data.level,
			credits: data.credits,
		})
		// 连续天数增加提示 / Streak-increased toast
		if (data.streakIncreased && data.streak > 1) {
			toast.success(`🔥 ${t('dashboard.stats.streak')} ${data.streak} ${t('streak.days')}`)
		}
		// 升级提示 / Level-up toast
		if (data.levelUp) {
			toast.success(`🎉 ${t('dashboard.level.upTitle')}`)
		}
		phase.value = 'result'
	} catch (err: any) {
		// 失败回答题 / Revert to answering on failure
		phase.value = 'answering'
		toast.error(err?.statusMessage || t('grammar.judgeError'))
	} finally {
		// 结束判题 / Stop judging
		judging.value = false
	}
}

// ---------- 下一步 / Next steps ----------

// 下一题：回到空闲并重新出题 / Next: reset to idle and generate again
function onNext() {
	phase.value = 'idle'
	currentQuestion.value = null
	userAnswer.value = ''
	judgeResult.value = null
	onGenerate()
}

// 返回设置面板 / Back to settings panel
function onBackToSettings() {
	phase.value = 'idle'
	currentQuestion.value = null
	userAnswer.value = ''
	judgeResult.value = null
}
</script>