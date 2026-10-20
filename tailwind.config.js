/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        header: ['"Cinzel"', '"Philosopher"', 'serif'],
        ui: ['"Montserrat"', '"Nunito"', 'sans-serif'],
        display: ['"Russo One"', 'sans-serif'],
      },
      dropShadow: {
        'text': '0 2px 4px rgba(0,0,0,1)',
      }
    },
  },
  plugins: [],
}
