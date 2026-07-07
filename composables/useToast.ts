import { ref } from 'vue'

export type ToastType = 'error' | 'success' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

function show(message: string, type: ToastType = 'info', duration = 3500) {
  const id = ++nextId
  toasts.value.push({ id, message, type })
  if (duration > 0) {
    setTimeout(() => {
      dismiss(id)
    }, duration)
  }
  return id
}

function dismiss(id: number) {
  const index = toasts.value.findIndex((t) => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

export function useToast() {
  return {
    toasts,
    show,
    error: (message: string, duration?: number) => show(message, 'error', duration),
    success: (message: string, duration?: number) => show(message, 'success', duration),
    info: (message: string, duration?: number) => show(message, 'info', duration),
    dismiss,
  }
}
