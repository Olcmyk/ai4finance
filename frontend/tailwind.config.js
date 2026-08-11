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
        success: '#9A845F',
        warning: '#E8D4B8',
        danger: '#B49D76',
        income: '#9A845F',
        expense: '#B49D76',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(201, 181, 145, 0.15)',
        'soft-lg': '0 4px 16px rgba(201, 181, 145, 0.2)',
        'soft-xl': '0 8px 24px rgba(201, 181, 145, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
