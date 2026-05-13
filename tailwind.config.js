/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          30: '#403D7D',
          40: '#4D4B98', // Base color for Primary-40 variants
          50: '#5B5BB3', // Primary-100-50
          60: '#686AD2', // Primary-100-60
          90: '#AAAEE6', // Base color for Primary-90 variants
          100: '#C2C5F0', // Base color for Primary-100 variants
          DEFAULT: '#686AD2',
        },
        secondary: {
          60: '#167EB0',
          100: '#8AD2EE',
        },
        neutral: {
          10: '#1E2026', // Neutral-100-10
          20: '#3D444D',
          30: '#5B6571', // Neutral-100-30
          50: '#A9B2BB', // Neutral-100-50
          60: '#DEE4E9',
          90: '#A9B2BB', // Base color for Neutral-90 variants
        },
        alert: {
          20: '#661228',
          50: '#B83152',
          100: '#FDDAE2',
        },
        base: {
          '66-l1': 'rgba(255, 255, 255, 0.66)',
          '66-l2': 'rgba(30, 32, 38, 0.66)',
          '100-l1': {
            light: '#FFFFFF',
            dark: '#000000',
          },
          '100-l2-c': {
            light: 'rgba(222, 228, 233, 0.33)',
            dark: 'rgba(30, 32, 38, 0.66)',
          },
        },
      },
      fontFamily: {
        gilroy: ['Gilroy', 'sans-serif'],
        avenir: ['Avenir', 'ui-sans-serif', 'system-ui'],
      },
      fontSize: {
        'submit-title': ['24px', { lineHeight: '133%', letterSpacing: '0%' }],
        'encountering-text': [
          '14px',
          { lineHeight: '155%', letterSpacing: '0%' },
        ],
        'form-label': ['18px', { lineHeight: '136%', letterSpacing: '0%' }],
      },
      fontWeight: {
        medium: '500',
      },
      boxShadow: {
        'form-card': '0px 8px 32px rgba(104, 106, 210, 0.33)',
        'form-card-dark': '0px 8px 32px 0px #686AD2',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(-50%, 0, 0)' },
        },
      },
      animation: {
        marquee: 'marquee 1400s linear infinite',
      },
      backgroundImage: {
        'overlay-light':
          'linear-gradient(0deg, rgba(255, 255, 255, 0.66), rgba(255, 255, 255, 0.66)), linear-gradient(0deg, rgba(222, 228, 233, 0), rgba(222, 228, 233, 0))',
        'overlay-dark':
          'linear-gradient(0deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0)), linear-gradient(0deg, rgba(30, 32, 38, 0.66), rgba(30, 32, 38, 0.66))',
        'form-fields-light':
          'linear-gradient(0deg, #FFFFFF, #FFFFFF), linear-gradient(0deg, rgba(222, 228, 233, 0.33), rgba(222, 228, 233, 0.33))',
        'form-fields-dark':
          'linear-gradient(0deg, #000000, #000000), linear-gradient(0deg, rgba(30, 32, 38, 0.66), rgba(30, 32, 38, 0.66))',
        'divider-light':
          'linear-gradient(0deg, rgba(255, 255, 255, 0.66), rgba(255, 255, 255, 0.66)), linear-gradient(0deg, rgba(222, 228, 233, 0), rgba(222, 228, 233, 0))',
        'divider-dark':
          'linear-gradient(0deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0)), linear-gradient(0deg, rgba(30, 32, 38, 0.66), rgba(30, 32, 38, 0.66))',
      },
    },
    alert: {
      20: '#661228',
      50: '#B83152',
    },
  },
}
