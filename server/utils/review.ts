// SM-2 inspired spaced repetition review utility
// Computes next review time based on current level and answer quality (0-5)

export interface ReviewResult {
  nextLevel: number
  nextReviewAt: Date
}

// Quality mapping: score 0-10 → quality 0-5
export function scoreToQuality(score: number): number {
  if (score >= 9) return 5
  if (score >= 7) return 4
  if (score >= 5) return 3
  if (score >= 3) return 2
  if (score >= 1) return 1
  return 0
}

// Review intervals in days per level
const REVIEW_INTERVALS: Record<number, number> = {
  0: 0,     // Immediate (next session)
  1: 1,     // 1 day
  2: 3,     // 3 days
  3: 7,     // 1 week
  4: 14,    // 2 weeks
  5: 30,    // 1 month
  6: -1,    // Mastered (no more review)
}

// Compute next review time based on current level and answer quality (0-5)
export function computeNextReview(level: number, quality: number): ReviewResult {
  let nextLevel: number

  if (quality >= 4) {
    // Good answer: advance level
    nextLevel = Math.min(level + 1, 6)
  } else if (quality >= 2) {
    // Partial: keep same level
    nextLevel = Math.max(level, 1)
  } else {
    // Bad: reset to level 1
    nextLevel = 1
  }

  const intervalDays = REVIEW_INTERVALS[nextLevel]
  const now = new Date()

  if (nextLevel === 6 || intervalDays < 0) {
    // Mastered
    return { nextLevel: 6, nextReviewAt: null as any }
  }

  const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000)
  return { nextLevel, nextReviewAt }
}
