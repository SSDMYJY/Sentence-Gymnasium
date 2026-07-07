import { useToast as useNuxtToast } from '#imports'

export function useToast() {
  const toast = useNuxtToast()

  function show(msg: string, t: 'error' | 'success' | 'info' = 'info', duration = 3200) {
    const colorMap: Record<string, any> = {
      error: 'red',
      success: 'green',
      info: 'neutral',
    }
    toast.add({
      title: msg,
      color: colorMap[t],
      timeout: duration,
    })
  }

  function hide() {
    toast.clear()
  }

  return {
    show,
    hide,
    error: (msg: string) => show(msg, 'error'),
    success: (msg: string) => show(msg, 'success'),
    info: (msg: string) => show(msg, 'info'),
  }
}
