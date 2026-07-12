// 从 Nuxt 自动导入中引入官方 useToast 函数 / Import the official useToast function from Nuxt auto-imports
import { useToast as useNuxtToast } from '#imports'

// 封装统一的 Toast 提示逻辑，提供 show/hide 及语义化快捷方法 / Wrap a unified toast logic exposing show/hide and semantic shortcuts
export function useToast() {
  // 获取底层 Nuxt Toast 实例 / Obtain the underlying Nuxt toast instance
  const toast = useNuxtToast()

  // 显示一条提示：msg 为内容，t 为类型，duration 为自动关闭毫秒数 / Show a toast: msg is content, t is type, duration is auto-close ms
  function show(msg: string, t: 'error' | 'success' | 'info' = 'info', duration = 3200) {
    // 类型到颜色样式的映射表 / Map from semantic type to toast color style
    const colorMap: Record<string, any> = {
      // 错误类型使用红色 / Error type uses red
      error: 'red',
      // 成功类型使用绿色 / Success type uses green
      success: 'green',
      // 普通信息使用中性色 / Info type uses neutral
      info: 'neutral',
    }
    // 调用底层 toast 添加一条提示 / Call the underlying toast to add a notification
    toast.add({
      // 提示标题内容 / Toast title content
      title: msg,
      // 根据类型映射得到的颜色 / Color derived from the type map
      color: colorMap[t],
      // 自动关闭的超时时间 / Auto-close timeout duration
      timeout: duration,
    })
  }

  // 立即清除所有提示 / Immediately clear all toasts
  function hide() {
    // 调用底层 clear 清空提示栈 / Call the underlying clear to empty the toast stack
    toast.clear()
  }

  // 统一返回 show/hide 及三类语义化快捷方法 / Return show/hide plus three semantic shortcut methods
  return {
    show,
    hide,
    // 错误提示快捷方法 / Shortcut for error toast
    error: (msg: string) => show(msg, 'error'),
    // 成功提示快捷方法 / Shortcut for success toast
    success: (msg: string) => show(msg, 'success'),
    // 信息提示快捷方法 / Shortcut for info toast
    info: (msg: string) => show(msg, 'info'),
  }
}