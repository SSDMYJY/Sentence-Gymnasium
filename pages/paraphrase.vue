<template>
	<div class="mx-auto max-w-3xl px-6 pb-24 pt-28">
		<!-- 标题 / Title -->
		<header class="mb-8">
			<div class="flex items-center gap-3">
				<!-- 图标占位（已注释）/ Icon placeholder (commented out) -->
				<div>
					<!-- 页面主标题 / Page heading -->
					<h1 class="font-display text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl">
						{{ t('boards.paraphrase.subtitle') }}
					</h1>
					<!-- 页面描述 / Page description -->
					<p class="mt-1 text-sm text-stone-500">{{ t('boards.paraphrase.desc') }}</p>
				</div>
			</div>
		</header>

		<!-- 设置面板（选择语言 + 难度）/ Settings panel (language and difficulty) -->
		<div v-if="phase === 'idle'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
			<h2 class="text-sm font-semibold text-stone-300">{{ t('paraphrase.settings') }}</h2>

			<!-- 源语言选择 / Source language selection -->
			<div class="mt-5">
				<label class="text-xs uppercase tracking-wide text-stone-500">{{ t('paraphrase.sourceLang') }}</label>
				<div class="mt-3 grid grid-cols-2 gap-3">
					<!-- 遍历源语言 / Iterate source languages -->
					<UButton v-for="lang in sourceLangs" :key="lang.value" variant="ghost" :class="[
						'w-full rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
						selectedLang === lang.value
							? 'border-accent bg-accent/10 text-accent-soft' // 选中态 / Selected
							: 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white', // 未选中 / Unselected
					]" @click="selectedLang = lang.value">
						{{ lang.label }}
					</UButton>
				</div>
			</div>

			<!-- 难度选择组件 / Difficulty selector component -->
			<DifficultyLevelSwitcher v-model="selectedDifficulty" :lang="selectedLang === 'ja' ? 'ja' : 'en'"
				label-key="paraphrase.difficulty" />

			<!-- 能量提示与开始按钮 / Credits hint and start button -->
			<div class="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
				<span class="text-sm text-stone-500">
					⚡ {{ store.credits }} {{ t('paraphrase.credits') }}
					<span class="text-stone-600"> · {{ t('paraphrase.cost', { cost: 1 }) }}</span>
				</span>
				<!-- 积分不足则禁用 / Disabled when out of credits -->
				<UButton :loading="generating" :disabled="store.credits < 1"
					class="bg-white text-ink-950 hover:bg-stone-100" @click="onGenerate">
					{{ t('paraphrase.start') }}
				</UButton>
			</div>
		</div>

		<!-- 加载中 / Generating state -->
		<div v-if="phase === 'generating'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
			<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
			<p class="mt-4 text-sm text-stone-400">{{ t('paraphrase.generating') }}</p>
		</div>

		<!-- 答题 / 判题 / 结果 / Answer / judge / result -->
		<AnswerCard v-if="phase !== 'idle' && phase !== 'generating'" v-model="userAnswer"
			:question-text="currentQuestion?.questionText ?? ''" :judging="judging" :judge-result="judgeResult"
			:rows="4" :placeholder="t('paraphrase.answerPlaceholder')"
			:result-labels="{ question: 'paraphrase.originalText', yourAnswer: 'paraphrase.yourAnswer', reference: 'paraphrase.referenceParaphrase' }"
			submit-label="paraphrase.submit" judging-label="paraphrase.judging" submit-hint="paraphrase.submit"
			your-answer-label="paraphrase.yourAnswer" feedback-label="paraphrase.feedback" errors-label="paraphrase.errors"
			suggestion-label="paraphrase.suggestion" next-button-label="paraphrase.nextQuestion"
			back-button-label="paraphrase.backToSettings" @submit="onJudge" @next="onNext" @back="onBackToSettings">
			<!-- 题头元信息：源语言 + 难度 / Question meta: source language and difficulty -->
			<template #question-meta>
				<div class="flex items-center justify-between">
					<span class="rounded-full bg-ink-800 px-3 py-1 text-xs text-stone-400">
						{{ langLabel(currentQuestion!.sourceLang) }}
					</span>
					<span class="text-xs text-stone-500">{{ difficultyLabel(currentQuestion!.difficulty) }}</span>
				</div>
			</template>
			<!-- 题目额外：提示 / Question extra: hint -->
			<template #question-extra>
				<div v-if="currentQuestion?.hint" class="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-3">
					<p class="text-xs text-accent-soft">{{ t('paraphrase.hint') }}</p>
					<p class="mt-1 text-sm text-stone-300">{{ currentQuestion.hint }}</p>
				</div>
			</template>
			<!-- 作答提示 / Answer hint -->
			<template #answer-hint>
				<p class="mt-1 text-xs text-stone-500">{{ t('paraphrase.answerHint') }}</p>
			</template>
		</AnswerCard>
	</div>
</template>

<script setup lang="ts">
// 引入用户类型 / Import the user type
import type { SessionUser } from '~/stores/user'
// 引入服务端 AI 类型 / Import server AI types
import type { LangCode, PracticeDifficulty } from '~/server/types/ai'

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

// 选中的源语言 / Selected source language
const selectedLang = ref<LangCode>('ja')
// 选中的难度 / Selected difficulty
const selectedDifficulty = ref<PracticeDifficulty>('random')

// 生成中标志 / Generating flag
const generating = ref(false)
// 判题中标志 / Judging flag
const judging = ref(false)

// 题目数据结构 / Question data structure
interface QuestionData {
	questionId: string // 题目 id / Question id
	questionText: string // 题目文本 / Question text
	sourceLang: LangCode // 源语言 / Source language
	hint: string | null // 提示（可空）/ Hint (nullable)
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

// 源语言列表 / Source language options
const sourceLangs: { value: LangCode; label: string }[] = [
	{ value: 'ja', label: '日(日本語 Japanese)' }, // 日语 / Japanese
	{ value: 'en', label: '英(英語 English)' }, // 英语 / English
]

// 源语言显示标签 / Source language label
function langLabel(lang: LangCode): string {
	return sourceLangs.find((l) => l.value === lang)?.label ?? lang
}

// 数值难度转文案 / Map numeric difficulty to label
function difficultyLabel(d: number): string {
	if (d === 1) return t('practice.diffEasy') // 简单 / Easy
	if (d === 2) return t('practice.diffMedium') // 中等 / Medium
	return t('practice.diffHard') // 困难 / Hard
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
		const data = await $fetch<QuestionData>('/api/paraphrase/generate', {
			method: 'POST',
			body: {
				sourceLang: selectedLang.value,
				difficulty: selectedDifficulty.value,
			},
		})
		// 保存题目 / Store the question
		currentQuestion.value = data
		// 同步积分 / Sync credits
		store.setUser({ ...user.value, credits: data.credits })
		phase.value = 'answering'
	} catch (err: any) {
		// 失败回空闲 / Revert to idle on failure
		phase.value = 'idle'
		// 积分不足提示 / Out-of-credits message
		if (err?.statusCode === 402) {
			toast.error(t('paraphrase.noCredits'))
		} else if (err?.statusMessage) {
			toast.error(err.statusMessage)
		} else {
			toast.error(t('paraphrase.generateError'))
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
		const data = await $fetch<JudgeResultData>('/api/paraphrase/judge', {
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
		toast.error(err?.statusMessage || t('paraphrase.judgeError'))
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