/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern SaaS color palette
        background: '#F9FAFB',
        card: '#FFFFFF',

        // Primary tech blue
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },

        // AI accent purple
        ai: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
        },

        // Success green (for income/positive trends)
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },

        // Semantic colors
        income: {
          light: '#ECFDF5',
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        expense: {
          light: '#FEF2F2',
          DEFAULT: '#EF4444',
          dark: '#DC2626',
        },
        balance: {
          light: '#EFF6FF',
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
        },

        // Neutral grays
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        // Sans-serif for everything
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        // Tabular numbers for financial data
        mono: ['Roboto Mono', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        // Subtle, modern shadows
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      backdropBlur: {
        xs: '2px',
      },
      fontSize: {
        'display-1': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-2': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-3': ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
}
