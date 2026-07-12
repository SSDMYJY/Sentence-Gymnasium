<template>
	<div class="mx-auto max-w-3xl px-6 pb-24 pt-28">
		<!-- 标题 / Title -->
		<header class="mb-8">
			<div class="flex items-center gap-3">
				<div>
					<!-- 页面主标题 / Page heading -->
					<h1 class="font-display text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl">
						{{ t('boards.practice.subtitle') }}
					</h1>
					<!-- 页面描述 / Page description -->
					<p class="mt-1 text-sm text-stone-500">{{ t('boards.practice.desc') }}</p>
				</div>
			</div>
		</header>

		<!-- 设置面板（选择语言对 + 难度 + 场景）/ Settings panel (language pair, difficulty, scenario) -->
		<div v-if="phase === 'idle'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
			<h2 class="text-sm font-semibold text-stone-300">{{ t('practice.settings') }}</h2>

			<!-- 语言对选择 / Language pair selection -->
			<div class="mt-5">
				<label class="text-xs uppercase tracking-wide text-stone-500">{{ t('practice.languagePair') }}</label>
				<div class="mt-3 grid grid-cols-2 gap-3">
					<!-- 遍历语言对 / Iterate language pairs -->
					<UButton v-for="pair in languagePairs" :key="pair.value" variant="ghost"
						:color="selectedPair === pair.value ? 'primary' : 'neutral'" :class="[
							'justify-start px-4 py-3 border text-sm font-medium',
							selectedPair === pair.value
								? 'border-accent bg-accent/10 text-accent-soft' // 选中态 / Selected
								: 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white', // 未选中 / Unselected
						]" @click="selectedPair = pair.value">
						{{ pair.label }}
					</UButton>
				</div>
			</div>

			<!-- 难度选择组件 / Difficulty selector component -->
			<DifficultyLevelSwitcher v-model="selectedDifficulty" :lang="targetLang(selectedPair)"
				@update:model-value="savePreferences" />

			<!-- 场景选择 / Scenario selection -->
			<div class="mt-6">
				<div class="flex items-center justify-between">
					<label class="text-xs uppercase tracking-wide text-stone-500">{{ t('practice.scenarioTitle')
					}}</label>
					<!-- 当前场景文案 / Current scenario label -->
					<span class="text-xs text-stone-600">{{ scenarioDisplayLabel(selectedScenario) }}</span>
				</div>
				<div class="mt-3">
					<!-- 场景下拉组件 / Scenario dropdown component -->
					<ScenarioDropdown v-model="selectedScenario" @update:model-value="savePreferences" />
				</div>
			</div>

			<!-- 能量提示与开始按钮 / Credits hint and start button -->
			<div class="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
				<span class="text-sm text-stone-500">
					⚡ {{ store.credits }} {{ t('practice.credits') }}
					<span class="text-stone-600"> · {{ t('practice.cost', { cost: 1 }) }}</span>
				</span>
				<!-- 积分不足或生成中则禁用 / Disabled when generating or out of credits -->
				<UButton :loading="generating || store.credits < 1" :disabled="generating || store.credits < 1"
					class="bg-white text-ink-950 hover:bg-stone-100" @click="onGenerate">
					{{ generating ? t('practice.generating') : t('practice.start') }}
				</UButton>
			</div>
		</div>

		<!-- 加载中 / Generating state -->
		<div v-if="phase === 'generating'" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
			<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
			<p class="mt-4 text-sm text-stone-400">{{ t('practice.generating') }}</p>
		</div>

		<!-- 答题 / 判题 / 结果 / Answer / judge / result -->
		<AnswerCard v-if="phase !== 'idle' && phase !== 'generating'" v-model="userAnswer"
			:question-text="currentQuestion?.questionText ?? ''" :judging="judging" :judge-result="judgeResult"
			:rows="4" :placeholder="t('practice.answerPlaceholder')"
			:result-labels="{ question: 'practice.question', yourAnswer: 'practice.yourAnswer', reference: 'practice.referenceAnswer' }"
			submit-label="practice.submit" judging-label="practice.judging" submit-hint="practice.submit"
			your-answer-label="practice.yourAnswer" feedback-label="practice.feedback" errors-label="practice.errors"
			suggestion-label="practice.suggestion" next-button-label="practice.nextQuestion"
			back-button-label="practice.backToSettings" @submit="onJudge" @next="onNext" @back="onBackToSettings">
			<!-- 题头元信息：语言对 + 难度 + 场景 / Question meta: language pair, difficulty, scenario -->
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
// 引入用户类型 / Import the user type
import type { SessionUser } from '~/stores/user'
// 引入服务端 AI 类型 / Import server AI types
import type { LanguagePair, PracticeDifficulty, ScenarioValue } from '~/server/types/ai'
// 引入练习配置工具 / Import practice config helpers
import {
	PRACTICE_DIFFICULTIES,
	RANDOM_SCENARIO,
	SCENARIO_CATEGORIES,
	resolveNumericDifficulty,
} from '~/utils/practice-config'

