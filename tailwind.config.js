/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '475px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
      colors: {
        brand: {
          50: '#effef7',
          100: '#d8fde9',
          200: '#b0f8d3',
          300: '#7bf1bb',
          400: '#49e5a3',
          500: '#1fcd89',
          600: '#14a872',
          700: '#117f5a',
          800: '#0e6147',
          900: '#0b4f3a',
        },
      },
      boxShadow: {
        card: '0 10px 18px -10px rgba(0,0,0,.25)',
        soft: '0 6px 10px -6px rgba(0,0,0,.2)',
      },
      fontFamily: {
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
