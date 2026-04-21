import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,ts,js,jsx,tsx}',
    './components/**/*.{vue,ts,js,jsx,tsx}',
    './composables/**/*.{ts,js}',
    './server/**/*.{ts,js}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: '#0B1829',
        // Navy — primary brand color (replaces old primary-700 blue)
        primary: {
          600: '#1a3356',
          700: '#112240',
          800: '#0a1628',
          900: '#060f1a',
        },
        // Gold — accent (replaces old orange accent)
        accent: {
          400: '#e8c96e',
          500: '#c9a84c',
          600: '#a8882e',
        },
        // Cream — background and surface
        surface: {
          50:  '#f5f0e8',
          100: '#ece5d8',
          200: '#ddd4c0',
        },
        // Success — unchanged
        success: {
          50:  '#f0fdf4',
          200: '#bbf7d0',
          500: '#22c55e',
          700: '#15803d',
        },
        // Danger — unchanged
        danger: {
          50:  '#fef2f2',
          200: '#fecaca',
          500: '#ef4444',
          700: '#dc2626',
        },
        // Warn — for REFER state (gold-amber)
        warn: {
          50:  '#fffbeb',
          200: '#fde68a',
          500: '#c9a84c',
          700: '#92690e',
        },
      },
      boxShadow: {
        card: '0 2px 12px rgba(10, 22, 40, 0.06)',
        banner: '0 8px 32px rgba(10, 22, 40, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config