// 启用 auth 路由守卫 / Enable the auth route guard
definePageMeta({ middleware: 'auth' })

// 获取 i18n 与当前语言 / Obtain i18n and current locale
const { t, locale } = useI18n()
// 获取用户 store / Obtain the user store
const store = useUserStore()
// 获取 toast 提示 / Obtain the toast helper
const toast = useToast()
// 当前用户（断言为 SessionUser）/ Current user (asserted as SessionUser)
const user = computed(() => store.user as SessionUser)

// ---------- 状态 / State ----------

// 页面阶段枚举 / Page phase enum
type Phase = 'idle' | 'generating' | 'answering' | 'judging' | 'result'
// 当前阶段（默认空闲）/ Current phase (defaults to idle)
const phase = ref<Phase>('idle')

// 选中的语言对 / Selected language pair
const selectedPair = ref<LanguagePair>('ja-en')
// 选中的难度 / Selected difficulty
const selectedDifficulty = ref<PracticeDifficulty>('random')
// 选中的场景 / Selected scenario
const selectedScenario = ref<ScenarioValue>({ ...RANDOM_SCENARIO })

// 生成中标志 / Generating flag
const generating = ref(false)
// 判题中标志 / Judging flag
const judging = ref(false)

// 题目数据结构 / Question data structure
interface QuestionData {
	questionId: string // 题目 id / Question id
	questionText: string // 题目文本 / Question text
	languagePair: LanguagePair // 语言对 / Language pair
	difficulty: 1 | 2 | 3 // 数值难度 / Numeric difficulty
	practiceDifficulty: PracticeDifficulty // 练习难度档 / Practice difficulty tier
	scenario: ScenarioValue // 场景 / Scenario
	credits: number // 剩余积分 / Remaining credits
}
// 当前题目 / Current question
const currentQuestion = ref<QuestionData | null>(null)
// 用户答案 / User answer
const userAnswer = ref('')

// 用户偏好本地存储 key / Local storage key for preferences
const STORAGE_KEY = 'sg-practice-preferences'

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

// 语言对列表 / Language pair options
const languagePairs: { value: LanguagePair; label: string }[] = [
	{ value: 'ja-en', label: '日(日本語 Japanese) → 英(英語 English)' }, // 日译英 / Japanese→English
	{ value: 'en-ja', label: '英(英語 English) → 日(日本語 Japanese)' }, // 英译日 / English→Japanese
	{ value: 'zh-en', label: '中(中国語 Chinese) → 英(英語 English)' }, // 中译英 / Chinese→English (note: zh-ja omitted)
	{ value: 'zh-ja', label: '中(中国語 Chinese) → 日(日本語 Japanese)' }, // 中译日 / Chinese→Japanese
]

// 根据语言对取显示标签 / Get display label for a language pair
function pairLabel(pair: LanguagePair): string {
	return languagePairs.find((p) => p.value === pair)?.label ?? pair
}

/** 目标语言代码 / Target language code */
function targetLang(pair: LanguagePair): 'en' | 'ja' {
	// 以 en 结尾则目标为英文，否则为日文 / Ends with en → English target, else Japanese
	return pair.endsWith('en') ? 'en' : 'ja'
}

// 数值难度转文案 / Map numeric difficulty to label
function difficultyLabel(d: number): string {
	if (d === 1) return t('practice.diffEasy') // 简单 / Easy
	if (d === 2) return t('practice.diffMedium') // 中等 / Medium
	return t('practice.diffHard') // 困难 / Hard
}

