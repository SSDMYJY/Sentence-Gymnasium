<template>
  <ClientOnly>
    <UButton
      color="neutral"
      variant="ghost"
      size="sm"
      square
      class="theme-toggle-btn"
      :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggleTheme"
    />
    <template #fallback>
      <div class="theme-toggle-fallback" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
const { isDark, toggleTheme } = useTheme()
</script>

<style scoped>
.theme-toggle-btn {
  border: 1px solid var(--border-default) !important;
  color: var(--text-secondary) !important;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease;
}

.theme-toggle-btn:hover {
  border-color: var(--border-strong) !important;
  color: var(--text-primary) !important;
}

.theme-toggle-btn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent-color) 55%, transparent);
  outline-offset: 2px;
}

.theme-toggle-fallback {
  height: 2.25rem;
  width: 2.25rem;
  border: 1px solid var(--border-default);
}

@media (prefers-reduced-motion: reduce) {
  .theme-toggle-btn {
    transition: none;
  }
}
</style>
