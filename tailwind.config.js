/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          30: '#403D7D',
          50: '#5B5BB3',
          60: '#686AD2',
        },
        secondary: {
          60: '#167EB0',
          100: '#8AD2EE',
        },
        neutral: {
          50: '#5B6571',
        },
        'trustvc-purple': "#686AD2",
        'trustvc-button-purple': "#5B5BB3",
        'trustvc-blue': "#167EB0",
        'trustvc-subtext-grey': '#5B6571'
      },
      fontFamily: {
        gilroy: ['Gilroy', 'sans-serif'],
        avenir: ["Avenir", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
}
