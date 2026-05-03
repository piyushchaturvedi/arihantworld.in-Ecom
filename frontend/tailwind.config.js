/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Jost', 'sans-serif'],
      },
      colors: {
        cream: '#f7f2eb',
        gold: '#b8973a',
        'gold-light': '#d4af5a',
        'gold-dark': '#8a6e20',
        stone: '#e8dfd0',
        charcoal: '#2a2520',
        warm: '#5c4a35',
      },
      letterSpacing: {
        widests: '0.2em',
      },
    },
  },
  plugins: [],
}
