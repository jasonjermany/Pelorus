// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit'],
    },
    server: {
      allowedHosts: ['laming-aerogenically-roxana.ngrok-free.dev']
    }
  },
  runtimeConfig: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_KEY,
    voyageApiKey: process.env.VOYAGE_API_KEY,
    reductoApiKey: process.env.REDUCTO_API_KEY,
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
