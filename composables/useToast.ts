import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
const type = ref<'error' | 'success' | 'info'>('info')
let timer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
	function show(msg: string, t: 'error' | 'success' | 'info' = 'info', duration = 3200) {
		if (timer) {
			clearTimeout(timer)
			timer = null
		}
		message.value = msg
		type.value = t
		visible.value = true
		timer = setTimeout(() => {
			visible.value = false
			timer = null
		}, duration)
	}

	function hide() {
		if (timer) {
			clearTimeout(timer)
			timer = null
		}
		visible.value = false
	}

	return {
		visible,
		message,
		type,
		show,
		hide,
		error: (msg: string) => show(msg, 'error'),
		success: (msg: string) => show(msg, 'success'),
		info: (msg: string) => show(msg, 'info'),
	}
}
