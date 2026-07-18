<template>
  <!-- 语言切换下拉菜单，右对齐、底部弹出 / Language switch dropdown menu, right-aligned and bottom-anchored -->
  <UDropdownMenu :items="dropdownItems" :content="{ align: 'end', side: 'bottom', sideOffset: 8 }">
    <!-- 触发按钮：显示地球图标 / Trigger button showing a globe icon -->
    <UButton variant="ghost" size="sm" square class="lang-switch-btn p-1.5" :aria-label="currentName">
      <!-- 前置插槽：地球 emoji / Leading slot: globe emoji -->
      <template #leading>
        <span class="leading-none">🌐</span>
      </template>
    </UButton>
    <!-- 每项右侧尾缀：当前语言打勾 / Trailing slot per item: check mark on active locale -->
    <template #item-trailing="{ item }">
      <UIcon v-if="item.code === locale" name="i-lucide-check" class="size-5 text-dimmed" />
    </template>
  </UDropdownMenu>
</template>

<script setup lang="ts">
// 引入下拉菜单项类型定义 / Import the dropdown menu item type definition
import type { DropdownMenuItem } from '@nuxt/ui'

// 解构 i18n 的当前语言、语言列表与切换方法 / Destructure current locale, locales list, and setLocale from i18n
const { locale, locales, setLocale } = useI18n()
// 获取切换语言后对应路径的工具 / Obtain the helper that maps a locale to its routed path
const switchLocalePath = useSwitchLocalePath()
// 获取当前路由对象 / Obtain the current route object
const route = useRoute()

// 计算属性：当前语言的显示名称 / Computed: the display name of the current locale
const currentName = computed(() => {
  // 将 locales 断言为含 code/name 的数组 / Cast locales to an array of { code, name }
  const list = locales.value as Array<{ code: string; name: string }>
  // 找到当前语言并返回名称，找不到则回退到 code / Find current locale's name, fall back to its code
  return list.find((l) => l.code === locale.value)?.name ?? locale.value
})

// 计算属性：构建下拉菜单项数组 / Computed: build the dropdown menu items array
const dropdownItems = computed<DropdownMenuItem[]>(() => {
  // 将 locales 断言为含 code/name 的数组 / Cast locales to an array of { code, name }
  const list = locales.value as Array<{ code: string; name: string }>
  // 映射为每个语言一个菜单项，点击时切换语言 / Map each locale to a menu item that switches locale on select
  return list.map((l) => ({
    label: l.name, // 显示名称 / Display name
    code: l.code, // 语言代码 / Locale code
    onSelect: () => onChange(l.code), // 选中时触发切换 / Trigger switch on select
  }))
})

// 切换语言的处理函数 / Handler to switch to a given locale
const onChange = async (code: string) => {
  // 若目标即当前语言则不做处理 / No-op if target equals current locale
  if (code === locale.value) return
  // 计算目标语言的本地化路径 / Compute the localized path for the target locale
  const target = switchLocalePath(code as any)
  // 更新 i18n 语言 / Update the i18n locale
  await setLocale(code as any)
  // 跳转到对应本地化路径（失败则用当前完整路径）/ Navigate to the localized path, falling back to current full path
  await navigateTo(target || route.fullPath)
}
</script>

<style scoped>
/* 语言切换按钮基础样式 / Base styling for the language switch button */
.lang-switch-btn {
  border: 1px solid var(--border-default) !important;
  color: var(--text-secondary) !important;
  transition: all 0.2s ease;
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  min-height: 32px !important;
  padding: 0 !important;
}

/* 悬停时强化边框与文字颜色 / Strengthen border and text color on hover */
.lang-switch-btn:hover {
  border-color: var(--border-strong) !important;
  color: var(--text-primary) !important;
}
</style>