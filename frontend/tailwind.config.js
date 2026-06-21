/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        signal: {
          green: '#00d4aa',
          red: '#ff4757',
          yellow: '#ffa502',
          greenDim: '#00d4aa22',
          redDim: '#ff475722',
          yellowDim: '#ffa50222',
        },
        bg: {
          primary: '#0a0e1a',
          card: '#111827',
          elevated: '#1a2234',
          hover: '#1f2937',
        },
        border: {
          DEFAULT: '#1f2937',
          subtle: '#161d2b',
          bright: '#2d3748',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#475569',
          accent: '#00d4aa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.5), 0 1px 2px 0 rgba(0,0,0,0.4)',
        elevated: '0 4px 6px -1px rgba(0,0,0,0.6), 0 2px 4px -1px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(0,212,170,0.15)',
        glowRed: '0 0 20px rgba(255,71,87,0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
