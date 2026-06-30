/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette "midnight aurora": fondali profondi + accento viola→ciano.
        brand: {
          50: '#f3f1ff',
          100: '#e9e5ff',
          200: '#d6ccff',
          300: '#b8a6ff',
          400: '#9a7dff',
          500: '#7c54f6',
          600: '#6a3def',
          700: '#5a2fd6',
          800: '#4a27ad',
          900: '#3d2389',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
        },
        ink: {
          950: '#0a0a12',
          900: '#0f0f1a',
          850: '#15151f',
          800: '#1c1c2a',
          700: '#272739',
          600: '#373750',
          400: '#6c6c8a',
          200: '#b4b4cf',
        },
        accent: {
          green: '#34d399',
          amber: '#fbbf24',
          red: '#fb5a6a',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,84,246,0.25), 0 8px 30px -8px rgba(124,84,246,0.45)',
        soft: '0 10px 40px -12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7c54f6 0%, #22d3ee 100%)',
        aurora:
          'radial-gradient(60% 50% at 15% 0%, rgba(124,84,246,0.18), transparent 60%), radial-gradient(50% 45% at 100% 10%, rgba(34,211,238,0.12), transparent 55%)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(251,90,106,0.5)' },
          '70%': { boxShadow: '0 0 0 9px rgba(251,90,106,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(251,90,106,0)' },
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
