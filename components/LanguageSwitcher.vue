<template>
  <UDropdownMenu :items="dropdownItems" :content="{ align: 'end', side: 'bottom', sideOffset: 8 }">
    <UButton
      variant="ghost"
      size="sm"
      class="lang-switch-btn p-2"
      :aria-label="currentName"
    >
      <template #leading>
        <span class="leading-none">🌐</span>
      </template>
    </UButton>
    <template #item-trailing="{ item }">
      <UIcon v-if="item.code === locale" name="i-lucide-check" class="size-5 text-dimmed" />
    </template>
  </UDropdownMenu>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { locale, locales, setLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()

const currentName = computed(() => {
  const list = locales.value as Array<{ code: string; name: string }>
  return list.find((l) => l.code === locale.value)?.name ?? locale.value
})

const dropdownItems = computed<DropdownMenuItem[]>(() => {
  const list = locales.value as Array<{ code: string; name: string }>
  return list.map((l) => ({
    label: l.name,
    code: l.code,
    onSelect: () => onChange(l.code),
  }))
})

const onChange = async (code: string) => {
  if (code === locale.value) return
  const target = switchLocalePath(code as any)
  await setLocale(code as any)
  await navigateTo(target || route.fullPath)
}
</script>

<style scoped>
.lang-switch-btn {
  border: 1px solid var(--border-default) !important;
  color: var(--text-secondary) !important;
  transition: all 0.2s ease;
}
.lang-switch-btn:hover {
  border-color: var(--border-strong) !important;
  color: var(--text-primary) !important;
}
</style>
