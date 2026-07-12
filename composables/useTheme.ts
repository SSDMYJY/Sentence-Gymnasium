// 对外导出 useTheme 组合式函数，封装明暗主题的读取与切换逻辑 / Export the useTheme composable that encapsulates dark/light theme reading and toggling logic
export function useTheme() {
  // 获取 Nuxt 内置的 colorMode 实例，用于读取与设置当前颜色模式 / Obtain Nuxt's built-in colorMode instance to read and set the current color mode
  const colorMode = useColorMode()
  // 获取主题过渡组合式函数，提供带渐变擦除动画的切换能力 / Obtain the theme transition composable providing gradient-wipe animated switching
  const { transitionTo } = useThemeTransition()

  // 计算属性：当前是否为暗色模式 / Computed: whether the current mode is dark
  const isDark = computed(() => colorMode.value === 'dark')
  // 计算属性：当前是否为亮色模式 / Computed: whether the current mode is light
  const isLight = computed(() => colorMode.value === 'light')

  // 异步切换主题函数：根据当前状态在暗/亮之间切换 / Async toggle: switch between dark and light based on the current state
  async function toggleTheme() {
    // 调用过渡动画切换到目标主题（当前暗则切亮，否则切暗）/ Trigger the animated transition to the opposite theme
    await transitionTo(isDark.value ? 'light' : 'dark')
  }

  // 异步设置指定主题的函数 / Async function to set a specific theme explicitly
  async function setTheme(theme: 'dark' | 'light') {
    // 调用过渡动画切换到传入的指定主题 / Trigger the animated transition to the given theme
    await transitionTo(theme)
  }

  // 将主题相关的状态与方法统一返回给调用方 / Return theme state and methods to the caller
  return {
    isDark,
    isLight,
    toggleTheme,
    setTheme,
    colorMode,
  }
}