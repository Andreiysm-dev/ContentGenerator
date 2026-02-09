/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0b2641',
        'brand-dark-alt': '#1d3d5e',
        'brand-primary': '#3fa9f5',
        'brand-accent-purple': '#a78bfa',
        'brand-accent-pink': '#e5a4e6',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Now', 'sans-serif'],
        body: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
