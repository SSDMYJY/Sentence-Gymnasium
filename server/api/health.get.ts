// Health-check endpoint: proves the chain
//   Nuxt SSR → PrismaClient (MySQL) → query
// works end to end. Returns the current user count from MySQL.
export default defineEventHandler(async (event) => {
  const prisma = usePrisma(event)
  const users = await prisma.user.count()
  return {
    ok: true,
    users,
    ts: new Date().toISOString(),
  }
})
