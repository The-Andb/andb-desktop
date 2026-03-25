/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        '2xs': ['calc(var(--font-quote) * 0.85)', { lineHeight: '1rem' }],
        'xs': ['var(--font-quote)', { lineHeight: '1.25rem' }],
        'sm': ['var(--font-content)', { lineHeight: '1.5rem' }],
        'base': ['calc(var(--font-content) * 1.1)', { lineHeight: '1.5rem' }],
        'lg': ['var(--font-subtitle)', { lineHeight: '1.75rem' }],
        'xl': ['var(--font-title)', { lineHeight: '2rem' }],
        '2xl': ['calc(var(--font-title) * 1.25)', { lineHeight: '2.25rem' }],
        '3xl': ['calc(var(--font-title) * 1.5)', { lineHeight: '2.5rem' }],
        '4xl': ['calc(var(--font-title) * 1.8)', { lineHeight: '3rem' }],
      },
      colors: {
        "panel-dark": "#111621",
        "background-dark": "#0a0e17",
        "conflict": "#f59e0b",
        primary: {
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
          950: 'var(--primary-950)',
        },
        gray: {
          50: '#f8f8f8',
          100: '#f3f3f3', // VS Code Light Sidebar
          200: '#e5e5e5',
          300: '#cccccc',
          400: '#a3a3a3',
          500: '#858585',
          600: '#525252',
          700: '#3c3c3c', // VS Code Dark Header
          800: '#252526', // VS Code Dark Sidebar
          900: '#1e1e1e', // VS Code Dark Background
          950: '#121212',
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require("tailwindcss-animate"),
  ],
  darkMode: 'class',
}
