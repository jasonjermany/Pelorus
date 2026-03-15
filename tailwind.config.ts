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
      colors: {
        primary: {
          600: '#1B4A7D',
          700: '#12355B',
          800: '#0D2742',
        },
        accent: {
          500: '#E58F65',
          600: '#CF7A51',
        },
        success: {
          500: '#16A34A',
          700: '#15803D',
        },
        danger: {
          500: '#DC2626',
          700: '#B91C1C',
        },
        surface: {
          50: '#FBFEF9',
          100: '#F4F8F1',
        },
      },
      boxShadow: {
        card: '0 10px 24px rgba(18, 53, 91, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config
