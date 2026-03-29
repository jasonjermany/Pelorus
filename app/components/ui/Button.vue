<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="buttonClass"
    class="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  variant?: "primary" | "secondary" | "ghost" | "accent";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}>();
defineEmits<{
  (e: "click"): void;
}>();

const buttonClass = computed(() => {
  if (props.disabled) {
    return "cursor-not-allowed bg-slate-200 text-slate-400";
  }

  switch (props.variant) {
    case "accent":
      return "bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500/40";
    case "secondary":
      return "bg-white text-primary-700 border border-primary-700 hover:bg-primary-700/5 focus:ring-primary-700/30";
    case "ghost":
      return "bg-transparent text-primary-700 hover:bg-primary-700/10 focus:ring-primary-700/20";
    default:
      return "bg-primary-700 text-white hover:bg-primary-600 focus:ring-primary-700/40";
  }
});
</script>
