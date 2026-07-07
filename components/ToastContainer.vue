<template>
  <div class="pointer-events-none fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2 px-4">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md',
          toast.type === 'error' && 'border-red-500/30 bg-red-950/80 text-red-100',
          toast.type === 'success' && 'border-green-500/30 bg-green-950/80 text-green-100',
          toast.type === 'info' && 'border-white/15 bg-ink-900/90 text-stone-200',
        ]"
      >
        <span class="shrink-0 text-base">
          <span v-if="toast.type === 'error'">✗</span>
          <span v-else-if="toast.type === 'success'">✓</span>
          <span v-else>●</span>
        </span>
        <span class="flex-1 leading-relaxed">{{ toast.message }}</span>
        <button
          type="button"
          class="shrink-0 text-stone-500 transition-colors hover:text-white"
          @click="dismiss(toast.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
const { toasts, dismiss } = useToast()
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.25s cubic-bezier(0.2, 0.7, 0.2, 1);
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
  transform: translateY(-8px) scale(0.96);
}
.toast-move {
  transition: transform 0.25s ease;
}
</style>
