<template>
  <div>
    <!-- ============== HERO ============== -->
    <section class="relative min-h-svh w-full overflow-hidden">
      <img
        :src="heroImg"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        fetchpriority="high"
      />
      <!-- Tonal overlays: keep the left half calm for text -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/20"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/50"
      />

      <div
        class="relative z-10 mx-auto flex min-h-svh max-w-7xl flex-col justify-center px-6 pb-20 pt-28"
      >
        <div class="max-w-2xl">
          <p
            class="hero-rise text-xs uppercase tracking-[0.32em] text-accent-soft sm:text-sm"
            style="animation-delay: 0.05s"
          >
            AI Sentence Training · 多语言训练场
          </p>

          <h1
            class="hero-rise mt-6 font-display text-5xl font-bold leading-[0.95] tracking-tightest sm:text-7xl lg:text-8xl"
            style="animation-delay: 0.15s"
          >
            Sentence<br />Gymnasium
          </h1>

          <p
            class="hero-rise mt-5 font-display text-xl text-stone-200 sm:text-2xl"
            style="animation-delay: 0.3s"
          >
            句子健身房 · 把每一句练到本能
          </p>

          <p
            class="hero-rise mt-5 max-w-xl leading-relaxed text-stone-400"
            style="animation-delay: 0.42s"
          >
            AI 出题、AI 判题、题目入库复用。翻译、改写、语法特训——三种训练方式构成一个完整闭环。
          </p>

          <div
            class="hero-rise mt-9 flex flex-wrap items-center gap-4"
            style="animation-delay: 0.55s"
          >
            <a
              href="#boards"
              class="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-ink-950 transition hover:bg-accent-soft"
            >
              开始训练
              <span class="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
            <a
              href="#flow"
              class="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-medium text-stone-200 transition hover:border-white/40 hover:text-white"
            >
              了解训练流程
            </a>
          </div>
        </div>
      </div>

      <div
        class="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-stone-500"
      >
        scroll
      </div>
    </section>

    <!-- ============== BOARDS ============== -->
    <section id="boards" class="relative border-t border-white/5">
      <div class="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div v-reveal class="max-w-2xl">
          <p class="text-xs uppercase tracking-[0.28em] text-accent-soft">三种训练方式</p>
          <h2 class="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            一个训练场，三种练法
          </h2>
          <p class="mt-4 leading-relaxed text-stone-400">
            每一种都对应一套完整的出题、作答、判题、反馈流程。选一种开始，或三种交替练。
          </p>
        </div>

        <div
          class="boards-grid mt-16 grid grid-cols-1 border-t border-white/10 md:grid-cols-3"
        >
          <NuxtLink
            v-for="b in boards"
            :key="b.no"
            v-reveal
            :to="b.to"
            class="group relative border-b border-white/10 px-6 py-10 transition-colors hover:bg-ink-800/30 sm:px-8 md:border-b-0 md:border-r md:last:border-r-0"
          >
            <span
              class="absolute left-0 top-0 h-px w-0 bg-accent transition-all duration-500 group-hover:w-full"
            />
            <span class="block font-display text-sm text-stone-500">{{ b.no }}</span>
            <span class="mt-6 block font-display text-2xl font-semibold">{{ b.title }}</span>
            <span class="mt-1 block text-sm text-accent-soft">{{ b.cn }}</span>
            <p class="mt-4 text-sm leading-relaxed text-stone-400">{{ b.desc }}</p>
            <span
              class="mt-8 inline-flex items-center gap-2 text-sm text-stone-300 transition-colors group-hover:text-white"
            >
              进入
              <span class="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ============== FLOW ============== -->
    <section id="flow" class="relative border-t border-white/5 bg-ink-900/40">
      <div class="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div v-reveal class="max-w-2xl">
          <p class="text-xs uppercase tracking-[0.28em] text-accent-soft">训练流程</p>
          <h2 class="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            一次完整的训练闭环
          </h2>
          <p class="mt-4 leading-relaxed text-stone-400">
            从出题到反馈，四步构成一次可复盘的训练。题目入库复用，越练越快。
          </p>
        </div>

        <ol
          class="flow-grid mt-16 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4"
        >
          <li
            v-for="s in steps"
            :key="s.no"
            v-reveal
            class="relative border-t border-white/10 pt-8"
          >
            <span class="absolute left-0 top-0 h-px w-10 bg-accent" />
            <span class="font-display text-sm text-accent">{{ s.no }}</span>
            <h3 class="mt-5 font-display text-xl font-semibold">{{ s.title }}</h3>
            <p class="mt-1 text-sm text-stone-500">{{ s.en }}</p>
            <p class="mt-4 text-sm leading-relaxed text-stone-400">{{ s.desc }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- ============== FINAL CTA ============== -->
    <section class="relative border-t border-white/5">
      <div class="mx-auto max-w-5xl px-6 py-28 text-center sm:py-36">
        <h2
          v-reveal
          class="font-display text-4xl font-semibold tracking-tight sm:text-6xl"
        >
          准备好开始第一组训练了吗？
        </h2>
        <p v-reveal class="mt-6 text-stone-400">
          新用户赠送 20 Credits · 生成一题扣 1 Credit
        </p>
        <div
          v-reveal
          class="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <NuxtLink
            to="/practice"
            class="group inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-semibold text-ink-950 transition hover:bg-accent-soft"
          >
            进入训练场
            <span class="transition-transform group-hover:translate-x-0.5">→</span>
          </NuxtLink>
          <NuxtLink
            to="/health"
            class="inline-flex items-center gap-2 rounded-full border border-white/15 px-8 py-4 text-sm font-medium text-stone-200 transition hover:border-white/40 hover:text-white"
          >
            链路自检
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const heroPrompt =
  'cinematic moody photograph of a quiet minimalist study studio at dawn, warm amber rim light falling on an open book and a single wooden chair, deep shadow negative space on the left half, editorial photography, shallow depth of field, no people, no text, no signage, premium magazine aesthetic'
const heroImg = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
  heroPrompt,
)}&image_size=landscape_16_9`

const boards = [
  {
    no: '01',
    title: 'Practice',
    cn: '翻译练习',
    desc: '6 个语言方向互译：ja-en / en-ja / ja-zh / zh-ja / en-zh / zh-en。AI 出题，AI 判题。',
    to: '/practice',
  },
  {
    no: '02',
    title: 'Paraphrase',
    cn: '同义改写',
    desc: '源语言为日或英，换一种说法保留原意。AI 评价原意保留度与自然度。',
    to: '/paraphrase',
  },
  {
    no: '03',
    title: 'Grammar Focus',
    cn: '语法特训',
    desc: '按语法点生成填空、选择、改错题。te-form、present-perfect 等专项突破。',
    to: '/grammar',
  },
]

const steps = [
  { no: '01', title: '出题', en: 'Generate', desc: 'AI 生成题目并入库，相同维度优先复用，越练越快。' },
  { no: '02', title: '作答', en: 'Answer', desc: '翻译、改写或选择，提交你的答案。' },
  { no: '03', title: '判题', en: 'Judge', desc: 'AI 比对标准答案与你的作答，给出对错。' },
  { no: '04', title: '反馈', en: 'Feedback', desc: '解释、建议、示范句，落库历史与统计。' },
]

// Scroll-reveal directive: add .reveal, flip to .reveal-visible on intersection.
const vReveal = {
  mounted(el: HTMLElement) {
    el.classList.add('reveal')
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('reveal-visible')
            io.unobserve(el)
          }
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
  },
}
</script>
