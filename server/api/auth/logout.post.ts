// 登出：清除会话 cookie。
export default defineEventHandler(async (event) => {
  clearSessionCookie(event)
  return { ok: true }
})
