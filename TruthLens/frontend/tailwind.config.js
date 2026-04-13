/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Editorial neutral palette
        ink: {
          900: '#111111',
          800: '#1a1a1a',
          700: '#2d2d2d',
          600: '#4a4a4a',
          500: '#6b6b6b',
          400: '#9a9a9a',
          300: '#c4c4c4',
          200: '#e0e0e0',
          100: '#f0f0f0',
          50:  '#fafaf9',
        },
        // Professional accent blue (Reuters/BBC-style)
        brand: {
          700: '#1e3a8a',
          600: '#1d4ed8',
          500: '#2563eb',
          400: '#3b82f6',
          100: '#dbeafe',
          50:  '#eff6ff',
        },
        // Credibility signal colors (muted)
        signal: {
          green:  '#15803d',
          greenBg:'#f0fdf4',
          amber:  '#b45309',
          amberBg:'#fffbeb',
          red:    '#b91c1c',
          redBg:  '#fef2f2',
        },
      },
      fontFamily: {
        serif:   ['"Georgia"', '"Times New Roman"', 'serif'],
        sans:    ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
        'shimmer':  'shimmer 1.8s infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: {
          '0%':   { backgroundPosition: '-400% 0' },
          '100%': { backgroundPosition: '400% 0' },
        },
      },
      boxShadow: {
        'card':  '0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        'panel': '0 4px 16px rgba(0,0,0,0.10)',
        'input': '0 0 0 3px rgba(37,99,235,0.15)',
      },
    },
  },
  plugins: [],
};
