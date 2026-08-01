// 应用级配置读取（数据库 app_config 表，不走环境变量）。
// 带进程内短缓存（60s），写入后可用 invalidateConfigKey 立即失效。
import { usePrisma } from './prisma'

const TTL = 60_000
const cache = new Map<string, { value: string | null; expiresAt: number }>()

export async function getConfigValue(key: string): Promise<string | null> {
  const hit = cache.get(key)
  const now = Date.now()
  if (hit && hit.expiresAt > now) return hit.value

  const prisma = usePrisma()
  const row = await prisma.appConfig.findUnique({ where: { key } })
  const value = row?.value ?? null
  cache.set(key, { value, expiresAt: now + TTL })
  return value
}

/** 清除某个 key 的缓存（配置更新后调用） */
export function invalidateConfigKey(key: string): void {
  cache.delete(key)
}
