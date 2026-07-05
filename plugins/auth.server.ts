// SSR 阶段直接用原始 H3 event 调用 getSessionUser，绕过 $fetch。
//
// 根因：store.fetch() 在 SSR 阶段用 $fetch('/api/auth/session') 拉会话时，
// $fetch 会在 Nitro 内部创建一个全新的 H3 event。这个新 event 虽然能拿到
// 转发的 Cookie 头，但 event.context.cloudflare（含 D1 binding）不存在，
// 导致 usePrisma() 抛错 → session 返回 null → 中间件误判未登录 → 跳转 login。
//
// 解决：在 .server 插件中用 useRequestEvent() 拿到原始 event，直接调用
// server/utils 的 getSessionUser(event)，该 event 拥有完整的 Cloudflare 上下文。
// 结果写入 Pinia store，随 SSR payload 传递到客户端。
import { getSessionUser } from '~~/server/utils/auth'

export default defineNuxtPlugin(async () => {
  const store = useUserStore()
  const event = useRequestEvent()
  if (!event) return

  try {
    const user = await getSessionUser(event)
    store.setUser(user)
  } catch {
    store.setUser(null)
  }
})
