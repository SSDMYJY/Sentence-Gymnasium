// 客户端首屏：从服务端拉取会话状态，写入 Pinia。
// 用 .client 后缀确保只在浏览器侧执行（SSR 阶段不重复请求）。
export default defineNuxtPlugin(async () => {
  const store = useUserStore()
  if (!store.fetched) {
    await store.fetch()
  }
})
