<template>
  <div class="mx-auto max-w-2xl px-6 pb-24 pt-28">
    <header class="mb-8 text-center">
      <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {{ t('ranking.title') }}
      </h1>
      <p class="mt-2 text-stone-400">{{ t('ranking.subtitle') }}</p>
    </header>

    <div v-if="currentUserRank" class="mb-8 rounded-2xl border border-white/10 bg-ink-900/80 p-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
            <span class="font-display text-xl font-bold text-accent">{{ getInitial(currentUserRank.name) }}</span>
          </div>
          <div>
            <p class="font-display font-semibold text-stone-100">{{ currentUserRank.name || currentUserRank.email }}</p>
            <p class="text-sm text-stone-500">{{ t('ranking.yourRank') }} #{{ currentUserRank.position }}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-display text-2xl font-bold text-accent">{{ currentUserRank.experience }} XP</p>
          <p class="text-xs text-stone-500">{{ t('ranking.experience') }}</p>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-white/10 bg-ink-900/50 overflow-hidden">
      <div class="flex items-center gap-3 border-b border-white/10 px-5 py-3">
        <span class="text-lg">🏆</span>
        <div>
          <p class="font-display text-sm font-semibold text-stone-100">{{ t('ranking.topPlayers') }}</p>
          <p class="text-xs text-stone-500">{{ t('ranking.leaderboard') }}</p>
        </div>
      </div>

      <div>
        <div
          v-for="(item, index) in ranking.slice(0, 20)"
          :key="item.id"
          :class="[
            'flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/5',
            index === 0 && 'border-b border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent',
            index === 1 && 'border-b border-slate-400/30 bg-gradient-to-r from-slate-400/5 to-transparent',
            index === 2 && 'border-b border-amber-700/30 bg-gradient-to-r from-amber-700/5 to-transparent',
          ]"
        >
          <div class="flex items-center gap-4">
            <span
              :class="[
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                index === 0 ? 'bg-amber-500 text-amber-950' : '',
                index === 1 ? 'bg-slate-400 text-slate-950' : '',
                index === 2 ? 'bg-amber-700 text-amber-100' : '',
                index > 2 && 'text-stone-500',
              ]"
            >
              {{ index + 1 }}
            </span>
            <div class="flex h-10 w-10 items-center justify-center rounded-full" :class="getAvatarBg(index)">
              <span class="font-display font-semibold" :class="getAvatarText(index)">
                {{ getInitial(item.name) }}
              </span>
            </div>
            <div>
              <p class="font-medium text-stone-200">{{ item.name || item.email }}</p>
              <p class="text-xs text-stone-500">
                {{ item.totalAttempts }} {{ t('ranking.attempts') }} · {{ item.accuracy }}% {{ t('ranking.accuracy') }}
              </p>
            </div>
          </div>
          <span class="font-display text-lg font-bold" :class="getScoreColor(index)">
            {{ item.experience }} XP
          </span>
        </div>
      </div>

      <div v-if="ranking.length === 0" class="px-5 py-12 text-center">
        <p class="text-stone-500">{{ t('ranking.noData') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SessionUser } from '~/stores/user'

const { t } = useI18n()
const store = useUserStore()
const user = computed(() => store.user as SessionUser | null)

interface RankingItem {
  id: string
  name: string | null
  email: string
  totalAttempts: number
  correctAttempts: number
  accuracy: number
  experience: number
}

const ranking = ref<RankingItem[]>([])

async function loadData() {
  try {
    const data = await $fetch<{ ranking: RankingItem[] }>('/api/ranking')
    ranking.value = data.ranking
  } catch {
    ranking.value = []
  }
}

await loadData()

const currentUserRank = computed(() => {
  if (!user.value) return null
  const index = ranking.value.findIndex((r) => r.id === user.value?.id)
  if (index === -1) return null
  return {
    ...ranking.value[index],
    position: index + 1,
  }
})

function getInitial(nameOrEmail: string | null): string {
  if (!nameOrEmail) return '?'
  const parts = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail
  return parts.charAt(0).toUpperCase()
}

function getAvatarBg(index: number): string {
  if (index === 0) return 'bg-amber-500/20'
  if (index === 1) return 'bg-slate-400/20'
  if (index === 2) return 'bg-amber-700/20'
  return 'bg-ink-800'
}

function getAvatarText(index: number): string {
  if (index === 0) return 'text-amber-400'
  if (index === 1) return 'text-slate-300'
  if (index === 2) return 'text-amber-600'
  return 'text-stone-400'
}

function getScoreColor(index: number): string {
  if (index === 0) return 'text-amber-400'
  if (index === 1) return 'text-slate-300'
  if (index === 2) return 'text-amber-600'
  return 'text-stone-300'
}
</script>