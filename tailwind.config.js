/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
  // Enable prose classes for Markdown content
  safelist: [
    'prose',
    'max-w-none',
    'markdown-preview'
  ]
};
