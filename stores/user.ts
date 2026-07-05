import { defineStore } from 'pinia'

export interface SessionUser {
  id: string
  email: string
  name: string | null
  credits: number
  totalAttempts: number
  correctAttempts: number
}

// 客户端会话镜像：服务端 cookie/JWT 为唯一真源，本 store 仅缓存当前用户。
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as SessionUser | null,
    fetched: false,
  }),
  getters: {
    isAuthenticated: (s) => !!s.user,
    credits: (s) => s.user?.credits ?? 0,
  },
  actions: {
    setUser(u: SessionUser | null) {
      this.user = u
      this.fetched = true
    },
    async fetch() {
      try {
        // SSR 阶段 $fetch 不会自动转发浏览器请求的 Cookie，需手动带上，
        // 否则服务端拿不到会话 cookie，会误判为未登录。
        const headers = import.meta.server
          ? useRequestHeaders(['cookie'])
          : undefined
        const data = await $fetch<SessionUser | null>('/api/auth/session', {
          headers,
        })
        this.setUser(data ?? null)
      } catch {
        this.setUser(null)
      }
      return this.user
    },
    async login(email: string, password: string) {
      const data = await $fetch<SessionUser>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      this.setUser(data)
      return data
    },
    async register(payload: { email: string; password: string; name?: string }) {
      const data = await $fetch<SessionUser>('/api/auth/register', {
        method: 'POST',
        body: payload,
      })
      this.setUser(data)
      return data
    },
    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' })
      this.setUser(null)
    },
  },
})
