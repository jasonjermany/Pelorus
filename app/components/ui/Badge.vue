<template>
  <span :class="badgeClass" class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'success' | 'danger' | 'neutral' | 'info'
}>()

const badgeClass = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-success-500/10 text-success-500'
    case 'danger':
      return 'bg-danger-500/10 text-danger-500'
    case 'info':
      return 'border border-primary-700/20 bg-primary-700/10 text-primary-700'
    default:
      return 'bg-surface-100 text-primary-700'
  }
})
</script>
