// 定义主题对应的背景基准色，用于渐变遮罩的两端颜色 / Define the base background colors per theme used as the two ends of the gradient overlay
const THEME_COLORS = {
  // 暗色模式的背景基色 / Base background color for dark mode
  dark: '#0a0a0b',
  // 亮色模式的背景基色 / Base background color for light mode
  light: '#faf8f5',
} as const

// 整个渐变擦除动画的总时长（毫秒）/ Total duration (ms) of the full gradient wipe animation
const SWEEP_MS = 780
/** 在渐变带覆盖大部分视口后，再真正应用主题切换。 / Apply the real theme once the gradient band has covered most of the viewport. */
const APPLY_AT_MS = 320

/** 共享锁，避免快速连续点击时叠加多个遮罩层。 / Shared lock so rapid toggles don't stack overlays. */
let running = false

// 延时辅助函数：返回一个在指定毫秒后 resolve 的 Promise / Sleep helper: returns a Promise that resolves after the given milliseconds
function sleep(ms: number) {
  // 创建一个新的 Promise 包裹 setTimeout 以实现异步等待 / Create a Promise wrapping setTimeout to allow async awaiting
  return new Promise<void>((resolve) => {
    // 在指定毫秒后调用 resolve 结束等待 / Resolve the promise after the given delay
    window.setTimeout(resolve, ms)
  })
}

/**
 * 在暗色与亮色之间切换时，执行覆盖整个视口的渐变擦除动画。
 * 暗→亮如同晨光晕染；亮→暗则反向如暮色降临。
 * Full-viewport gradient wipe when moving between dark and light.
 * Dark → light sweeps ink into paper; light → dark reverses.
 */
export function useThemeTransition() {
  // 获取 colorMode 实例以读取与设置当前颜色模式 / Obtain the colorMode instance to read and set the current color mode
  const colorMode = useColorMode()

  // 执行到目标主题的过渡动画 / Perform the animated transition to the next theme
  async function transitionTo(next: 'dark' | 'light') {
    // 若处于服务端（非客户端），直接设置偏好并返回，不播放动画 / On the server side, just set the preference and return without animation
    if (!import.meta.client) {
      // 直接写入 colorMode 偏好值 / Write the colorMode preference directly
      colorMode.preference = next
      return
    }

    // 计算当前实际主题（统一归并为 dark/light）/ Determine the current effective theme, normalized to dark/light
    const current = (colorMode.value === 'light' ? 'light' : 'dark') as 'dark' | 'light'
    // 若目标与当前一致，则无需动画，直接返回 / No animation needed if the target equals the current theme
    if (current === next) return

    // 检测用户是否偏好减少动画 / Check whether the user prefers reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // 若偏好减少动画或已有动画运行中，直接切换并返回 / If reduced motion is preferred or an animation is already running, switch instantly
    if (prefersReduced || running) {
      // 直接设置偏好，跳过动画 / Set the preference directly, skipping the animation
      colorMode.preference = next
      return
    }

    // 标记动画开始，防止并发叠加 / Mark the animation as running to prevent concurrent overlays
    running = true
    // 取出当前主题对应的起始颜色 / Take the starting color of the current theme
    const from = THEME_COLORS[current]
    // 取出目标主题对应的结束颜色 / Take the ending color of the target theme
    const to = THEME_COLORS[next]

    // 动态创建一个全屏覆盖层 DOM 元素 / Dynamically create a full-viewport overlay DOM element
    const overlay = document.createElement('div')
    // 设置覆盖层的类名以应用渐变过渡样式 / Set the overlay's class name to apply gradient transition styles
    overlay.className = 'theme-gradient-transition'
    // 标记为对辅助技术隐藏，纯装饰用途 / Mark the overlay as decorative and hidden from assistive tech
    overlay.setAttribute('aria-hidden', 'true')
    // 设置 CSS 变量：渐变起始颜色 / Set the CSS variable for the gradient start color
    overlay.style.setProperty('--theme-from', from)
    // 设置 CSS 变量：渐变结束颜色 / Set the CSS variable for the gradient end color
    overlay.style.setProperty('--theme-to', to)
    // 方向：暗→亮如晨光自左晕染；亮→暗如暮色反向 / Direction: dark→light reads leftward dawn; light→dark reads dusk the other way
    overlay.style.setProperty('--theme-angle', next === 'light' ? '118deg' : '298deg')
    // 将覆盖层挂载到 document 根节点上 / Append the overlay to the document root element
    document.documentElement.appendChild(overlay)

    // 强制触发一次重排，确保首帧先绘制再添加动画类 / Force a reflow so the initial frame paints before the animation class is applied
    void overlay.offsetWidth
    // 添加激活类，启动渐变动画 / Add the active class to start the gradient animation
    overlay.classList.add('is-active')

    // 等待到应当真正应用主题的时机 / Wait until the moment the real theme should be applied
    await sleep(APPLY_AT_MS)
    // 切换 colorMode 偏好，使底层主题真正生效 / Switch the colorMode preference so the underlying theme actually changes
    colorMode.preference = next

    // 等待剩余动画时间（含少许缓冲）/ Wait for the remaining animation time plus a small buffer
    await sleep(SWEEP_MS - APPLY_AT_MS + 40)
    // 移除覆盖层 DOM / Remove the overlay element from the DOM
    overlay.remove()
    // 释放锁，允许下一次切换 / Release the lock to allow the next transition
    running = false
  }

  // 返回过渡方法供外部调用 / Return the transition method for external use
  return {
    transitionTo,
  }
}