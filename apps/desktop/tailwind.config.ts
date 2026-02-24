import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#104d78',
          50: '#e8f4fd',
          100: '#c5e2f8',
          200: '#9dccf2',
          300: '#74b6ec',
          400: '#4a9fe5',
          500: '#2188de',
          600: '#1a6db2',
          700: '#104d78',
          800: '#0b3654',
          900: '#061f30',
          950: '#031018',
        },
        success: {
          DEFAULT: '#16a34a',
          50: '#f0fdf4',
          500: '#16a34a',
          600: '#15803d',
        },
        warning: {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        info: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
        severity: {
          low: '#16a34a',
          medium: '#f59e0b',
          high: '#f97316',
          critical: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
