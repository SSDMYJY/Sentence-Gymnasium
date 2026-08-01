<template>
  <div class="mx-auto min-h-[calc(100svh-4rem)] max-w-3xl px-6 pb-24 pt-32">
    <!-- 步骤标题 / Step label -->
    <p class="ds-eyebrow">{{ t('health.step') }}</p>
    <!-- 页面主标题 / Page heading -->
    <h1 class="mt-2 ds-heading-display text-4xl sm:text-5xl">{{ t('health.title') }}</h1>
    <!-- 说明正文（含高亮代码）/ Body text (with highlighted code) -->
    <p class="mt-4 leading-relaxed text-tertiary" v-html="bodyHtml"></p>

    <!-- 健康检查面板 / Health-check panel -->
    <div class="mt-10 ds-card bg-elevated">
      <div class="flex items-center justify-between">
        <!-- 接口标签 / Endpoint label -->
        <p class="ds-label">{{ t('health.endpoint') }}</p>
        <!-- 状态指示灯 / Status indicator light -->
        <span
          :class="[
            'inline-flex h-2 w-2 rounded-full',
            health.ok ? 'bg-accent' : 'bg-stone-600', // 正常绿 / 异常灰 / ok vs down
          ]"
        />
      </div>
      <!-- 原始返回内容 / Raw response -->
      <pre class="mt-4 whitespace-pre-wrap break-all text-sm text-secondary">{{ health }}</pre>
    </div>

    <!-- 技术栈说明 / Stack note -->
    <p class="mt-8 text-xs text-muted">
      {{ t('health.stack') }}
    </p>
  </div>
</template>

<script setup lang="ts">
// 获取 i18n / Obtain i18n
const { t } = useI18n()

// { ok: true } 含花括号，会与 vue-i18n 插值语法冲突，
// 因此把 okCode 作为参数传入，并在 v-html 中渲染带样式的 <code>。
// { ok: true } contains braces that conflict with vue-i18n interpolation syntax,
// so we pass it as a param and render a styled <code> in v-html.
const bodyHtml = computed(() => {
  // 取带参数的翻译文本 / Get the translated text with the param
  const text = t('health.body', { okCode: '{ ok: true }' })
  // 将 okCode 替换为带样式的 code 标签 / Replace okCode with a styled code tag
  return text.replace(
    '{ ok: true }',
    '<code class="rounded bg-elevated px-1.5 py-0.5 text-accent-soft">{ ok: true }</code>',
  )
})

// 健康检查结果 / Health check result
const health = ref<{ ok?: boolean; users?: number; ts?: string; error?: string }>({})
try {
  // 请求健康检查接口 / Fetch the health-check endpoint
  health.value = await $fetch('/api/health')
} catch (e: any) {
  // 失败记录错误 / Record error on failure
  health.value = { error: e?.message ?? String(e) }
}
</script>