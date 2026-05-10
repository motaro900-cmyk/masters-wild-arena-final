/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        header: ['"Philosopher"', 'serif'],
        ui: ['"Exo 2"', 'sans-serif'],
      },
      dropShadow: {
        'text': '0 2px 4px rgba(0,0,0,1)',
      }
    },
  },
  plugins: [],
}