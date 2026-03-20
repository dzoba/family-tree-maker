/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FEFDFB',
          100: '#FDF9F3',
          200: '#FAF0E4',
          300: '#F5E6D0',
          400: '#EEDBB8',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E6EDE6',
          200: '#C8D9C8',
          300: '#A3BFA3',
          400: '#7DA67D',
          500: '#5C8A5C',
          600: '#4A7049',
          700: '#3D5A3D',
          800: '#334A33',
          900: '#2A3D2A',
        },
        bark: {
          50: '#FAF6F1',
          100: '#F0E8DD',
          200: '#E0CDBA',
          300: '#CCAB8E',
          400: '#B8896A',
          500: '#A07050',
          600: '#8A5E42',
          700: '#6F4B35',
          800: '#5C3E2E',
          900: '#4D3427',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
