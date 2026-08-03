// 客户端数据缓存（内存 + TTL）。
//
// 背景：生产环境（EdgeOne Makers 云函数）每次请求都有较高的冷启动/远程 MySQL
// 延迟（实测单接口 0.6~1.5s）。/dashboard /ranking /review /bookmarks 等页面
// 每次进入都会重新请求接口，导致页面看起来"卡了几秒"。
//
// 本工具在浏览器内存里缓存接口响应，TTL 内再次进入页面直接命中缓存，无需
// 重新请求，重复导航体验接近瞬时；命中时会在后台静默刷新缓存，下次进入即为
// 新数据（stale-while-revalidate）。
//
// 数据变更类操作（判题 / 删除收藏 / 改目标）应调用 clearCachedApi 使缓存失效。
//
// 用法与 $fetch 一致：
//   const data = await useCachedApi<T>('dashboard:stats', () => useApi<T>('/api/stats'), 60_000)

const cache = new Map<string, { data: unknown; expires: number }>()

export function useCachedApi<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() < hit.expires) {
    // 命中缓存：立即返回，并在后台静默刷新，保证下次进入时数据是新的。
    fetcher()
      .then((data) => {
        cache.set(key, { data, expires: Date.now() + ttlMs })
      })
      .catch(() => {
        // 后台刷新失败不影响当前展示（保留旧缓存直至 TTL 过期）
      })
    return Promise.resolve(hit.data as T)
  }

  return fetcher()
    .then((data) => {
      cache.set(key, { data, expires: Date.now() + ttlMs })
      return data
    })
    .catch((err) => {
      // 请求失败时回退到过期缓存，避免页面空白
      const stale = cache.get(key)
      if (stale) return stale.data as T
      throw err
    })
}

/** 清除指定前缀的缓存（用于数据变更后强制刷新）。 */
export function clearCachedApi(prefix: string): void {
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k)
  }
}
