export function useTheme() {
  const colorMode = useColorMode()
  const { transitionTo } = useThemeTransition()

  const isDark = computed(() => colorMode.value === 'dark')
  const isLight = computed(() => colorMode.value === 'light')

  async function toggleTheme() {
    await transitionTo(isDark.value ? 'light' : 'dark')
  }

  async function setTheme(theme: 'dark' | 'light') {
    await transitionTo(theme)
  }

  return {
    isDark,
    isLight,
    toggleTheme,
    setTheme,
    colorMode,
  }
}
