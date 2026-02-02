import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta DesignHire: laranja vibrante como destaque (modo claro e escuro)
        primary: {
          DEFAULT: '#F97316', // Laranja vibrante (accent)
          hover: '#EA580C',
          soft: '#FDBA74', // Laranja claro
        },
        secondary: {
          DEFAULT: '#FAFAFA', // Surface light
        },
        accent: {
          DEFAULT: '#F97316', // Mesmo laranja
        },
        background: {
          DEFAULT: '#FFFFFF',
          soft: '#F5F5F5', // Cinza muito claro (modo claro)
        },
        border: {
          DEFAULT: '#E5E5E5',
        },
        text: {
          primary: '#1a1a1a',
          secondary: '#6b6b6b',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        // Dark Mode — Mesma paleta: fundos escuros + laranja vibrante
        dark: {
          primary: '#F97316',
          'primary-surface': '#2d2d2d',
          secondary: '#2d2d2d',
          accent: '#F97316',
          background: '#1a1a1a',
          card: '#2d2d2d',
          border: '#404040',
          text: {
            primary: '#f5f5f5',
            secondary: '#c0c0c0',
          },
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        'card-light': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}
export default config
