// 会话查询：返回当前登录用户（供前端首屏与刷新后恢复状态用）。
export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  return user ?? null
})
