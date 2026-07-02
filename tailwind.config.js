/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Blu primario (bolle in uscita, azioni)
        brand: {
          50: '#eff5ff',
          100: '#dbe8ff',
          200: '#bcd4ff',
          300: '#93b8ff',
          400: '#5b9bff',
          500: '#3b82f6',
          600: '#2f6fe0',
          700: '#2a5fc0',
          800: '#274f9c',
          900: '#1e3a8a',
        },
        // Verde-acqua (bolle in arrivo, accento amichevole)
        teal: {
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0f9e8f',
        },
        // Fondali navy morbidi (nome "ink" mantenuto per compatibilità)
        ink: {
          950: '#0b1120',
          900: '#0f1728',
          850: '#16203a',
          800: '#1e2a48',
          700: '#2a3860',
          600: '#3a4a72',
          400: '#8092b8',
          200: '#ccd4e6',
        },
        cyan: {
          400: '#22c6e0',
          500: '#0ea5c4',
        },
        accent: {
          green: '#22c55e',
          amber: '#f59e0b',
          orange: '#f59e0b',
          yellow: '#facc15',
          red: '#f0475b',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 8px 26px -10px rgba(59,130,246,0.55)',
        soft: '0 14px 44px -16px rgba(0,0,0,0.7)',
        pill: '0 10px 30px -6px rgba(0,0,0,0.55)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(240,71,91,0.5)' },
          '70%': { boxShadow: '0 0 0 9px rgba(240,71,91,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(240,71,91,0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(14px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s infinite',
        'slide-up': 'slide-up 0.22s cubic-bezier(0.22,1,0.36,1)',
      },
    },
  },
  plugins: [],
}
