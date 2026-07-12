// SSR 阶段直接用原始 H3 event 调用 getSessionUser，绕过 $fetch。 / During SSR, call getSessionUser directly with the raw H3 event, bypassing $fetch.
//
// 根因：store.fetch() 在 SSR 阶段用 $fetch('/api/auth/session') 拉会话时， / Root cause: when store.fetch() uses $fetch('/api/auth/session') during SSR,
// $fetch 会在 Nitro 内部创建一个全新的 H3 event。这个新 event 虽然能拿到 / $fetch creates a brand-new H3 event inside Nitro. That new event can carry
// 转发的 Cookie 头，但 event.context.cloudflare（含 D1 binding）不存在， / the forwarded cookie header, but event.context.cloudflare (with the D1 binding) is missing,
// 导致 usePrisma() 抛错 → session 返回 null → 中间件误判未登录 → 跳转 login。 / causing usePrisma() to throw → session returns null → middleware wrongly redirects to login.
//
// 解决：在 .server 插件中用 useRequestEvent() 拿到原始 event，直接调用 / Fix: in this .server plugin, use useRequestEvent() to get the raw event and call
// server/utils 的 getSessionUser(event)，该 event 拥有完整的 Cloudflare 上下文。 / server/utils' getSessionUser(event), which has the full Cloudflare context.
// 结果写入 Pinia store，随 SSR payload 传递到客户端。 / The result is stored in Pinia and sent to the client via the SSR payload.
// 引入服务端鉴权工具 getSessionUser / Import the server-side auth helper getSessionUser
import { getSessionUser } from '~~/server/utils/auth'

// 定义 Nuxt 服务端插件（异步）/ Define an async Nuxt server plugin
export default defineNuxtPlugin(async () => {
  // 获取用户状态 store / Obtain the user store
  const store = useUserStore()
  // 获取当前请求的原始 H3 event / Get the raw H3 event for the current request
  const event = useRequestEvent()
  // 无 event（非请求上下文）则跳过 / If no event (not a request context), skip
  if (!event) return

  try {
    // 用原始 event 直接获取会话用户 / Get the session user using the raw event
    const user = await getSessionUser(event)
    // 写入 Pinia store / Write it into the Pinia store
    store.setUser(user)
  } catch {
    // 失败则标记为未登录 / On failure, mark as logged out
    store.setUser(null)
  }
})