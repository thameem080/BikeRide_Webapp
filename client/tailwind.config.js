/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#06110c',
          900: '#0a1a13',
          850: '#0e241b',
          800: '#143024',
          700: '#1b4131',
          600: '#265944',
          500: '#34775c',
        },
        velo: {
          lime: '#10f575',
          'lime-hover': '#05d668',
          'lime-dim': '#0ba953',
          dark: '#08140f',
          surface: '#0f241a',
          surface2: '#163527',
          border: 'rgba(34, 197, 94, 0.18)',
          'border-active': 'rgba(16, 245, 117, 0.55)',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'lime-glow': '0 0 25px -4px rgba(16, 245, 117, 0.45)',
        'lime-glow-lg': '0 0 45px -5px rgba(16, 245, 117, 0.65)',
        'forest-card': '0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(16, 245, 117, 0.12)',
      },
      animation: {
        'pulse-ring': 'pulseRing 1.8s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'soundWave 1.2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8', boxShadow: '0 0 0 0 rgba(16, 245, 117, 0.7)' },
          '70%': { transform: 'scale(1.25)', opacity: '0', boxShadow: '0 0 0 24px rgba(16, 245, 117, 0)' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        soundWave: {
          '0%': { height: '6px' },
          '100%': { height: '32px' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
