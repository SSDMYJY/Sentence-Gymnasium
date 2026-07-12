/**
 * Homepage GSAP animation parameters.
 * Tune values here; see docs/home-animations.md for the full guide.
 */

export const homeAnimationConfig = {
  /** Hero entrance timeline */
  hero: {
    duration: 0.85,
    ease: 'power3.out',
    /** Vertical offset (px) for entrance */
    y: 28,
    /** Stagger between hero text items (seconds) */
    stagger: 0.12,
    /** Extra delay before first item (seconds) */
    delay: 0.05,
    /** Hero image scale-in */
    image: {
      fromScale: 1.06,
      duration: 1.6,
      ease: 'power2.out',
    },
  },

  /** Scroll-triggered section reveals */
  reveal: {
    duration: 0.8,
    ease: 'power3.out',
    y: 28,
    /** ScrollTrigger start position */
    start: 'top 85%',
    /** Stagger within a batch (seconds) */
    stagger: 0.12,
    /** Batch collection window (seconds) */
    batchInterval: 0.12,
  },

  /** Hero background parallax (scrubbed; desktop + motion OK only) */
  parallax: {
    yPercent: 12,
    copyYPercent: -6,
    scrub: 1,
    /** Min viewport width (px) to enable parallax */
    minWidth: 768,
  },

  /** Scroll-hint loop */
  scrollHint: {
    y: 8,
    duration: 1.1,
    ease: 'sine.inOut',
  },

  /** Board card hover (transform-only) */
  hover: {
    cardLiftY: -6,
    cardScale: 1.01,
    cardDuration: 0.32,
    cardEase: 'power2.out',
    lineDuration: 0.45,
    lineEase: 'power2.out',
    arrowX: 4,
    arrowDuration: 0.3,
    arrowEase: 'power2.out',
    ctaLiftY: -2,
    ctaScale: 1.02,
    ctaDuration: 0.25,
    ctaEase: 'power2.out',
    secondaryLiftY: -2,
    secondaryScale: 1.015,
    secondaryDuration: 0.25,
    secondaryEase: 'power2.out',
  },
} as const

export type HomeAnimationConfig = typeof homeAnimationConfig
