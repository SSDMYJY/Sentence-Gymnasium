<template>
  <ClientOnly>
    <button
      class="relative flex h-9 w-9 items-center justify-center border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      :class="[
        isDark
          ? 'border-white/10 text-stone-300 hover:border-white/30 hover:text-white'
          : 'border-black/10 text-stone-600 hover:border-black/20 hover:text-stone-900',
      ]"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      type="button"
      @click="toggleTheme"
    >
      <span class="relative block h-5 w-5">
        <svg
          class="absolute inset-0 h-5 w-5 transition-all duration-300"
          :class="isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
        <svg
          class="absolute inset-0 h-5 w-5 transition-all duration-300"
          :class="isLight ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </span>
    </button>
    <template #fallback>
      <div class="h-9 w-9" />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
const { isDark, isLight, toggleTheme } = useTheme()
</script>
