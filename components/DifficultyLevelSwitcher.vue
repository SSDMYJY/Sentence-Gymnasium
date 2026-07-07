<template>
	<div class="mt-6">
		<label class="text-xs uppercase tracking-wide text-stone-500">{{ t(labelKey) }}</label>
		<div class="mt-3 grid grid-cols-4 gap-3">
			<button v-for="d in PRACTICE_DIFFICULTIES" :key="d" type="button" :class="[
				'rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors',
				modelValue === d
					? 'border-accent bg-accent/10 text-accent-soft'
					: 'border-white/10 text-stone-400 hover:border-white/30 hover:text-white',
			]" @click="emit('update:modelValue', d)">
				<span class="block">{{ difficultyOptionLabel(d) }}</span>
				<span class="mt-0.5 block text-xs font-normal text-stone-500">{{ difficultyOptionDesc(d) }}</span>
			</button>
		</div>
	</div>
</template>

<script lang="ts" setup>
import type { PracticeDifficulty } from '~/server/types/ai'
import { PRACTICE_DIFFICULTIES } from '~/utils/practice-config'

interface DifficultyLevelSwitcherProps {
	modelValue: PracticeDifficulty
	lang: 'ja' | 'en'
	labelKey?: string
}

const props = withDefaults(defineProps<DifficultyLevelSwitcherProps>(), {
	labelKey: 'practice.difficulty',
})

const emit = defineEmits<{
	(e: 'update:modelValue', value: PracticeDifficulty): void
}>()

const { t } = useI18n()

function difficultyOptionLabel(value: PracticeDifficulty): string {
	const langName = props.lang === 'ja' ? t('practice.langJa') : t('practice.langEn')
	switch (value) {
		case 'random':
			return t('practice.diffRandom')
		case 'daily':
			return t('practice.diffDaily', { lang: langName })
		case 'fluent':
			return t('practice.diffFluent', { lang: langName })
		case 'professional':
			return t('practice.diffProfessional', { lang: langName })
	}
}

function difficultyOptionDesc(value: PracticeDifficulty): string {
	switch (value) {
		case 'random':
			return t('practice.diffRandomDesc')
		case 'daily':
			return t('practice.diffDailyDesc')
		case 'fluent':
			return t('practice.diffFluentDesc')
		case 'professional':
			return t('practice.diffProfessionalDesc')
	}
}
</script>