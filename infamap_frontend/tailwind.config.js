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
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      },
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Дополнительные брейкпоинты для мобильных
        'mobile': {'max': '767px'},
        'tablet': {'min': '768px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
        'touch': {'raw': '(pointer: coarse)'},
        'landscape-mobile': {
          'raw': '(orientation: landscape) and (max-height: 600px)'
        },
        'ios': {'raw': '(-webkit-touch-callout: none)'},
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'dvh': '100dvh', // Dynamic viewport height
      },
      maxHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'mobile-panel': '40vh',
        'mobile-modal': '90vh',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'slide-in-top': 'slideInFromTop 0.3s ease-out',
        'slide-in-bottom': 'slideInFromBottom 0.3s ease-out',
        'slide-in-left': 'slideInFromLeft 0.3s ease-out',
        'slide-in-right': 'slideInFromRight 0.3s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      zIndex: {
        'modal': '1000',
        'panel': '1000',
        'panel-toggle': '1001',
        'tooltip': '1002',
        'notification': '1003',
      }
    },
  },
  plugins: [
    // Плагин для утилит с учетом безопасных зон (notch)
    function({ addUtilities }) {
      const newUtilities = {
        '.touch-action-pan-x-pan-y': {
          'touch-action': 'pan-x pan-y',
        },
        '.touch-action-manipulation': {
          'touch-action': 'manipulation',
        },
        '.backface-visibility-hidden': {
          'backface-visibility': 'hidden',
          '-webkit-backface-visibility': 'hidden',
        },
        '.transform-gpu': {
          'transform': 'translateZ(0)',
          '-webkit-transform': 'translateZ(0)',
        },
        '.overflow-scrolling-touch': {
          '-webkit-overflow-scrolling': 'touch',
        },
        // Утилиты для предотвращения зума на iOS
        '.prevent-zoom': {
          'font-size': '16px',
        },
        // Утилиты для безопасных зон
        '.pt-safe': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.pb-safe': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.pl-safe': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.pr-safe': {
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.p-safe': {
          'padding': 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
} 