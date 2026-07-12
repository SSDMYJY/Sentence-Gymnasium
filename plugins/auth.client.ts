// 客户端首屏：从服务端拉取会话状态，写入 Pinia。 / Client first paint: fetch session state from the server and write it into Pinia.
// 用 .client 后缀确保只在浏览器侧执行（SSR 阶段不重复请求）。 / The .client suffix ensures it runs only in the browser (no duplicate request during SSR).
//
// SSR 阶段已由 auth.server.ts 插件通过原始 event 直接调用 getSessionUser / During SSR, auth.server.ts already calls getSessionUser via the raw event
// 获取会话，Pinia 状态随 SSR payload 传递到客户端。但如果 SSR 状态未成功 / and the Pinia state is passed to the client via the SSR payload. But if that fails
// 传递（或 SSR 阶段 session 为 null），客户端需要主动拉一次以恢复登录态。 / (or SSR session was null), the client must fetch once to restore the login state.

// 定义 Nuxt 客户端插件（异步）/ Define an async Nuxt client plugin
export default defineNuxtPlugin(async () => {
  // 获取用户状态 store / Obtain the user store
  const store = useUserStore()
  // 若尚未拉取或当前无用户，则强制拉取一次 / If not yet fetched or no current user, force a fetch
  if (!store.fetched || !store.user) {
    // 强制刷新会话状态 / Force-refresh the session state
    await store.fetch(true)
  }
})