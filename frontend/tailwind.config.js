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
          50: '#fffcf0',
          100: '#fff8d7',
          200: '#fff0ae',
          300: '#ffe57a',
          400: '#ffd844',
          500: '#f0b90b', // Main golden theme
          600: '#e6a000',
          700: '#cc8f00',
          800: '#b87a00',
          900: '#a66600',
        },
        secondary: {
          900: '#0a0a0b',
          800: '#1a1a1b',
          700: '#2a2a2b',
          600: '#3a3a3b',
          500: '#4a4a4b',
          400: '#6a6a6b',
          300: '#8a8a8b',
          200: '#aaaaab',
          100: '#cacaca',
          50: '#f5f5f5',
        },
        accent: {
          500: '#ff6b35',
          400: '#ff8c42',
          300: '#ffad4f',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'fade-in-down': 'fadeInDown 0.8s ease-out',
        'fade-in-left': 'fadeInLeft 0.8s ease-out',
        'fade-in-right': 'fadeInRight 0.8s ease-out',
        'scale-in': 'scaleIn 0.6s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #f0b90b, 0 0 10px #f0b90b, 0 0 15px #f0b90b' },
          '100%': { boxShadow: '0 0 10px #f0b90b, 0 0 20px #f0b90b, 0 0 30px #f0b90b' }
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'golden-gradient': 'linear-gradient(135deg, #f0b90b 0%, #ffe57a 100%)',
        'dark-gradient': 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1b 100%)',
      }
    },
  },
  plugins: [],
}
