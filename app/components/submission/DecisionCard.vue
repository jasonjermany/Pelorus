<template>
  <div class="rounded-2xl p-6 sm:p-7 border" :style="cardStyle">
    <div class="flex items-start justify-between gap-6">
      <div class="flex-1 min-w-0">
        <p class="text-[12px] font-bold tracking-[0.12em] uppercase mb-3" :style="{ color: colors.label }">Decision</p>
        <span
          class="inline-flex items-center px-3.5 py-1 rounded-full text-[14px] font-bold tracking-[0.04em] uppercase mb-4"
          :style="{ background: colors.pillBg, color: colors.pillText }"
        >{{ verdict.decision }}</span>
        <p class="text-[16px] leading-[1.7] mb-4 text-gray-800">{{ verdict.recommendation?.summary }}</p>
        <div class="flex items-center flex-wrap gap-2">
          <span
            v-if="verdict.analyzed_in_seconds"
            class="text-[13px] font-medium px-2.5 py-1 rounded-full"
            :style="{ background: colors.metaBg, color: colors.meta }"
          >Analyzed in {{ verdict.analyzed_in_seconds }}s</span>
        </div>
      </div>
      <div class="flex-shrink-0 flex flex-col items-end">
        <span class="leading-none tracking-[-3px]" style="font-size:68px;font-weight:300" :style="{ color: colors.score }">
          {{ normalizeScore(verdict.composite_score).toFixed(1) }}
        </span>
        <span class="text-[14px] font-medium -mt-1" :style="{ color: colors.scoreLabel }">out of 10</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Verdict } from '~/types/submission'

const props = defineProps<{ verdict: Verdict }>()

const colors = computed(() => {
  const d = props.verdict.decision
  if (d === 'PROCEED') return {
    bg: '#dcfce7', border: '#86efac',
    label: '#15803d', meta: '#15803d',
    metaBg: '#bbf7d0', score: '#15803d', scoreLabel: 'rgba(21,128,61,0.5)',
    pillBg: '#bbf7d0', pillText: '#166534',
  }
  if (d === 'REFER') return {
    bg: '#fef3c7', border: '#fbbf24',
    label: '#92700A', meta: '#92700A',
    metaBg: '#fde68a', score: '#92700A', scoreLabel: 'rgba(146,112,10,0.5)',
    pillBg: '#fde68a', pillText: '#78580A',
  }
  return {
    bg: '#fee2e2', border: '#fca5a5',
    label: '#dc2626', meta: '#dc2626',
    metaBg: '#fecaca', score: '#dc2626', scoreLabel: 'rgba(220,38,38,0.5)',
    pillBg: '#fecaca', pillText: '#991b1b',
  }
})

const cardStyle = computed(() => ({
  background: colors.value.bg,
  borderColor: colors.value.border,
}))
</script>
