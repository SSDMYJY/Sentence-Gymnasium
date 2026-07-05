// 客户端首屏：从服务端拉取会话状态，写入 Pinia。
// 用 .client 后缀确保只在浏览器侧执行（SSR 阶段不重复请求）。
//
// SSR 阶段已由 auth.server.ts 插件通过原始 event 直接调用 getSessionUser
// 获取会话，Pinia 状态随 SSR payload 传递到客户端。但如果 SSR 状态未成功
// 传递（或 SSR 阶段 session 为 null），客户端需要主动拉一次以恢复登录态。
export default defineNuxtPlugin(async () => {
  const store = useUserStore()
  if (!store.fetched || !store.user) {
    await store.fetch(true)
  }
})
