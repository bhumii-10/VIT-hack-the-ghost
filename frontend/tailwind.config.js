/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'crisis-red': '#FF3B30',
        'warning-orange': '#FF9500',
        'safe-green': '#34C759',
        'info-blue': '#007AFF',
        'crisis-cyan': '#06B6D4',

        // Tactical / Dark Mode Specifics
        'glass-bg': 'rgba(20, 20, 30, 0.6)',
        'dark-bg': '#0a0a0f',

        // Signal Colors
        'signal-error': '#ff2a2a',
        'signal-success': '#00ff9d',
        'signal-warn': '#ffcc00',

        // Surface Colors
        'surface-1': '#12121a',
        'surface-2': '#1c1c26',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 4s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
