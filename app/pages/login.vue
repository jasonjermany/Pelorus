<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 relative overflow-hidden">
    <!-- Subtle grid -->
    <div class="absolute inset-0 pointer-events-none" style="background-image: linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px); background-size: 60px 60px"/>

    <div class="w-full max-w-[380px] relative z-10">

      <!-- Logo -->
      <div class="flex items-center justify-center gap-2.5 mb-8">
        <img src="/PelorusLogo.png" width="40" height="40" alt="Pelorus" />
        <span class="text-[19px] font-semibold text-gray-900 tracking-[-0.3px]">Pelorus</span>
      </div>

      <!-- Card -->
      <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div class="px-7 pt-7 pb-1">
          <h1 class="text-[20px] font-semibold text-gray-900 tracking-[-0.4px] mb-1">Sign in</h1>
          <p class="text-[15px] text-gray-700">Enter your credentials to access your account.</p>
        </div>

        <div class="px-7 py-6 flex flex-col gap-4">
          <div>
            <label for="email" class="block text-[13px] font-semibold text-gray-700 uppercase tracking-[0.07em] mb-2">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="you@carrier.com"
              class="login-input"
              @keyup.enter="login"
            />
          </div>
          <div>
            <label for="password" class="block text-[13px] font-semibold text-gray-700 uppercase tracking-[0.07em] mb-2">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="login-input"
              @keyup.enter="login"
            />
          </div>

          <p v-if="error" class="text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {{ error }}
          </p>

          <button
            class="w-full bg-accent-500 hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed text-[#050A18] py-2.5 rounded-xl text-[16px] font-bold transition-colors duration-150 mt-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:ring-offset-2"
            :disabled="isLoading"
            @click="login"
          >
            {{ isLoading ? 'Signing in…' : 'Sign in' }}
          </button>
        </div>

        <div class="px-7 py-4 border-t border-gray-100 bg-gray-50">
          <p class="text-[15px] text-gray-700 text-center">
            Need access?
            <a href="mailto:hello@pelorus.ai" class="text-[#92700A] hover:text-accent-600 font-medium transition-colors duration-150">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { fetch: refreshSession } = useUserSession()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)

async function login() {
  if (!email.value || !password.value) {
    error.value = 'Please enter your email and password.'
    return
  }
  isLoading.value = true
  error.value = null
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await refreshSession()
    await navigateTo('/app', { replace: true })
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Invalid email or password.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-input {
  @apply w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-accent-500/70 focus:bg-white rounded-xl px-3.5 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-600 outline-none transition-all duration-150 shadow-sm;
}
</style>
