/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f8f2',
          100: '#d8eadb',
          200: '#b8d9c0',
          300: '#8fc4a0',
          400: '#66ad80',
          500: '#4b8b61',
          600: '#3a704d',
          700: '#2f5a3e',
          800: '#274833',
          900: '#1f3a2a',
        },
        amber: {
          50: '#fdf8ef',
          100: '#f9ecd4',
          200: '#f0d5a5',
          300: '#e5b96e',
          400: '#d99f42',
          500: '#c8943d',
          600: '#b0782c',
          700: '#8e5a24',
          800: '#754821',
          900: '#623c1f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