// ---------- 场景选择 / Scenario selection ----------

// 计算场景显示文案 / Build the scenario display label
function scenarioDisplayLabel(s: ScenarioValue): string {
	// 随机场景 / Random scenario
	if (s.categoryId === 'random') return t('practice.scenarioRandom')
	// 查找大类 / Find the category
	const cat = SCENARIO_CATEGORIES.find((c) => c.id === s.categoryId)
	// 找不到则回退随机 / Fall back to random if missing
	if (!cat) return t('practice.scenarioRandom')
	// 大类标签 / Category label
	const catLabel = t(cat.labelKey)
	// 无子场景则仅大类 / No sub → category only
	if (!s.subId) return catLabel
	// 拼接子场景 / Append sub label
	const sub = cat.subScenarios.find((x) => x.id === s.subId)
	return sub ? `${catLabel} · ${t(sub.labelKey)}` : catLabel
}

// ---------- 本地偏好持久化 / Local preference persistence ----------

// 偏好存储结构 / Stored preference shape
interface StoredPreferences {
	pair?: LanguagePair
	difficulty?: PracticeDifficulty
	scenario?: ScenarioValue
}

// 从本地存储读取偏好 / Load preferences from local storage
function loadPreferences() {
	try {
		// 读取原始字符串 / Read raw string
		const raw = localStorage.getItem(STORAGE_KEY)
		// 无数据则返回 / Return if absent
		if (!raw) return
		// 解析 JSON / Parse JSON
		const parsed: StoredPreferences = JSON.parse(raw)
		// 回填语言对（校验合法）/ Restore pair if valid
		if (parsed.pair && languagePairs.some((p) => p.value === parsed.pair)) {
			selectedPair.value = parsed.pair
		}
		// 回填难度（校验合法）/ Restore difficulty if valid
		if (parsed.difficulty && PRACTICE_DIFFICULTIES.includes(parsed.difficulty)) {
			selectedDifficulty.value = parsed.difficulty
		}
		// 回填场景 / Restore scenario
		if (parsed.scenario) {
			selectedScenario.value = parsed.scenario
		}
	} catch {
		// 忽略解析失败 / Ignore parse errors
	}
}

// 将当前偏好写入本地存储 / Persist current preferences to local storage
function savePreferences() {
	try {
		// 组装偏好对象 / Build payload
		const payload: StoredPreferences = {
			pair: selectedPair.value,
			difficulty: selectedDifficulty.value,
			scenario: selectedScenario.value,
		}
		// 写入本地存储 / Write to local storage
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
	} catch {
		// 忽略写入失败 / Ignore write errors
	}
}

// 组件挂载后读取偏好 / Load preferences on mount
onMounted(() => {
	loadPreferences()
})

// ---------- 出题 / Generate question ----------

// 出题处理函数 / Generate handler
async function onGenerate() {
	// 防止重复点击 / Guard against duplicate clicks
	if (generating.value) return
	generating.value = true
	phase.value = 'generating'
	userAnswer.value = ''
	judgeResult.value = null
	savePreferences() // 持久化选择 / Persist selection

	try {
		// 调用出题接口 / Call the generate API
		const data = await $fetch<QuestionData>('/api/practice/generate', {
			method: 'POST',
			body: {
				languagePair: selectedPair.value,
				difficulty: selectedDifficulty.value,
				scenario: selectedScenario.value,
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
			toast.error(t('practice.noCredits'))
		} else if (err?.statusMessage) {
			toast.error(err.statusMessage)
		} else {
			toast.error(t('practice.generateError'))
		}
	} finally {
		// 结束生成 / Stop generating
		generating.value = false
	}
}

// ---------- 判题 / Judge answer ----------

// 判题处理函数 / Judge handler
async function onJudge() {
	// 守卫：判题中 / 空答案 / 无题目 / Guards: judging, empty answer, or no question
	if (judging.value || !userAnswer.value.trim() || !currentQuestion.value) return
	judging.value = true
	phase.value = 'judging'

	try {
		// 调用判题接口 / Call the judge API
		const data = await $fetch<JudgeResultData>('/api/practice/judge', {
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
		toast.error(err?.statusMessage || t('practice.judgeError'))
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