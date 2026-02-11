/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#3fa9f5',
          secondary: '#1d3d5e',
          dark: '#0b2641',
          medium: '#385980',
          light: '#81bad1',
          sky: '#6fb6e8',
          purple: '#a78bfa',
          pink: '#e5a4e6',
        },
        ink: {
          900: '#0b2641',
          700: '#1d3d5e',
          500: '#385980',
          400: '#64748b',
        },
        surface: {
          plain: '#ffffff',
          raise: '#f5f8fb',
          soft: '#eef4fa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Now', 'sans-serif'],
        display: ['Helvetica Now', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        body: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 22px rgba(11, 38, 65, 0.08)',
        'premium-lg': '0 24px 48px rgba(11, 38, 65, 0.18)',
      },
      keyframes: {
        'page-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-slide-in': {
          '0%': { transform: 'translateX(120%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      },
      animation: {
        'page-fade-in': 'page-fade-in 0.3s ease',
        'toast-slide-in': 'toast-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }
    },
  },
  plugins: [],
};
