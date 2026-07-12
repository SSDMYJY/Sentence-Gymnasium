// 引入 Pinia 的 defineStore 用于定义全局状态仓库 / Import defineStore from Pinia to define a global state store
import { defineStore } from 'pinia'

// 当前登录用户会话信息的数据结构定义 / Data structure describing the authenticated user's session
export interface SessionUser {
  // 用户唯一标识 / User's unique identifier
  id: string
  // 用户邮箱 / User's email address
  email: string
  // 用户昵称（可能为 null）/ User's display name (may be null)
  name: string | null
  // 剩余积分（练习次数额度）/ Remaining credits (practice quota)
  credits: number
  // 累计练习次数 / Total number of practice attempts
  totalAttempts: number
  // 答对次数 / Number of correct attempts
  correctAttempts: number
  // 连续打卡天数（学习 streak）/ Consecutive active-day streak
  streak: number
  // 上次练习时间（ISO 字符串或 null）/ Last practice timestamp (ISO string or null)
  lastPracticeAt: string | null
  // 用户等级 / User level
  level: number
}

// 定义名为 'user' 的 Pinia store / Define the Pinia store named 'user'
export const useUserStore = defineStore('user', {
  // 仓库的初始状态 / Initial state of the store
  state: () => ({
    // 当前用户对象，未登录时为 null / Current user object, null when not logged in
    user: null as SessionUser | null,
    // 标识是否已拉取过会话（避免重复请求）/ Flag indicating whether session was already fetched (avoid duplicate requests)
    fetched: false,
  }),
  // 派生状态（getter）/ Derived state (getters)
  getters: {
    // 是否已登录：user 存在即为已认证 / Whether authenticated: a non-null user means logged in
    isAuthenticated: (s) => !!s.user,
    // 当前积分：user 不存在时回退为 0 / Current credits: fall back to 0 when no user
    credits: (s) => s.user?.credits ?? 0,
  },
  // 可执行的操作方法 / Action methods
  actions: {
    // 写入用户信息并标记已拉取 / Set the user and mark as fetched
    setUser(u: SessionUser | null) {
      // 更新用户对象 / Update the user object
      this.user = u
      // 标记已完成一次拉取 / Mark that a fetch has completed
      this.fetched = true
    },
    // 拉取会话；若已拉取且非强制则直接返回缓存 / Fetch session; return cached value unless forced
    async fetch(force = false) {
      // 已拉取且非强制时直接返回已有用户 / If already fetched and not forced, return existing user
      if (this.fetched && !force) return this.user
      try {
        // 服务端：转发浏览器 Cookie 头以便识别会话 / On server: forward browser cookie header to identify session
        const headers = import.meta.server
          ? useRequestHeaders(['cookie'])
          : undefined
        // 请求会话接口获取当前用户 / Call the session API to get the current user
        const data = await $fetch<SessionUser | null>('/api/auth/session', {
          // 携带的请求头（服务端才有）/ Request headers (only present on server)
          headers,
        })
        // 写入用户（为空则置 null）/ Store the user (null if absent)
        this.setUser(data ?? null)
      } catch {
        // 请求失败时置为未登录 / On failure, treat as logged out
        this.setUser(null)
      }
      // 返回最终的用户状态 / Return the resulting user state
      return this.user
    },
    // 登录：调用登录接口并返回用户 / Login: call the login API and return the user
    async login(email: string, password: string, turnstileToken: string) {
      // 发送 POST 登录请求 / Send a POST login request
      const data = await $fetch<SessionUser>('/api/auth/login', {
        // 使用 POST 方法 / Use POST method
        method: 'POST',
        // 请求体包含邮箱、密码与 Turnstile 令牌 / Body contains email, password and Turnstile token
        body: { email, password, turnstileToken },
      })
      // 保存登录后的用户 / Save the logged-in user
      this.setUser(data)
      // 返回用户数据 / Return the user data
      return data
    },
    // 注册：调用注册接口并返回用户 / Register: call the register API and return the user
    async register(payload: { email: string; password: string; name?: string; turnstileToken: string }) {
      // 发送 POST 注册请求 / Send a POST register request
      const data = await $fetch<SessionUser>('/api/auth/register', {
        // 使用 POST 方法 / Use POST method
        method: 'POST',
        // 请求体为注册信息 / Body contains registration info
        body: payload,
      })
      // 保存注册后的用户 / Save the registered user
      this.setUser(data)
      // 返回用户数据 / Return the user data
      return data
    },
    // 登出：调用登出接口并清空用户 / Logout: call the logout API and clear the user
    async logout() {
      // 发送 POST 登出请求 / Send a POST logout request
      await $fetch('/api/auth/logout', { method: 'POST' })
      // 清空本地用户状态 / Clear the local user state
      this.setUser(null)
    },
  },
})