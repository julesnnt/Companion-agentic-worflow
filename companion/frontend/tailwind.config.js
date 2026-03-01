/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        sidebar: {
          bg:     '#0F172A',
          hover:  '#1E293B',
          active: '#1E293B',
          border: '#1E293B',
          text:   '#CBD5E1',
          muted:  '#64748B',
          brand:  '#2DD4BF',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        xs:    ['12px', { lineHeight: '18px' }],
        sm:    ['13px', { lineHeight: '20px' }],
        base:  ['14px', { lineHeight: '22px' }],
        md:    ['15px', { lineHeight: '24px' }],
        lg:    ['17px', { lineHeight: '26px' }],
        xl:    ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
        '3xl': ['30px', { lineHeight: '38px', letterSpacing: '-0.02em' }],
      },
      boxShadow: {
        xs:    '0 1px 2px 0 rgba(0,0,0,0.05)',
        sm:    '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.05)',
        card:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        modal: '0 24px 48px -12px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        sm:    '6px',
        DEFAULT:'8px',
        md:    '10px',
        lg:    '12px',
        xl:    '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      animation: {
        fadeIn:  'fadeIn 0.2s ease-out',
        slideUp: 'slideUp 0.25s ease-out',
        shimmer: 'shimmer 1.5s infinite linear',
      },
    },
  },
  plugins: [],
}
