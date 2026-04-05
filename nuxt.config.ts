// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', 'nuxt-auth-utils'],
  typescript: {
    tsConfig: {
      include: ['types/**/*.d.ts'],
    },
  },
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
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    siteUrl: process.env.SITE_URL || 'https://www.pelorusai.io',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_KEY,
    voyageApiKey: process.env.VOYAGE_API_KEY,
    reductoApiKey: process.env.REDUCTO_API_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
  nitro: {
    externals: {
      external: ['pdfmake'],
      // Force Nitro's file tracer to include pdfmake in the deployment output.
      // Without this, createRequire-based loading is invisible to static analysis
      // and pdfmake never gets copied to .output/server/node_modules/.
      traceInclude: [
        './node_modules/pdfmake/build/pdfmake.js',
        './node_modules/pdfmake/build/vfs_fonts.js',
      ],
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
