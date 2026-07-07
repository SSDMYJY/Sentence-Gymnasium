<template>
	<Teleport to="body">
		<Transition name="toast">
			<div v-if="visible"
				class="pointer-events-none fixed inset-x-0 top-20 z-[100] flex justify-center px-4 sm:top-6">
				<div
					:class="[
						'pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl',
						typeClasses[type],
					]">
					<span class="text-lg">{{ iconFor(type) }}</span>
					<p class="text-sm font-medium text-stone-100">{{ message }}</p>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts">
type ToastType = 'error' | 'success' | 'info'

const props = withDefaults(
	defineProps<{
		visible: boolean
		message: string
		type?: ToastType
	}>(),
	{ type: 'info' },
)

const typeClasses: Record<ToastType, string> = {
	error: 'border-red-500/30 bg-red-950/90 text-red-200',
	success: 'border-green-500/30 bg-green-950/90 text-green-200',
	info: 'border-white/15 bg-ink-900/95 text-stone-200',
}

function iconFor(t: ToastType): string {
	if (t === 'error') return '✕'
	if (t === 'success') return '✓'
	return 'ℹ'
}
</script>

<style scoped>
.toast-enter-active {
	transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.toast-leave-active {
	transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}
.toast-enter-from {
	opacity: 0;
	transform: translateY(-12px) scale(0.96);
}
.toast-leave-to {
	opacity: 0;
	transform: translateY(-8px) scale(0.98);
}
</style>
