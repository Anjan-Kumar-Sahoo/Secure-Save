/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: '#090B12',
          surface: '#101421',
          elevated: '#151A29',
          card: '#121626',
          border: 'rgba(175, 166, 255, 0.14)',
          borderSubtle: 'rgba(255, 255, 255, 0.07)',
          accent: '#8B5CF6',
          accentLight: '#B69AFF',
          accentMuted: 'rgba(139, 92, 246, 0.15)',
          text: '#F5F5FA',
          muted: '#9298A8',
          subtle: '#6B7280',
          success: '#2EE6AD',
          danger: '#FF5B79',
          warning: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'glass-hover': '0 24px 60px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        'btn': '0 10px 25px rgba(139, 92, 246, 0.35)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slideUp: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
};
