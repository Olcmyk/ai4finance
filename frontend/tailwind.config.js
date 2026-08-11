/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
        primary: '#C9B591',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        income: {
          light: '#d1fae5',
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        expense: {
          light: '#fee2e2',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        balance: {
          light: '#dbeafe',
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
        },
      },
      boxShadow: {
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
