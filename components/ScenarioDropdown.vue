<template>
  <!-- 场景选择下拉组件（基于 Headless UI Listbox）/ Scenario-select dropdown built on Headless UI Listbox -->
  <Listbox v-model="selectedKey" as="div" class="relative">
    <!-- 触发按钮 / Trigger button -->
    <ListboxButton
      class="group inline-flex w-full items-center justify-between rounded-lg border border-white/10 bg-ink-900/50 px-4 py-3 text-left text-sm font-medium text-stone-200 transition-colors hover:border-white/30 focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
      :aria-label="selectedLabel"
    >
      <!-- 左侧图标与当前选中标签 / Left icon and current selected label -->
      <span class="flex min-w-0 items-center gap-3">
        <svg class="h-4 w-4 shrink-0 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M3 4l5 5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="truncate">{{ selectedLabel }}</span>
      </span>
      <!-- 右侧展开箭头 / Right chevron -->
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

    <!-- 展开/收起过渡动画 / Open/close transition -->
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 -translate-y-2 scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-2 scale-[0.98]"
    >
      <!-- 下拉选项面板 / Dropdown panel -->
      <ListboxOptions
        class="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-ink-800/95 shadow-2xl backdrop-blur-md focus:outline-none"
      >
        <!-- 向上滚动热区 / Upward scroll hot-zone -->
        <div
          class="flex h-7 items-center justify-center border-b border-white/5 text-stone-500 transition-colors hover:bg-white/5 hover:text-stone-300"
          @mouseenter="startArrowScroll(-1)"
          @mouseleave="stopArrowScroll"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m18 15-6-6-6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>

        <!-- 可滚动视口 / Scrollable viewport -->
        <div
          ref="viewportRef"
          class="dropdown-viewport max-h-80 overflow-y-auto p-1"
          @wheel.prevent="onWheel"
        >
          <!-- 随机场景选项 / Random scenario option -->
          <ListboxOption v-slot="{ active, selected }" value="random" as="template">
            <li
              class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm transition-colors"
              :class="active ? 'bg-white/5 text-white' : 'text-stone-300'"
            >
              <span class="truncate" :class="selected ? 'text-accent-soft' : ''">{{ t('practice.scenarioRandom') }}</span>
              <span v-if="selected" class="absolute right-3 text-accent-soft">✓</span>
            </li>
          </ListboxOption>

          <!-- 各场景大类及其子场景 / Each category and its sub-scenarios -->
          <div
            v-for="(category, catIndex) in categories"
            :key="category.id"
            class="mt-1 border-t border-white/5 first:mt-0 first:border-t-0"
          >
            <!-- 大类标题 / Category heading -->
            <div class="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-stone-600">
              {{ catIndex + 1 }}. {{ category.label }}
            </div>

            <!-- 子场景选项 / Sub-scenario options -->
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

        <!-- 向下滚动热区 / Downward scroll hot-zone -->
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
// 引入 Headless UI 的 Listbox 相关组件 / Import Headless UI Listbox components
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
// 引入场景值类型 / Import the scenario value type
import type { ScenarioValue } from '~/server/types/ai'
// 引入随机场景与场景大类数据 / Import random scenario and category data
import { RANDOM_SCENARIO, SCENARIO_CATEGORIES } from '~/utils/practice-config'

// 定义 props：当前选中的场景值 / Define props: the currently selected scenario value
const props = defineProps<{
  modelValue: ScenarioValue
}>()

// 定义更新事件 / Define the update event
const emit = defineEmits<{
  (e: 'update:modelValue', value: ScenarioValue): void
}>()

// 获取 i18n 翻译函数 / Obtain the i18n translate function
const { t } = useI18n()
// 下拉视口的 DOM 引用 / DOM ref to the dropdown viewport
const viewportRef = ref<HTMLElement | null>(null)

// 箭头滚动步长（像素）/ Arrow-scroll step in pixels
const ARROW_SCROLL_STEP = 6
// 箭头滚动间隔（毫秒）/ Arrow-scroll interval in ms
const ARROW_SCROLL_INTERVAL = 16
// 箭头滚动定时器 / Arrow-scroll timer handle
let arrowScrollTimer: ReturnType<typeof setInterval> | null = null

