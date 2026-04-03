<template>
  <!-- Marketing variant -->
  <nav v-if="variant === 'marketing'" class="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 bg-[#faf8f3]/95 backdrop-blur-md border-b border-black/[0.06]">
    <a href="#" class="flex items-center gap-2.5 no-underline">
      <img src="/PelorusLogo.png" width="40" height="40" alt="Pelorus" class="md:w-[54px] md:h-[54px]" />
      <span class="text-[18px] font-semibold text-primary-800 tracking-[-0.3px]">Pelorus</span>
    </a>
    <ul class="flex items-center gap-4 md:gap-8 list-none">
      <li class="hidden md:block"><a href="#features" class="text-[14px] font-medium text-black/65 hover:text-primary-800 transition-colors no-underline">Features</a></li>
      <li class="hidden md:block"><a href="#how" class="text-[14px] font-medium text-black/65 hover:text-primary-800 transition-colors no-underline">How it works</a></li>
      <li class="hidden md:block"><NuxtLink to="/login" class="text-[14px] font-medium text-black/65 hover:text-primary-800 transition-colors no-underline">Sign in</NuxtLink></li>
      <li><a href="#contact" class="bg-primary-800 hover:bg-primary-700 text-white text-[14px] font-medium px-4 md:px-5 py-2 rounded-md no-underline transition-colors">Contact Sales</a></li>
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
