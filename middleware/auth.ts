// 路由守卫：在需要登录的页面 definePageMeta({ middleware: 'auth' }) 启用。 / Route guard: enabled on pages via definePageMeta({ middleware: 'auth' }).
// 未登录则跳转到 /<lang>/login，并带上 redirect query 以便登录后回跳。 / Redirects unauthenticated users to /<lang>/login with a redirect query for post-login return.
//
// 注意：store 在 SSR 阶段尚未填充（session 由 auth.client.ts 在客户端拉取）， / Note: the store is not populated during SSR (session is fetched client-side by auth.client.ts),
// 因此守卫里需要主动查 session。SSR 时 $fetch 不会自动转发浏览器 cookie， / so the guard must actively query the session. During SSR, $fetch does not forward browser cookies automatically,
// 必须显式带上 Cookie 头；客户端导航则无需手动转发。 / so the cookie header must be passed explicitly; client-side navigation needs no manual forwarding.

// 定义 Nuxt 路由中间件，接收目标路由 to / Define a Nuxt route middleware receiving the target route `to`
export default defineNuxtRouteMiddleware(async (to) => {
  // 获取用户状态 store / Obtain the user store
  const store = useUserStore()
  // 获取生成本地化路径的工具 / Obtain the localized-path helper
  const localePath = useLocalePath()
  // 计算登录页的本地化路径 / Compute the localized login path
  const loginPath = localePath('/login')
  // 客户端且已拉取过：直接用 store 状态，避免每次跳转都打接口。 / On client with a prior fetch: use store state directly to avoid an API call per navigation.
  if (process.client && store.fetched) {
    // 未登录则携带 redirect 跳转登录页 / If not authenticated, redirect to login with the redirect param
    if (!store.isAuthenticated) {
      return navigateTo({ path: loginPath, query: { redirect: to.fullPath } })
    }
    // 已登录则放行 / Authenticated: allow navigation
    return
  }
  // SSR 或未拉取：主动查一次 session。 / SSR or not yet fetched: actively query the session once.
  const user = await store.fetch()
  // 仍无用户则跳转登录页 / If still no user, redirect to login
  if (!user) {
    return navigateTo({ path: loginPath, query: { redirect: to.fullPath } })
  }
})