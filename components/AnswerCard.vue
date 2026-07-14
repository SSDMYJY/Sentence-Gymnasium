<script setup lang="ts">
/**
 * 可复用答题组件 / Reusable answer-card component
 * 统一管理 practice / grammar / paraphrase 三个页面的答题区域 UI / Unifies the answer UI for practice / grammar / paraphrase pages
 */

// 判题结果的数据结构 / Data structure of a judging result
interface JudgeResult {
  isCorrect: boolean // 是否完全正确 / Whether fully correct
  score: number // 得分（满分 10）/ Score out of 10
  verdict: 'correct' | 'partial' | 'incorrect' // 判定等级 / Verdict level
  feedback: string // 反馈文本 / Feedback text
  suggestion: string | null // 改进建议（可为空）/ Improvement suggestion (nullable)
  errors: string[] // 错误点列表 / List of error points
  correctAnswer: string // 参考答案 / Reference answer
  [key: string]: unknown // 允许额外字段 / Allow extra fields
}

// 结果区标签的 i18n key 集合 / i18n keys for the result-section labels
interface ResultLabels {
  question: string // 题目标签 key / Question label key
  yourAnswer: string // 你的答案标签 key / Your-answer label key
  reference: string // 参考答案标签 key / Reference label key
}

// 组件 props 定义（含默认值）/ Component props definition (with defaults)
const props = withDefaults(defineProps<{
  /** 用户答案（v-model）/ User answer (v-model) */
  modelValue: string
  /** 当前题目文本 / Current question text */
  questionText: string
  /** 是否正在判题 / Whether judging is in progress */
  judging?: boolean
  /** 判题结果 / Judging result */
  judgeResult?: JudgeResult | null
  /** textarea 行数 / Textarea row count */
  rows?: number
  /** 输入框占位文本 / Placeholder text */
  placeholder?: string
  /** 结果区标签 / Result section labels */
  resultLabels?: ResultLabels
  /** 提交按钮文本 / Submit button text */
  submitLabel?: string
  /** 判题中按钮文本 / Button text while judging */
  judgingLabel?: string
  /** 提交快捷键提示 / Submit shortcut hint */
  submitHint?: string
  /** 你的答案 label / Your-answer label */
  yourAnswerLabel?: string
  /** 反馈标题 / Feedback title */
  feedbackLabel?: string
  /** 错误列表标题 / Errors list title */
  errorsLabel?: string
  /** 建议标题 / Suggestion title */
  suggestionLabel?: string
  /** 下一题按钮文本 / Next-question button text */
  nextButtonLabel?: string
  /** 返回设置按钮文本 / Back-to-settings button text */
  backButtonLabel?: string
  /** 是否将"下一题"按钮放在前面（grammar 为 true）/ Whether to put "next" first (true for grammar) */
  nextFirst?: boolean
  /** 是否禁止剪贴板操作（practice 为 true）/ Whether to restrict clipboard (true for practice) */
  restrictClipboard?: boolean
}>(), {
  judging: false, // 默认非判题中 / Default not judging
  judgeResult: null, // 默认无结果 / Default no result
  rows: 4, // 默认 4 行 / Default 4 rows
  placeholder: '', // 默认无占位 / Default empty placeholder
  resultLabels: () => ({ // 默认结果标签 key / Default result label keys
    question: 'practice.question',
    yourAnswer: 'practice.yourAnswer',
    reference: 'practice.referenceAnswer',
  }),
  submitLabel: 'practice.submit', // 默认提交文案 key / Default submit label key
  judgingLabel: 'practice.judging', // 默认判题中文案 key / Default judging label key
  submitHint: '', // 默认无快捷键提示 / Default empty hint
  yourAnswerLabel: 'practice.yourAnswer', // 默认你的答案 key / Default your-answer key
  feedbackLabel: 'practice.feedback', // 默认反馈 key / Default feedback key
  errorsLabel: 'practice.errors', // 默认错误 key / Default errors key
  suggestionLabel: 'practice.suggestion', // 默认建议 key / Default suggestion key
  nextButtonLabel: 'practice.nextQuestion', // 默认下一题 key / Default next key
  backButtonLabel: 'practice.backToSettings', // 默认返回 key / Default back key
  nextFirst: false, // 默认下一题不前置 / Default next not first
  restrictClipboard: true, // 默认限制剪贴板 / Default restrict clipboard
})

// 组件事件定义 / Component event definitions
const emit = defineEmits<{
  'update:modelValue': [value: string] // 更新答案 / Update answer
  /** 提交判题 / Submit for judging */
  submit: []
  /** 下一题 / Next question */
  next: []
  /** 返回设置 / Back to settings */
  back: []
}>()

// 获取 i18n 翻译函数 t / Obtain the i18n translate function `t`
const { t } = useI18n()

