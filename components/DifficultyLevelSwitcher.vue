<template>
	<!-- 难度选择外层容器 / Difficulty selector outer container -->
	<div class="mt-6">
		<!-- 难度标题标签 / Difficulty title label -->
		<label class="text-xs uppercase tracking-wide text-stone-500">{{ t(labelKey) }}</label>
		<!-- 四列网格排布各难度按钮 / Four-column grid of difficulty buttons -->
		<div class="mt-3 grid grid-cols-4 gap-3">
			<UButton
				v-for="d in PRACTICE_DIFFICULTIES"
				:key="d"
				variant="ghost"
				:class="[
					'rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors justify-start! items-start!',
					modelValue === d
						? 'border-accent bg-accent/10 text-accent-soft' // 选中态 / Selected
						: 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white', // 未选中 / Unselected
				]"
				@click="emit('update:modelValue', d)"
			>
				<!-- 按钮内文案：名称 + 描述 / Button content: name + description -->
				<span class="block w-full text-left">
					<span class="block">{{ difficultyOptionLabel(d) }}</span>
					<span class="mt-0.5 block text-xs font-normal text-stone-500">{{ difficultyOptionDesc(d) }}</span>
				</span>
			</UButton>
		</div>
	</div>
</template>

<script lang="ts" setup>
// 引入难度类型定义 / Import the difficulty type definition
import type { PracticeDifficulty } from '~/server/types/ai'
// 引入全部难度列表常量 / Import the list of all difficulties
import { PRACTICE_DIFFICULTIES } from '~/utils/practice-config'

// 组件 props 定义 / Component props definition
interface DifficultyLevelSwitcherProps {
	modelValue: PracticeDifficulty // 当前选中的难度 / Current selected difficulty
	lang: 'ja' | 'en' // 目标语言 / Target language
	labelKey?: string // 标题 i18n key / Title i18n key
}

// 使用默认值定义 props / Define props with defaults
const props = withDefaults(defineProps<DifficultyLevelSwitcherProps>(), {
	labelKey: 'practice.difficulty', // 默认难度标题 key / Default difficulty title key
})

// 定义更新事件 / Define the update event
const emit = defineEmits<{
	(e: 'update:modelValue', value: PracticeDifficulty): void
}>()

// 获取 i18n 翻译函数 / Obtain the i18n translate function
const { t } = useI18n()

// 返回某难度的显示名称 / Return the display label for a difficulty
function difficultyOptionLabel(value: PracticeDifficulty): string {
	// 拼接语言名后缀 / Build the language-name suffix
	const langName = props.lang === 'ja' ? t('practice.langJa') : t('practice.langEn')
	switch (value) {
		case 'random':
			return t('practice.diffRandom') // 随机 / Random
		case 'daily':
			return t('practice.diffDaily', { lang: langName }) // 日常（含语言）/ Daily with language
		case 'fluent':
			return t('practice.diffFluent', { lang: langName }) // 流利 / Fluent with language
		case 'professional':
			return t('practice.diffProfessional', { lang: langName }) // 专业 / Professional with language
	}
}

// 返回某难度的描述文本 / Return the description text for a difficulty
function difficultyOptionDesc(value: PracticeDifficulty): string {
	switch (value) {
		case 'random':
			return t('practice.diffRandomDesc') // 随机描述 / Random desc
		case 'daily':
			return t('practice.diffDailyDesc') // 日常描述 / Daily desc
		case 'fluent':
			return t('practice.diffFluentDesc') // 流利描述 / Fluent desc
		case 'professional':
			return t('practice.diffProfessionalDesc') // 专业描述 / Professional desc
	}
}
</script>