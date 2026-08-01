import { PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'

// Module-level singleton PrismaClient backed by MySQL (process.env.DATABASE_URL).
// On the Node.js runtime (EdgeOne Makers Cloud Functions) a single pooled client
// is shared across requests, so we cache it at module scope instead of creating
// a new instance per request (which would open a new connection pool each time).
//
// Note: keep the `event` parameter so every existing call site
// (`usePrisma(event)` in server/api/**) stays unchanged.
let _prisma: PrismaClient | null = null

export function usePrisma(_event?: H3Event): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient()
  }
  return _prisma
}
