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
        // Light Mode - Paleta DynamicsADM
        primary: {
          DEFAULT: '#00B299', // Teal/Turquesa
          hover: '#009980',
        },
        secondary: {
          DEFAULT: '#F5F5F5', // Cinza claro
        },
        accent: {
          DEFAULT: '#FF8C00', // Laranja
        },
        background: {
          DEFAULT: '#FFFFFF',
          soft: '#F5F5F5',
        },
        border: {
          DEFAULT: '#E5E5E5',
        },
        text: {
          primary: '#333333',
          secondary: '#666666',
        },
        success: '#00B299', // Usando teal para success
        warning: '#FF8C00', // Laranja
        danger: '#DC2626',
        
        // Dark Mode - Paleta DynamicsADM
        dark: {
          primary: '#3B82F6', // Azul (217.2 91.2% 59.8%)
          'primary-surface': '#1E293B',
          secondary: '#1E293B',
          accent: '#FF8C00',
          background: '#0F172A', // Azul escuro (222.2 84% 4.9%)
          card: '#1E293B',
          border: '#334155',
          text: {
            primary: '#F1F5F9',
            secondary: '#CBD5E1',
          },
          success: '#00B299',
          warning: '#FF8C00',
          danger: '#EF4444',
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
