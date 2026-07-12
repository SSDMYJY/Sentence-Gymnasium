// 全局中间件：已登录用户访问首页（/ 或 /<lang>）时自动跳转到 /<lang>/dashboard。 / Global middleware: auto-redirect authenticated users from the home page (/ or /<lang>) to /<lang>/dashboard.
// 未登录用户保持原样（可正常看首页营销内容）。 / Unauthenticated users stay put (can view the marketing home page).
//
// 注意：store 在 SSR 阶段尚未填充（session 由 auth.client.ts 在客户端拉取）， / Note: the store is not populated during SSR (session is fetched client-side by auth.client.ts),
// 因此需主动 fetch session。SSR 时 $fetch 不会自动转发浏览器 cookie， / so the session must be fetched actively. During SSR, $fetch does not forward browser cookies,
// store.fetch 内部已用 useRequestHeaders(['cookie']) 处理。 / store.fetch already handles this via useRequestHeaders(['cookie']).

// 定义全局 Nuxt 路由中间件，接收目标路由 to / Define a global Nuxt route middleware receiving the target route `to`
export default defineNuxtRouteMiddleware(async (to) => {
  // 仅匹配首页：/ 或 /<lang>（无子路径）。带 hash 或 query 也算首页。 / Match only the home page: / or /<lang> (no sub-path); hash/query still count as home.
  // to.name 形如 'index___zh-hans' / 'zh-hans___zh-hans' 等，匹配 index 类页面。 / `to.name` looks like 'index___zh-hans' etc.; match index-like pages.
  const isHome = to.name?.toString().startsWith('index') ?? false
  // 非首页直接放行 / Not home: allow navigation
  if (!isHome) return

  // 获取用户状态 store / Obtain the user store
  const store = useUserStore()
  // 客户端且已拉取：直接用 store 状态。 / On client with prior fetch: use store state directly.
  if (!(process.client && store.fetched)) {
    // 否则主动拉取一次会话 / Otherwise actively fetch the session once
    await store.fetch()
  }
  // 已登录则跳转到 dashboard / If authenticated, redirect to dashboard
  if (store.isAuthenticated) {
    return navigateTo(useLocalePath()('/dashboard'))
  }
})