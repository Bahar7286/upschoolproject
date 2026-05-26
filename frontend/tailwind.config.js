/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        heritage: {
          ink: '#0c1222',
          gold: '#c9a227',
          paper: '#f4f0e8',
          ember: '#c45c3e',
        },
        primary: {
          DEFAULT: '#1db954',
          dark: '#158a3e',
        },
      },
      fontFamily: {
        display: ['Sora', 'Nunito', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        rounded: ['Nunito', 'Varela Round', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 8px 24px rgb(0 0 0 / 12%)',
        'lift-dark': '0 12px 40px rgb(0 0 0 / 45%)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.55s ease-out both',
        'float-soft': 'float-soft 5.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
