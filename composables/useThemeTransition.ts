const THEME_COLORS = {
  dark: '#0a0a0b',
  light: '#faf8f5',
} as const

const SWEEP_MS = 780
/** Apply the real theme once the gradient band has covered most of the viewport. */
const APPLY_AT_MS = 320

/** Shared lock so rapid toggles don't stack overlays. */
let running = false

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * Full-viewport gradient wipe when moving between dark and light.
 * Dark → light sweeps ink into paper; light → dark reverses.
 */
export function useThemeTransition() {
  const colorMode = useColorMode()

  async function transitionTo(next: 'dark' | 'light') {
    if (!import.meta.client) {
      colorMode.preference = next
      return
    }

    const current = (colorMode.value === 'light' ? 'light' : 'dark') as 'dark' | 'light'
    if (current === next) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || running) {
      colorMode.preference = next
      return
    }

    running = true
    const from = THEME_COLORS[current]
    const to = THEME_COLORS[next]

    const overlay = document.createElement('div')
    overlay.className = 'theme-gradient-transition'
    overlay.setAttribute('aria-hidden', 'true')
    overlay.style.setProperty('--theme-from', from)
    overlay.style.setProperty('--theme-to', to)
    // Direction: dark→light reads leftward dawn; light→dark reads dusk the other way
    overlay.style.setProperty('--theme-angle', next === 'light' ? '118deg' : '298deg')
    document.documentElement.appendChild(overlay)

    // Ensure the initial frame paints before the animation class is applied
    void overlay.offsetWidth
    overlay.classList.add('is-active')

    await sleep(APPLY_AT_MS)
    colorMode.preference = next

    await sleep(SWEEP_MS - APPLY_AT_MS + 40)
    overlay.remove()
    running = false
  }

  return {
    transitionTo,
  }
}
