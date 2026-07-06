<template>
  <Listbox v-model="selectedKey" as="div" class="relative">
    <ListboxButton
      class="group inline-flex w-full items-center justify-between rounded-lg border border-white/10 bg-ink-900/50 px-4 py-3 text-left text-sm font-medium text-stone-200 transition-colors hover:border-white/30 focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
      :aria-label="selectedLabel"
    >
      <span class="flex min-w-0 items-center gap-3">
        <svg class="h-4 w-4 shrink-0 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M3 4l5 5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="truncate">{{ selectedLabel }}</span>
      </span>
      <svg
        class="h-4 w-4 shrink-0 text-stone-500 transition-transform group-data-[headlessui-state=open]:rotate-180"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </ListboxButton>

    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 -translate-y-2 scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-2 scale-[0.98]"
    >
      <ListboxOptions
        class="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-ink-800/95 shadow-2xl backdrop-blur-md focus:outline-none"
      >
        <div
          class="flex h-7 items-center justify-center border-b border-white/5 text-stone-500 transition-colors hover:bg-white/5 hover:text-stone-300"
          @mouseenter="startArrowScroll(-1)"
          @mouseleave="stopArrowScroll"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m18 15-6-6-6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>

        <div
          ref="viewportRef"
          class="dropdown-viewport max-h-80 overflow-y-auto p-1"
          @wheel.prevent="onWheel"
        >
          <ListboxOption v-slot="{ active, selected }" value="random" as="template">
            <li
              class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm transition-colors"
              :class="active ? 'bg-white/5 text-white' : 'text-stone-300'"
            >
              <span class="truncate" :class="selected ? 'text-accent-soft' : ''">{{ t('practice.scenarioRandom') }}</span>
              <span v-if="selected" class="absolute right-3 text-accent-soft">✓</span>
            </li>
          </ListboxOption>

          <div
            v-for="(category, catIndex) in categories"
            :key="category.id"
            class="mt-1 border-t border-white/5 first:mt-0 first:border-t-0"
          >
            <div class="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-stone-600">
              {{ catIndex + 1 }}. {{ category.label }}
            </div>

            <ListboxOption
              v-for="(sub, subIndex) in category.subScenarios"
              :key="sub.id"
              v-slot="{ active, selected }"
              :value="buildOptionKey(category.id, sub.id)"
              as="template"
            >
              <li
                class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm transition-colors"
                :class="[
                  active ? 'bg-white/5 text-white' : 'text-stone-400',
                  selected ? 'bg-accent/10 text-accent-soft' : '',
                ]"
              >
                <span class="truncate">{{ catIndex + 1 }}.{{ subIndex + 1 }} {{ sub.label }}</span>
                <span v-if="selected" class="absolute right-3 text-accent-soft">✓</span>
              </li>
            </ListboxOption>
          </div>
        </div>

        <div
          class="flex h-7 items-center justify-center border-t border-white/5 text-stone-500 transition-colors hover:bg-white/5 hover:text-stone-300"
          @mouseenter="startArrowScroll(1)"
          @mouseleave="stopArrowScroll"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </ListboxOptions>
    </Transition>
  </Listbox>
</template>

<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
import type { ScenarioValue } from '~/server/types/ai'
import { RANDOM_SCENARIO, SCENARIO_CATEGORIES } from '~/utils/practice-config'

const props = defineProps<{
  modelValue: ScenarioValue
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ScenarioValue): void
}>()

const { t } = useI18n()
const viewportRef = ref<HTMLElement | null>(null)

const ARROW_SCROLL_STEP = 6
const ARROW_SCROLL_INTERVAL = 16
let arrowScrollTimer: ReturnType<typeof setInterval> | null = null

function stopArrowScroll() {
  if (arrowScrollTimer) {
    clearInterval(arrowScrollTimer)
    arrowScrollTimer = null
  }
}

function startArrowScroll(direction: -1 | 1) {
  stopArrowScroll()
  const viewport = viewportRef.value
  if (!viewport) return

  arrowScrollTimer = setInterval(() => {
    viewport.scrollTop += direction * ARROW_SCROLL_STEP
  }, ARROW_SCROLL_INTERVAL)
}

function onWheel(event: WheelEvent) {
  const viewport = viewportRef.value
  if (!viewport) return
  viewport.scrollTop += event.deltaY
}

function buildOptionKey(categoryId: string, subId: string): string {
  return `${categoryId}:${subId}`
}

function parseOptionKey(value: string): ScenarioValue {
  if (value === 'random') return { ...RANDOM_SCENARIO }
  const [categoryId, subId] = value.split(':')
  return { categoryId, subId }
}

const selectedKey = computed<string>({
  get() {
    if (props.modelValue.categoryId === 'random') return 'random'
    if (!props.modelValue.subId) return 'random'
    return buildOptionKey(props.modelValue.categoryId, props.modelValue.subId)
  },
  set(value) {
    emit('update:modelValue', parseOptionKey(value))
  },
})

const categories = computed(() =>
  SCENARIO_CATEGORIES.map((category) => ({
    ...category,
    label: t(category.labelKey),
    subScenarios: category.subScenarios.map((sub) => ({
      ...sub,
      label: t(sub.labelKey),
    })),
  })),
)

const selectedLabel = computed(() => {
  if (props.modelValue.categoryId === 'random') return t('practice.scenarioRandom')
  const category = categories.value.find((item) => item.id === props.modelValue.categoryId)
  if (!category) return t('practice.scenarioRandom')
  const sub = category.subScenarios.find((item) => item.id === props.modelValue.subId)
  return sub ? sub.label : category.label
})

onUnmounted(() => {
  stopArrowScroll()
})
</script>

<style scoped>
/* 统一隐藏滚动条，保留滚动行为 */
.dropdown-viewport::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.dropdown-viewport {
  scrollbar-width: none;
}
</style>
