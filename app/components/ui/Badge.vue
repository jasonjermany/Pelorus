<template>
  <span
    :class="badgeClass"
    class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[0.05em] uppercase"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'success' | 'danger' | 'warn' | 'neutral' | 'info'
}>()

const badgeClass = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-success-500/10 text-success-400 border border-success-500/20'
    case 'danger':
      return 'bg-danger-500/10 text-danger-400 border border-danger-500/20'
    case 'warn':
      return 'bg-accent-500/10 text-accent-400 border border-accent-500/20'
    case 'info':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    default:
      return 'bg-white/[0.07] text-white/50 border border-white/[0.10]'
  }
})
</script>
