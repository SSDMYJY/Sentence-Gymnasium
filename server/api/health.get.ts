// Health-check endpoint: proves the chain
//   nuxt dev → nitro-cloudflare-dev → D1 binding → PrismaD1 adapter → query
// works end to end. Returns the current user count from D1.
export default defineEventHandler(async (event) => {
  const prisma = usePrisma(event)
  const users = await prisma.user.count()
  return {
    ok: true,
    users,
    ts: new Date().toISOString(),
  }
})