// 答案的双向绑定计算属性 / Two-way binding computed for the answer
const answer = computed({
  get: () => props.modelValue, // 读取时返回 modelValue / Read from modelValue
  set: (v: string) => emit('update:modelValue', v), // 写入时向父级 emit / Emit update on write
})

// 是否存在判题结果 / Whether a judge result exists
const hasResult = computed(() => !!props.judgeResult)
// 是否处于答题阶段（未判题且无结果）/ Whether in the answering phase (not judging, no result)
const showAnswering = computed(() => !props.judging && !hasResult.value)
// 是否正在判题 / Whether judging is in progress
const showJudging = computed(() => props.judging)
// 是否展示结果 / Whether to show the result
const showResult = computed(() => hasResult.value)

// 根据判定等级返回对应文案 / Map verdict level to its label
function verdictLabel(v: string): string {
  if (v === 'correct') return t('practice.verdictCorrect') // 正确 / Correct
  if (v === 'partial') return t('practice.verdictPartial') // 部分正确 / Partial
  return t('practice.verdictIncorrect') // 错误 / Incorrect
}

// Bookmark state
const bookmarked = ref(false)
const bookmarking = ref(false)

async function onBookmark() {
  if (bookmarking.value || bookmarked.value) return
  bookmarking.value = true
  try {
    // Extract first meaningful word from correct answer or question text
    const raw = props.judgeResult?.correctAnswer || props.questionText
    const word = raw.split(/\s+/)[0]?.replace(/[^a-zA-Z\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]/g, '').trim() || raw
    await $fetch('/api/bookmarks', {
      method: 'POST',
      body: {
        word,
        sentence: props.questionText,
        sourceLang: 'en',
        category: 'vocabulary',
      },
    })
    bookmarked.value = true
  } catch {
    // Already bookmarked or error - silently ignore
    bookmarked.value = true
  } finally {
    bookmarking.value = false
  }
}
</script>

