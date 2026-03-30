<template>
  <!-- Marketing variant -->
  <nav v-if="variant === 'marketing'" class="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-12 bg-[#faf8f3]/95 backdrop-blur-md border-b border-black/[0.06]">
    <a href="#" class="flex items-center gap-2.5 no-underline">
      <img src="/PelorusLogo.png" width="54" height="54" alt="Pelorus" />
      <span class="text-[20px] font-semibold text-primary-800 tracking-[-0.3px]">Pelorus</span>
    </a>
    <ul class="flex items-center gap-8 list-none">
      <li><a href="#features" class="text-[14px] font-medium text-black/50 hover:text-primary-800 transition-colors no-underline">Features</a></li>
      <li><a href="#how" class="text-[14px] font-medium text-black/50 hover:text-primary-800 transition-colors no-underline">How it works</a></li>
      <li><NuxtLink to="/login" class="text-[14px] font-medium text-black/50 hover:text-primary-800 transition-colors no-underline">Sign in</NuxtLink></li>
      <li><a href="#contact" class="bg-primary-800 hover:bg-primary-700 text-white text-[14px] font-medium px-5 py-2 rounded-md no-underline transition-colors">Contact Sales</a></li>
    </ul>
  </nav>

  <!-- App variant -->
  <header v-else-if="variant === 'app'" class="sticky top-0 z-50 bg-primary-800 border-b border-white/5">
    <slot />
  </header>
</template>

<script setup lang="ts">
defineProps<{
  variant: 'marketing' | 'app'
}>()
</script>
