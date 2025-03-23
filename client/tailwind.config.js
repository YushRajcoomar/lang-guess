/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", 
    "./src/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        'spotify': '#1db954',
        'spotify-hover': '#1ed760',
        'correct': '#27ae60',
        'incorrect': '#e74c3c',
        'selected': '#3498db',
        'submitted': '#ff7800',
      },
      backgroundColor: {
        'dark-overlay': 'rgba(33, 33, 33, 0.85)',
        'light-overlay': 'rgba(255, 255, 255, 0.1)',
      },
      boxShadow: {
        'player': '0 4px 15px rgba(0, 0, 0, 0.3)',
        'spotify': '0 2px 8px rgba(29, 185, 84, 0.3)',
        'confirm': '0 2px 8px rgba(39, 174, 96, 0.3)',
      },
      transitionProperty: {
        'width': 'width',
      }
    },
  },
  plugins: [],
}

