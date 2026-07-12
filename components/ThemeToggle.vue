<template>
  <!-- 仅在客户端渲染该按钮，避免 SSR 闪烁 / Render only on client to avoid SSR hydration mismatch -->
  <ClientOnly>
    <!-- 主题切换按钮：暗色显示月亮图标，亮色显示太阳图标 / Theme toggle button: moon icon in dark mode, sun icon in light mode -->
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
    <!-- 客户端渲染前的占位元素 / Fallback placeholder before client mount -->
    <template #fallback>
      <div class="theme-toggle-fallback" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
// 从 useTheme 组合式函数解构出暗色状态与切换方法 / Destructure dark-mode state and toggle method from the useTheme composable
const { isDark, toggleTheme } = useTheme()
</script>

<style scoped>
/* 主题切换按钮的基础样式 / Base styling for the theme toggle button */
.theme-toggle-btn {
  border: 1px solid var(--border-default) !important;
  color: var(--text-secondary) !important;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease;
}

/* 悬停时强化边框与文字颜色 / Strengthen border and text color on hover */
.theme-toggle-btn:hover {
  border-color: var(--border-strong) !important;
  color: var(--text-primary) !important;
}

/* 键盘聚焦时的可见描边 / Visible outline when focused via keyboard */
.theme-toggle-btn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent-color) 55%, transparent);
  outline-offset: 2px;
}

/* 客户端渲染前的占位尺寸 / Placeholder sizing before client mount */
.theme-toggle-fallback {
  height: 2.25rem;
  width: 2.25rem;
  border: 1px solid var(--border-default);
}

/* 当用户偏好减少动画时关闭过渡 / Disable transitions when user prefers reduced motion */
@media (prefers-reduced-motion: reduce) {
  .theme-toggle-btn {
    transition: none;
  }
}
</style>