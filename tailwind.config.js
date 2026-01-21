/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        avenir: ["Avenir", "ui-sans-serif", "system-ui"],
        poppins: ["Poppins", "ui-sans-serif", "system-ui"],
      },
      colors: {
        'trustvc-purple': "#686AD2",
        'trustvc-button-purple': "#5B5BB3",
        'trustvc-blue': "#167EB0",
        'trustvc-subtext-grey': '#5B6571'
      }
    },
  },
  plugins: [],
}