<template>
  <!-- 判题加载 / Judging spinner -->
  <div v-if="showJudging" class="rounded-2xl border border-white/10 bg-ink-900/50 p-12 text-center">
    <!-- 转圈加载图标 / Spinning loader icon -->
    <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
    <!-- 判题中提示文案 / Judging hint text -->
    <p class="mt-4 text-sm text-stone-400">{{ t(judgingLabel) }}</p>
  </div>

  <!-- 判题结果 / Judging result -->
  <div v-else-if="showResult && judgeResult" class="space-y-6">
    <!-- 结果概览 / Result overview -->
    <div :class="[
      'rounded-2xl border p-6',
      judgeResult.isCorrect
        ? 'border-green-500/30 bg-green-500/5' // 全对：绿色 / All correct: green
        : judgeResult.verdict === 'partial'
          ? 'border-yellow-500/30 bg-yellow-500/5' // 部分：黄色 / Partial: yellow
          : 'border-red-500/30 bg-red-500/5', // 错误：红色 / Incorrect: red
    ]">
      <!-- 图标与得分 / Icon and score -->
      <div class="flex items-center gap-4">
        <span class="text-4xl">
          {{ judgeResult.isCorrect ? '✓' : judgeResult.verdict === 'partial' ? '◐' : '✗' }}
        </span>
        <div>
          <!-- 判定等级文案 / Verdict label -->
          <p class="font-display text-xl font-bold text-stone-100">
            {{ verdictLabel(judgeResult.verdict) }}
          </p>
          <!-- 得分 / Score -->
          <p class="text-sm text-stone-400">{{ judgeResult.score }} / 10</p>
        </div>
      </div>
    </div>

    <!-- 题目 + 答案回顾 / Question + answer review -->
    <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
      <div class="space-y-4">
        <div>
          <!-- 题目标签 / Question label -->
          <p class="text-xs uppercase tracking-wide text-stone-500">{{ t(resultLabels.question) }}</p>
          <!-- 题目文本 / Question text -->
          <p class="mt-1 text-stone-200">{{ questionText }}</p>
        </div>
        <div>
          <!-- 你的答案标签 / Your-answer label -->
          <p class="text-xs uppercase tracking-wide text-stone-500">{{ t(resultLabels.yourAnswer) }}</p>
          <!-- 用户作答内容 / User's answer -->
          <p class="mt-1 text-stone-200">{{ modelValue }}</p>
        </div>
        <div>
          <!-- 参考答案标签 / Reference label -->
          <p class="text-xs uppercase tracking-wide text-stone-500">{{ t(resultLabels.reference) }}</p>
          <!-- 参考答案内容 / Reference answer -->
          <p class="mt-1 text-accent-soft">{{ judgeResult.correctAnswer }}</p>
        </div>
      </div>
    </div>

    <!-- 结果区额外内容（如 grammar 的 explanation）/ Extra result slot (e.g. grammar explanation) -->
    <slot name="result-extra" />

    <!-- 收藏按钮 / Bookmark button -->
    <div class="flex justify-end">
      <UButton
        variant="ghost"
        size="sm"
        class="text-stone-400 hover:text-yellow-400 transition-colors"
        :disabled="bookmarking"
        @click="onBookmark"
      >
        <span :class="bookmarked ? 'text-yellow-400' : ''">🔖</span>
        <span class="ml-1 text-xs">{{ bookmarked ? t('bookmarks.saved') : t('bookmarks.save') }}</span>
      </UButton>
    </div>

    <!-- AI 反馈 / AI feedback -->
    <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
      <!-- 反馈标题 / Feedback heading -->
      <h3 class="text-sm font-semibold text-stone-300">{{ t(feedbackLabel) }}</h3>
      <!-- 反馈正文 / Feedback body -->
      <p class="mt-3 text-sm leading-relaxed text-stone-300">{{ judgeResult.feedback }}</p>

      <!-- 错误列表 / Errors list -->
      <div v-if="judgeResult.errors?.length" class="mt-4">
        <!-- 错误列表标题 / Errors heading -->
        <p class="text-xs uppercase tracking-wide text-stone-500">{{ t(errorsLabel) }}</p>
        <ul class="mt-2 space-y-1">
          <!-- 逐条渲染错误 / Render each error -->
          <li v-for="(err, i) in judgeResult.errors" :key="i"
            class="flex items-start gap-2 text-sm text-stone-400">
            <span class="mt-0.5 text-red-400">·</span>
            <span>{{ err }}</span>
          </li>
        </ul>
      </div>

      <!-- 改进建议 / Suggestion -->
      <div v-if="judgeResult.suggestion" class="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
        <!-- 建议标题 / Suggestion heading -->
        <p class="text-xs uppercase tracking-wide text-accent-soft">{{ t(suggestionLabel) }}</p>
        <!-- 建议内容 / Suggestion body -->
        <p class="mt-1 text-sm text-stone-200">{{ judgeResult.suggestion }}</p>
      </div>
    </div>

    <!-- 操作按钮 / Action buttons -->
    <div class="flex gap-3">
      <!-- nextFirst 模式下先展示下一题 / When nextFirst, show "next" first -->
      <template v-if="nextFirst">
        <UButton class="flex-1 bg-white text-ink-950 hover:bg-stone-100" @click="emit('next')">
          {{ t(nextButtonLabel) }}
        </UButton>
        <UButton variant="outline"
          class="flex-1 border-white/15 text-stone-300 hover:border-white/30 hover:text-white" @click="emit('back')">
          {{ t(backButtonLabel) }}
        </UButton>
      </template>
      <!-- 默认模式先展示返回设置 / Default: show "back" first -->
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

  <!-- 答题阶段 / Answering phase -->
  <div v-else-if="showAnswering" class="space-y-6">
    <!-- 题目卡片 / Question card -->
    <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
      <!-- 题目元信息插槽 / Question-meta slot -->
      <slot name="question-meta" />
      <!-- 题目文本 / Question text -->
      <p class="mt-6 font-display text-xl font-medium leading-relaxed text-stone-100">
        {{ questionText }}
      </p>
      <!-- 题目额外内容插槽 / Question-extra slot -->
      <slot name="question-extra" />
    </div>

    <!-- 作答区 / Answer area -->
    <div class="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
      <!-- 你的答案标签 / Your-answer label -->
      <label class="block text-xs uppercase tracking-wide text-stone-500">{{ t(yourAnswerLabel) }}</label>
      <!-- 作答提示插槽 / Answer-hint slot -->
      <slot name="answer-hint" />
      <!-- 多行输入框 / Multi-line textarea -->
      <UTextarea v-model="answer" :rows="rows" :placeholder="placeholder" :disabled="judging" :ui="{
        root: 'w-full',
        wrapper: 'mt-3',
        textarea: 'w-full resize-none border-white/10 bg-ink-950 text-stone-100 placeholder-stone-600 focus:border-accent focus:ring-accent/30 select-none',
      }" @keydown.meta.enter="emit('submit')" @keydown.ctrl.enter="emit('submit')"
        @paste="restrictClipboard ? $event.preventDefault() : undefined"
        @copy="restrictClipboard ? $event.preventDefault() : undefined"
        @cut="restrictClipboard ? $event.preventDefault() : undefined"
        @contextmenu="restrictClipboard ? $event.preventDefault() : undefined" />
      <!-- 提交行：快捷键提示 + 提交按钮 / Submit row: shortcut hint + submit button -->
      <div class="mt-3 flex items-center justify-between">
        <span class="text-xs text-stone-600">⌘/Ctrl + Enter {{ t(submitHint) }}</span>
        <!-- 判题中或无内容时禁用提交 / Disabled while judging or empty -->
        <UButton :loading="judging || !answer.trim()" :disabled="judging || !answer.trim()"
          class="bg-white text-ink-950 hover:bg-stone-100" @click="emit('submit')">
          {{ judging ? t(judgingLabel) : t(submitLabel) }}
        </UButton>
      </div>
    </div>
  </div>
</template>