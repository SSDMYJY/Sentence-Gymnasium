// GET /api/bookmarks - List bookmarks (paginated, filter by lang/category)
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)
  const query = getQuery(event)

  const page = Math.max(1, parseInt(query.page as string) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize as string) || 20))
  const sourceLang = query.sourceLang as string | undefined
  const category = query.category as string | undefined
  const search = query.search as string | undefined

  const where: any = { userId: user.id }
  if (sourceLang) where.sourceLang = sourceLang
  if (category) where.category = category
  if (search) where.word = { contains: search }

  const [items, total] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bookmark.count({ where }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
})
