/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          30: '#403D7D',
          50: '#5B5BB3',
          60: '#686AD2',
          DEFAULT: '#686AD2',
        },
        secondary: {
          60: '#167EB0',
          100: '#8AD2EE',
        },
        neutral: {
          10: '#1E2026',
          20: '#3D444D',
          30: '#5B6571',
          33: '#A9B2BB54',
          50: '#A9B2BB',
          60: '#DEE4E9',
        },
        alert: {
          20: '#661228',
          50: '#B83152',
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
