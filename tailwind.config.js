/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#0F1F3D',      // page background (navy)
        ink: '#F4EEDC',        // primary text and rules (cream)
        'ink-soft': '#CFCBBB', // secondary text
        rule: '#2C3F66',       // hairlines on navy
        accent: '#FF8794',     // coral, for small text and highlights on navy
        good: '#7FD6A0',       // positive change on navy
        flag: '#D7263D',       // red fills (worse tiles, active nav)
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'Impact', 'sans-serif'],
        serif: ['Barlow', 'system-ui', 'sans-serif'],
        mono: ['"Barlow Condensed"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
