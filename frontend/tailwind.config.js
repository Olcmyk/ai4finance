/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          gold: '#D4AF37',
          lightGold: '#DAA520',
          darkGold: '#B8860B',
          beige: '#C9B591',
          lightBeige: '#F5F1E8',
          cream: '#FAF8F3',
          brown: '#8B7355',
          darkBrown: '#4A3F2E',
          charcoal: '#2C2416',
          border: '#E8DCC8',
        },
        beige: {
          50: '#FDFCF9',
          100: '#F9F6F0',
          200: '#F5E6D3',
          300: '#E8D4B8',
          400: '#D4C4A8',
          500: '#C9B591',
          600: '#B49D76',
          700: '#9A845F',
          800: '#7D6B4C',
          900: '#5D5038',
        },
        primary: '#D4AF37',
        success: '#B8860B',
        warning: '#DAA520',
        danger: '#8B7355',
        info: '#D4AF37',
        income: {
          light: '#F5F1E8',
          DEFAULT: '#B8860B',
          dark: '#8B7355',
        },
        expense: {
          light: '#F5F1E8',
          DEFAULT: '#8B7355',
          dark: '#4A3F2E',
        },
        balance: {
          light: '#FAF8F3',
          DEFAULT: '#D4AF37',
          dark: '#B8860B',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Lora', 'Charter', 'Georgia', 'serif'],
      },
      boxShadow: {
        'luxury': '0 2px 8px rgba(212, 175, 55, 0.08)',
        'luxury-md': '0 4px 16px rgba(212, 175, 55, 0.12)',
        'luxury-lg': '0 8px 24px rgba(212, 175, 55, 0.16)',
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.3)',
        'soft': '0 2px 8px rgba(201, 181, 145, 0.15)',
        'soft-lg': '0 4px 16px rgba(201, 181, 145, 0.2)',
        'soft-xl': '0 8px 24px rgba(201, 181, 145, 0.25)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.4)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.4)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
