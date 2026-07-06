/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{svelte,js}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#0d7377',
          tealHover: '#095c5f',
          tealSoft: '#e0f2fe',
          crimson: '#8B0000',
          crimsonBright: '#dc143c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
