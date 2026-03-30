<template>
  <div class="min-h-screen bg-surface-50 font-sans flex items-center justify-center px-6">
    <div class="w-full max-w-[400px]">

      <!-- Logo -->
      <div class="flex items-center justify-center gap-2.5 mb-10">
        <img src="/PelorusLogo.png" width="54" height="54" alt="Pelorus" />
        <span class="text-[20px] font-semibold text-primary-800 tracking-[-0.3px]">Pelorus</span>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl border border-black/[0.07] shadow-card overflow-hidden">
        <div class="px-8 pt-8 pb-2">
          <h1 class="text-[22px] font-bold text-primary-800 tracking-[-0.5px] mb-1">Sign in</h1>
          <p class="text-[13px] text-black/40 font-light">Enter your credentials to access your account.</p>
        </div>

        <div class="px-8 py-6 flex flex-col gap-4">
          <div>
            <label class="block text-[11px] font-semibold text-primary-800 uppercase tracking-[0.04em] mb-1.5">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@carrier.com"
              class="w-full border border-black/15 rounded-lg px-3.5 py-2.5 text-[13px] bg-surface-50 focus:outline-none focus:border-primary-800 focus:bg-white transition-colors font-sans text-primary-800 placeholder:text-black/25"
              @keyup.enter="login"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-primary-800 uppercase tracking-[0.04em] mb-1.5">Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full border border-black/15 rounded-lg px-3.5 py-2.5 text-[13px] bg-surface-50 focus:outline-none focus:border-primary-800 focus:bg-white transition-colors font-sans text-primary-800 placeholder:text-black/25"
              @keyup.enter="login"
            />
          </div>

          <p v-if="error" class="text-[13px] text-danger-700">{{ error }}</p>

          <button
            class="w-full bg-primary-800 hover:bg-primary-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-[14px] font-semibold transition-colors mt-1"
            :disabled="isLoading"
            @click="login"
          >
            {{ isLoading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>

        <div class="px-8 py-4 border-t border-black/[0.05] bg-surface-50">
          <p class="text-[12px] text-black/30 text-center font-light">
            Need access? <a href="mailto:hello@pelorus.ai" class="text-primary-800 font-medium hover:underline">Contact us</a>
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
