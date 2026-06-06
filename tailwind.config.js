/** @type {import('tailwindcss').Config} */
export default {
  content: ['./*.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        ink:    '#0c2535',
        teal:   '#00a7b5',
        tealdk: '#007e8a',
        amber:  '#F46DDCCC',
        mint:   '#e6f7f8',
        cream:  '#fbf8f2',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans:    ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
}
