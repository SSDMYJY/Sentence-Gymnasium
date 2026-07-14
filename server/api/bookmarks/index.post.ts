// POST /api/bookmarks - Add a bookmark
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const prisma = usePrisma(event)

  const body = await readBody<{ word: string; sentence?: string; sourceLang?: string; category?: string }>(event)
  const { word, sentence, sourceLang, category } = body

  if (!word?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'word is required' })
  }

  // Check if already bookmarked
  const existing = await prisma.bookmark.findUnique({
    where: { userId_word: { userId: user.id, word: word.trim() } },
  })

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Already bookmarked' })
  }

  const bookmark = await prisma.bookmark.create({
    data: {
      userId: user.id,
      word: word.trim(),
      sentence: sentence?.trim() || null,
      sourceLang: sourceLang || null,
      category: category || null,
    },
  })

  return bookmark
})