// 停止箭头自动滚动 / Stop the arrow auto-scroll
function stopArrowScroll() {
  // 若存在定时器则清除 / Clear the timer if present
  if (arrowScrollTimer) {
    clearInterval(arrowScrollTimer)
    arrowScrollTimer = null
  }
}

// 启动箭头自动滚动 / Start the arrow auto-scroll
function startArrowScroll(direction: -1 | 1) {
  // 先停止已有滚动 / Stop any existing scroll first
  stopArrowScroll()
  // 获取视口 DOM / Get the viewport element
  const viewport = viewportRef.value
  // 没有视口则返回 / Return if no viewport
  if (!viewport) return

  // 按方向定时滚动 / Scroll on a timer in the given direction
  arrowScrollTimer = setInterval(() => {
    viewport.scrollTop += direction * ARROW_SCROLL_STEP
  }, ARROW_SCROLL_INTERVAL)
}

// 鼠标滚轮滚动处理 / Mouse-wheel scroll handler
function onWheel(event: WheelEvent) {
  // 获取视口 DOM / Get the viewport element
  const viewport = viewportRef.value
  // 没有视口则返回 / Return if no viewport
  if (!viewport) return
  // 按滚动增量移动 / Move scroll position by deltaY
  viewport.scrollTop += event.deltaY
}

// 由大类与子场景 id 拼接选项 key / Build an option key from category and sub ids
function buildOptionKey(categoryId: string, subId: string): string {
  // 用冒号连接两者 / Join with a colon
  return `${categoryId}:${subId}`
}

// 由选项 key 解析回场景值 / Parse an option key back into a scenario value
function parseOptionKey(value: string): ScenarioValue {
  // 随机选项直接返回随机场景 / Random option returns the random scenario
  if (value === 'random') return { ...RANDOM_SCENARIO }
  // 拆解 key 为两部分 / Split the key into parts
  const [categoryId, subId] = value.split(':')
  // 返回对应场景值 / Return the matching scenario value
  return { categoryId, subId }
}

// 当前选项的 key（双向绑定）/ The key of the current selection (two-way bound)
const selectedKey = computed<string>({
  get() {
    // 随机或无子场景时返回 'random' / Random or no sub-id → 'random'
    if (props.modelValue.categoryId === 'random') return 'random'
    if (!props.modelValue.subId) return 'random'
    // 否则拼接 key / Otherwise build the key
    return buildOptionKey(props.modelValue.categoryId, props.modelValue.subId)
  },
  set(value) {
    // 变更时 emit 解析后的场景值 / Emit the parsed scenario value on change
    emit('update:modelValue', parseOptionKey(value))
  },
})

// 翻译后的场景大类列表 / Translated category list
const categories = computed(() =>
  // 为每个大类及其子场景补充翻译后的 label / Add translated labels to each category and sub
  SCENARIO_CATEGORIES.map((category) => ({
    ...category,
    label: t(category.labelKey), // 大类标签 / Category label
    subScenarios: category.subScenarios.map((sub) => ({
      ...sub,
      label: t(sub.labelKey), // 子场景标签 / Sub label
    })),
  })),
)

// 当前选中项的展示文案 / Display text of the current selection
const selectedLabel = computed(() => {
  // 随机场景返回随机文案 / Random → random label
  if (props.modelValue.categoryId === 'random') return t('practice.scenarioRandom')
  // 查找对应大类 / Find the matching category
  const category = categories.value.find((item) => item.id === props.modelValue.categoryId)
  // 找不到则回退随机 / Fall back to random if missing
  if (!category) return t('practice.scenarioRandom')
  // 查找子场景 / Find the sub-scenario
  const sub = category.subScenarios.find((item) => item.id === props.modelValue.subId)
  // 有子场景用子场景名，否则用大类名 / Use sub label if present, else category label
  return sub ? sub.label : category.label
})

// 组件卸载时清理滚动定时器 / Clean up the scroll timer on unmount
onUnmounted(() => {
  stopArrowScroll()
})
</script>

<style scoped>
/* 统一隐藏滚动条，保留滚动行为 / Hide scrollbar while keeping scroll behavior */
.dropdown-viewport::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.dropdown-viewport {
  scrollbar-width: none;
}
</style>