// 路由守卫：在需要登录的页面 definePageMeta({ middleware: 'auth' }) 启用。
// 未登录则跳转到 /login，并带上 redirect query 以便登录后回跳。
//
// 注意：store 在 SSR 阶段尚未填充（session 由 auth.client.ts 在客户端拉取），
// 因此守卫里需要主动查 session。SSR 时 $fetch 不会自动转发浏览器 cookie，
// 必须显式带上 Cookie 头；客户端导航则无需手动转发。
export default defineNuxtRouteMiddleware(async (to) => {
  const store = useUserStore()
  // 客户端且已拉取过：直接用 store 状态，避免每次跳转都打接口。
  if (process.client && store.fetched) {
    if (!store.isAuthenticated) {
      return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
    }
    return
  }
  // SSR 或未拉取：主动查一次 session。
  const user = await store.fetch()
  if (!user) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
