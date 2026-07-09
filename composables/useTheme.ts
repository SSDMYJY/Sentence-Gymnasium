export function useTheme() {
  const colorMode = useColorMode()

  const isDark = computed(() => colorMode.value === 'dark')
  const isLight = computed(() => colorMode.value === 'light')

  function toggleTheme() {
    colorMode.preference = isDark.value ? 'light' : 'dark'
  }

  function setTheme(theme: 'dark' | 'light') {
    colorMode.preference = theme
  }

  return {
    isDark,
    isLight,
    toggleTheme,
    setTheme,
    colorMode,
  }
}
