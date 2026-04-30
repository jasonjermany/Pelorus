<template>
  <!-- Marketing variant -->
  <nav
    v-if="variant === 'marketing'"
    class="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 bg-navy border-b border-white/[0.08]"
  >
    <a href="#" class="flex items-center gap-1.5 no-underline">
      <img src="/PelorusLogo.png" alt="Pelorus mark" class="h-14 w-auto" />
      <img src="/PelorusWordmark.png" alt="Pelorus" class="w-[9rem] h-auto" style="margin-top:5px;margin-left:-40px" />
    </a>
    <ul class="flex items-center gap-1 list-none">
      <li class="hidden md:block">
        <a href="#features" class="text-[15px] font-medium text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all duration-150 no-underline">Features</a>
      </li>
      <li class="hidden md:block">
        <a href="#how" class="text-[15px] font-medium text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all duration-150 no-underline">How it works</a>
      </li>
      <li class="hidden md:block">
        <NuxtLink to="/login" class="text-[15px] font-medium text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all duration-150 no-underline">Sign in</NuxtLink>
      </li>
      <li>
        <a href="#contact" class="bg-accent-500 hover:bg-accent-400 text-white text-[15px] font-bold px-4 py-1.5 rounded-lg no-underline transition-colors duration-150">Contact Sales</a>
      </li>
    </ul>
  </nav>

  <!-- App variant -->
  <header
    v-else-if="variant === 'app'"
    class="sticky top-0 z-50 bg-navy border-b border-white/[0.08] h-14"
  >
    <slot />
  </header>
</template>

<script setup lang="ts">
defineProps<{
  variant: 'marketing' | 'app'
}>()
</script>
