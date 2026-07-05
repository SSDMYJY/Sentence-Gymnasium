<template>
  <Menu as="div" class="relative">
    <MenuButton
      v-slot="{ open }"
      class="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-stone-300 transition-colors hover:border-white/30 hover:text-white"
    >
      <span class="leading-none">🌐</span>
      <span class="font-medium">{{ currentName }}</span>
      <span
        :class="['text-stone-500 transition-transform duration-200', open ? 'rotate-180' : '']"
      >▾</span>
    </MenuButton>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <MenuItems
        class="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-white/10 bg-ink-800/95 p-1 shadow-xl backdrop-blur-md focus:outline-none"
      >
        <MenuItem v-for="l in locales" :key="l.code" v-slot="{ active }">
          <button
            type="button"
            :class="[
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
              active ? 'bg-white/5 text-white' : 'text-stone-300',
              l.code === locale ? 'text-accent-soft' : '',
            ]"
            @click="setLocale(l.code)"
          >
            <span>{{ l.name }}</span>
            <span v-if="l.code === locale" class="text-xs">✓</span>
          </button>
        </MenuItem>
      </MenuItems>
    </Transition>
  </Menu>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'

const { locale, locales, setLocale } = useI18n()

const currentName = computed(() => {
  const list = locales.value as Array<{ code: string; name: string }>
  return list.find((l) => l.code === locale.value)?.name ?? locale.value
})
</script>
