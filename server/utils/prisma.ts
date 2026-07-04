import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import type { H3Event } from 'h3'

// Returns a per-request PrismaClient backed by the Cloudflare D1 binding.
// We must NOT keep a module-level singleton: the D1 binding comes from the
// request context (event.context.cloudflare.env.DB) and is only valid per
// request. Cache the instance on event.context so multiple util calls within
// the same request reuse it.
export function usePrisma(event: H3Event): PrismaClient {
  const ctx = event.context as any
  if (ctx._prisma) return ctx._prisma as PrismaClient

  const binding = event.context.cloudflare?.env?.DB
  if (!binding) {
    throw createError({
      statusCode: 500,
      statusMessage: 'D1 binding (DB) is missing — check wrangler.jsonc and nitro-cloudflare-dev.',
    })
  }

  const adapter = new PrismaD1(binding as D1Database)
  ctx._prisma = new PrismaClient({ adapter })
  return ctx._prisma as PrismaClient
}
