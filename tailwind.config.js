/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    'app/modern-chat-pulse/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'holly-primary': '#a78bfa', // purple-400
        'holly-accent': '#f472b6',  // pink-400
        'holly-secondary': '#f9a8d4', // pink-300
      },
    },
  },
  plugins: [],
} 