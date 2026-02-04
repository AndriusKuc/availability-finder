/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF8832',
          dark: '#E67620',
          light: '#FFA05C',
        },
        success: '#6BBA8C',
        danger: '#EB0000',
        beige: {
          light: '#FAF5F2',
          DEFAULT: '#F4EBE2',
        },
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};
