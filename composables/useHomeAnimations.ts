import type { Ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { homeAnimationConfig as cfg } from '~/utils/home-animation-config'

/**
 * Homepage-only GSAP animations: hero timeline, ScrollTrigger reveals,
 * light parallax, hover feedback, reduced-motion + visibility controls.
 */
export function useHomeAnimations(rootRef: Ref<HTMLElement | null>) {
  let ctx: gsap.Context | null = null
  let mm: gsap.MatchMedia | null = null
  let visibilityHandler: (() => void) | null = null
  let listenerAbort: AbortController | null = null
  const trackedAnimations = new Set<gsap.core.Animation>()

  function trackAnimation<T extends gsap.core.Animation>(animation: T): T {
    trackedAnimations.add(animation)
    return animation
  }

  function pause() {
    gsap.globalTimeline.pause()
    trackedAnimations.forEach((animation) => animation.pause())
  }

  function resume() {
    gsap.globalTimeline.resume()
    trackedAnimations.forEach((animation) => animation.resume())
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      pause()
    } else {
      resume()
    }
  }

  function bindHover(
    el: HTMLElement,
    enter: () => void,
    leave: () => void,
    signal: AbortSignal,
  ) {
    el.addEventListener('pointerenter', enter, { signal })
    el.addEventListener('pointerleave', leave, { signal })
    el.addEventListener('focusin', enter, { signal })
    el.addEventListener('focusout', leave, { signal })
  }

  function setup(root: HTMLElement) {
    gsap.registerPlugin(ScrollTrigger)

    listenerAbort = new AbortController()
    const { signal } = listenerAbort

    ctx = gsap.context(() => {
      mm = gsap.matchMedia()

      // Reduced motion: final states only
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(
          ['.js-hero-item', '.js-hero-copy', '.js-hero-image', '.js-scroll-hint', '.js-reveal'],
          { autoAlpha: 1, y: 0, scale: 1, clearProps: 'transform' },
        )
        gsap.set('.js-board-line', { scaleX: 0 })
        gsap.set('.js-board-arrow', { x: 0 })
      })

      // Full motion
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const heroItems = gsap.utils.toArray<HTMLElement>('.js-hero-item')
        const heroCopy = root.querySelector<HTMLElement>('.js-hero-copy')
        const heroImage = root.querySelector<HTMLElement>('.js-hero-image')
        const scrollHint = root.querySelector<HTMLElement>('.js-scroll-hint')
        const heroSection = root.querySelector<HTMLElement>('.js-hero')
        const heroCta = root.querySelector<HTMLElement>('.js-hero-cta-primary')
        const heroCtaArrow = root.querySelector<HTMLElement>('.js-hero-cta-arrow')
        const heroSecondary = root.querySelector<HTMLElement>('.js-hero-cta-secondary')

        gsap.set(heroItems, { autoAlpha: 0, y: cfg.hero.y, force3D: true })
        if (heroCopy) {
          gsap.set(heroCopy, { y: 0, force3D: true })
        }
        if (heroImage) {
          gsap.set(heroImage, {
            scale: cfg.hero.image.fromScale,
            transformOrigin: '50% 50%',
            force3D: true,
          })
        }
        if (scrollHint) {
          gsap.set(scrollHint, { autoAlpha: 0, y: 0, force3D: true })
        }

        const heroTl = trackAnimation(gsap.timeline({
          defaults: { duration: cfg.hero.duration, ease: cfg.hero.ease },
          delay: cfg.hero.delay,
        }))

        if (heroImage) {
          heroTl.to(
            heroImage,
            {
              scale: 1,
              duration: cfg.hero.image.duration,
              ease: cfg.hero.image.ease,
              force3D: true,
            },
            0,
          )
        }

        heroTl.to(
          heroItems,
          {
            autoAlpha: 1,
            y: 0,
            stagger: cfg.hero.stagger,
            force3D: true,
          },
          0.08,
        )

        if (scrollHint) {
          heroTl.to(
            scrollHint,
            { autoAlpha: 1, duration: 0.5, ease: 'power2.out' },
            '-=0.35',
          )

          const scrollHintTween = trackAnimation(gsap.to(scrollHint, {
            y: cfg.scrollHint.y,
            duration: cfg.scrollHint.duration,
            ease: cfg.scrollHint.ease,
            repeat: -1,
            yoyo: true,
            paused: true,
            force3D: true,
          }))

          heroTl.add(() => {
            scrollHintTween.play()
          })

          if (heroSection) {
            ScrollTrigger.create({
              trigger: heroSection,
              start: 'top top',
              end: 'bottom top',
              onEnter: () => scrollHintTween?.play(),
              onEnterBack: () => scrollHintTween?.play(),
              onLeave: () => scrollHintTween?.pause(),
              onLeaveBack: () => scrollHintTween?.pause(),
            })
          }
        }

        if (heroCopy && heroSection) {
          trackAnimation(
            gsap.to(heroCopy, {
              yPercent: cfg.parallax.copyYPercent,
              ease: 'none',
              scrollTrigger: {
                trigger: heroSection,
                start: 'top top',
                end: 'bottom top',
                scrub: cfg.parallax.scrub,
              },
            }),
          )
        }

        // Scroll reveals (batched, once)
        gsap.set('.js-reveal', { autoAlpha: 0, y: cfg.reveal.y, force3D: true })

        ScrollTrigger.batch('.js-reveal', {
          start: cfg.reveal.start,
          interval: cfg.reveal.batchInterval,
          once: true,
          onEnter: (batch) => {
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: cfg.reveal.duration,
              ease: cfg.reveal.ease,
              stagger: cfg.reveal.stagger,
              overwrite: true,
              force3D: true,
            })
          },
        })

        // Board card hover: lift + scaleX line + arrow x (no width / layout thrash)
        const cards = gsap.utils.toArray<HTMLElement>('.js-board-card')
        for (const card of cards) {
          const line = card.querySelector<HTMLElement>('.js-board-line')
          const arrow = card.querySelector<HTMLElement>('.js-board-arrow')

          if (line) {
            gsap.set(line, { scaleX: 0, transformOrigin: 'left center', force3D: true })
          }

          const cardTl = trackAnimation(
            gsap.timeline({ paused: true, defaults: { overwrite: 'auto' } }),
          )

          cardTl.to(
            card,
            {
              y: cfg.hover.cardLiftY,
              scale: cfg.hover.cardScale,
              duration: cfg.hover.cardDuration,
              ease: cfg.hover.cardEase,
              transformOrigin: 'center top',
              force3D: true,
            },
            0,
          )

          if (line) {
            cardTl.to(
              line,
              {
                scaleX: 1,
                duration: cfg.hover.lineDuration,
                ease: cfg.hover.lineEase,
                force3D: true,
              },
              0,
            )
          }

          if (arrow) {
            cardTl.to(
              arrow,
              {
                x: cfg.hover.arrowX,
                duration: cfg.hover.arrowDuration,
                ease: cfg.hover.arrowEase,
                force3D: true,
              },
              0,
            )
          }

          const enter = () => cardTl.play()

          const leave = () => cardTl.reverse()

          bindHover(card, enter, leave, signal)
        }

        // Hero primary CTA arrow
        if (heroCta && heroCtaArrow) {
          gsap.set(heroCtaArrow, { x: 0, force3D: true })

          const heroCtaTl = trackAnimation(
            gsap.timeline({ paused: true, defaults: { overwrite: 'auto' } }),
          )

          heroCtaTl.to(
            heroCta,
            {
              y: cfg.hover.ctaLiftY,
              scale: cfg.hover.ctaScale,
              duration: cfg.hover.ctaDuration,
              ease: cfg.hover.ctaEase,
              transformOrigin: 'center center',
              force3D: true,
            },
            0,
          )

          heroCtaTl.to(
            heroCtaArrow,
            {
              x: cfg.hover.arrowX,
              duration: cfg.hover.arrowDuration,
              ease: cfg.hover.arrowEase,
              force3D: true,
            },
            0,
          )

          bindHover(
            heroCta,
            () => heroCtaTl.play(),
            () => heroCtaTl.reverse(),
            signal,
          )
        }

        if (heroSecondary) {
          const secondaryTl = trackAnimation(
            gsap.timeline({ paused: true, defaults: { overwrite: 'auto' } }),
          )

          secondaryTl.to(
            heroSecondary,
            {
              y: cfg.hover.secondaryLiftY,
              scale: cfg.hover.secondaryScale,
              duration: cfg.hover.secondaryDuration,
              ease: cfg.hover.secondaryEase,
              transformOrigin: 'center center',
              force3D: true,
            },
            0,
          )

          bindHover(
            heroSecondary,
            () => secondaryTl.play(),
            () => secondaryTl.reverse(),
            signal,
          )
        }
      })

      // Desktop parallax only (transform + scrub; no layout)
      mm.add(
        `(prefers-reduced-motion: no-preference) and (min-width: ${cfg.parallax.minWidth}px)`,
        () => {
          const heroImage = root.querySelector<HTMLElement>('.js-hero-image')
          const heroSection = root.querySelector<HTMLElement>('.js-hero')
          if (!heroImage || !heroSection) return

          trackAnimation(
            gsap.to(heroImage, {
              yPercent: cfg.parallax.yPercent,
              ease: 'none',
              force3D: true,
              scrollTrigger: {
                trigger: heroSection,
                start: 'top top',
                end: 'bottom top',
                scrub: true,
              },
            }),
          )
        },
      )
    }, root)

    visibilityHandler = onVisibilityChange
    document.addEventListener('visibilitychange', visibilityHandler)
  }

  function cleanup() {
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }
    listenerAbort?.abort()
    listenerAbort = null
    // Do not leave the global timeline paused after leaving the page
    gsap.globalTimeline.resume()
    trackedAnimations.clear()
    mm?.revert()
    mm = null
    ctx?.revert()
    ctx = null
  }

  onMounted(() => {
    if (!import.meta.client) return
    requestAnimationFrame(() => {
      const root = rootRef.value
      if (root) setup(root)
    })
  })

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    pause,
    resume,
  }
}
