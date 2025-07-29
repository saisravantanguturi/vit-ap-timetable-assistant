/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode based on 'dark' class on HTML element
  theme: {
    extend: {
      colors: {
        // These colors reference your CSS variables defined in index.css
        primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        'primary-fg': 'rgb(var(--color-primary-fg-rgb) / <alpha-value>)',
        background: 'rgb(var(--color-bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        'text-base': 'rgb(var(--color-text-base-rgb) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted-rgb) / <alpha-value>)',
        'border-color': 'rgb(var(--color-border-rgb) / <alpha-value>)',
        'input-bg': 'rgb(var(--color-input-bg-rgb) / <alpha-value>)',
        'ring-color': 'rgb(var(--color-ring-rgb) / <alpha-value>)'
      }
    },
  },
  plugins: [],
}