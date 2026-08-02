// 统一的 API 请求封装（用于需要登录的接口）。
//
// 背景：会话过期 / cookie 失效时，受保护接口返回 401。各页面直接 catch 后只弹
// "Unauthorized" 提示，用户会卡在页面上不知所措，属于典型的"登录态丢失"类问题。
//
// 本封装在 401 时统一处理：
//   1. 强制刷新一次会话（cookie 可能只是需要重新校验 / 已在别处重新登录）；
//   2. 刷新后已恢复登录 → 自动重试原请求一次；
//   3. 仍未登录 → 跳转到登录页并携带 redirect 参数，登录后自动回到原页面；
//   4. 在抛出的错误上标记 __redirected，页面 catch 可据此跳过错误 toast。
//
// 用法与 $fetch 完全一致：const data = await useApi<T>('/api/xxx', { method: 'POST', body })
export function useApi<T>(url: string, options?: Parameters<typeof $fetch<T>>[1]): Promise<T> {
  const store = useUserStore()
  const localePath = useLocalePath()
  const route = useRoute()

  const doFetch = () => $fetch<T>(url, options)

  return doFetch().catch(async (err: any) => {
    // 仅处理 401；其它错误（400/402/500…）原样抛出，由调用方处理。
    if (err?.statusCode === 401 && !err?.data?.__redirected) {
      // 1) 强制刷新会话
      await store.fetch(true)
      if (store.isAuthenticated) {
        // 2) 刷新后已恢复登录 → 重试一次
        return doFetch()
      }
      // 3) 仍未登录 → 跳转登录页
      try {
        err.data = err.data ?? {}
        err.data.__redirected = true
        const redirect = route.fullPath
        await navigateTo({ path: localePath('/login'), query: { redirect } })
      } catch {
        // 跳转失败不阻塞错误传播
      }
    }
    throw err
  })
}
