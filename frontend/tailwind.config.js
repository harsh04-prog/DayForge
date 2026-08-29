/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Royal Purple Brand Primary
        brand: {
          50: '#F0EEFC',
          100: '#E2DEF9',
          200: '#C5BDF3',
          300: '#A89BED',
          400: '#8A7AE7',
          500: '#6C5CE7', // Royal Purple Primary
          600: '#5A48DE',
          700: '#4635CB',
          800: '#3525A4',
          900: '#26197E',
          DEFAULT: '#6C5CE7',
        },
        // Warm Gold Secondary Accent
        gold: {
          50: '#FFF9ED',
          100: '#FFF0D3',
          200: '#FFE0A8',
          300: '#FFCE7C',
          400: '#FFBD50',
          500: '#FFB547', // Warm Gold Secondary
          600: '#E59F33',
          700: '#BF7F20',
          800: '#996112',
          900: '#7A4B0A',
          DEFAULT: '#FFB547',
        },
        // Surface & Background Tokens
        app: {
          lightBg: '#F8F9FC', // Soft Off-White
          lightCard: '#FFFFFF', // Crisp White
          darkBg: '#0F121C',   // Deep Dark Slate with Purple Tint
          darkCard: '#181B26', // Dark Charcoal Surface
          darkCardElevated: '#1E2232', // Elevated Dark Surface
          darkBorder: '#2E3348',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'soft-lg': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
        'purple-glow': '0 0 20px rgba(108, 92, 231, 0.35)',
        'gold-glow': '0 0 15px rgba(255, 181, 71, 0.35)',
      }
    },
  },
  plugins: [],
}
