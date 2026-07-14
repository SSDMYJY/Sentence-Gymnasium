// DELETE /api/bookmarks/[id] - Remove a bookmark
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }

  const bookmark = await prisma.bookmark.findUnique({ where: { id } })
  if (!bookmark || bookmark.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Bookmark not found' })
  }

  await prisma.bookmark.delete({ where: { id } })
  return { success: true }
})
