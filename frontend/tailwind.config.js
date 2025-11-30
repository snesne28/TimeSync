/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b", // Deep zinc black
        surface: "#18181b",    // Slightly lighter zinc
        primary: "#3b82f6",    // Vibrant Blue
        accent: "#8b5cf6",     // Violet
      }
    },
  },
  plugins: [],
}