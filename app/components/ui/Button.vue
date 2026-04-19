<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="buttonClass"
    class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[15px] font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A18] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()
defineEmits<{ (e: 'click'): void }>()

const buttonClass = computed(() => {
  switch (props.variant) {
    case 'accent':
    case 'primary':
      return 'bg-accent-500 hover:bg-accent-400 text-[#050A18]'
    case 'secondary':
      return 'bg-white/[0.06] border border-white/[0.10] text-white/70 hover:text-white hover:border-white/[0.20] hover:bg-white/[0.09]'
    case 'ghost':
      return 'text-white/50 hover:text-white hover:bg-white/[0.06]'
    default:
      return 'bg-accent-500 hover:bg-accent-400 text-[#050A18]'
  }
})
</script>
