// 全局中间件：已登录用户访问首页（/ 或 /<lang>）时自动跳转到 /<lang>/dashboard。
// 未登录用户保持原样（可正常看首页营销内容）。
//
// 注意：store 在 SSR 阶段尚未填充（session 由 auth.client.ts 在客户端拉取），
// 因此需主动 fetch session。SSR 时 $fetch 不会自动转发浏览器 cookie，
// store.fetch 内部已用 useRequestHeaders(['cookie']) 处理。
export default defineNuxtRouteMiddleware(async (to) => {
  // 仅匹配首页：/ 或 /<lang>（无子路径）。带 hash 或 query 也算首页。
  // to.name 形如 'index___zh-hans' / 'zh-hans___zh-hans' 等，匹配 index 类页面。
  const isHome = to.name?.toString().startsWith('index') ?? false
  if (!isHome) return

  const store = useUserStore()
  // 客户端且已拉取：直接用 store 状态。
  if (!(process.client && store.fetched)) {
    await store.fetch()
  }
  if (store.isAuthenticated) {
    return navigateTo(useLocalePath()('/dashboard'))
  }
})
