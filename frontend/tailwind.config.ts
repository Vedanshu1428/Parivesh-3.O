/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        cecb: {
          green: {
            50:  '#FCF9EA',
            100: '#EBF1DF',
            200: '#D5DFCC',
            300: '#C2CDBB',
            400: '#A8BBA3',
            500: '#97A87A',
            600: '#869868',
            700: '#6C7E4F',
            800: '#4D5E37',
            900: '#34451A',
          },
          blue: {
            50:  '#E3F2FD',
            500: '#2196F3',
            700: '#1565C0',
            900: '#0D47A1',
          },
        },
        primary: {
          DEFAULT: '#97A87A',
          foreground: '#ffffff',
          50:  '#FCF9EA',
          600: '#869868',
          700: '#6C7E4F',
        },
        secondary: {
          DEFAULT: '#A8BBA3',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#FFA239',
          foreground: '#ffffff',
        },
        background: {
          DEFAULT: '#FCF9EA',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        devanagari: ['"Noto Sans Devanagari"', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        shimmer: { '0%, 100%': { backgroundPosition: '-200% 0' }, '50%': { backgroundPosition: '200% 0' } },
        pulse: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'gradient-cecb': 'linear-gradient(135deg, #97A87A 0%, #A8BBA3 100%)',
        'gradient-soft': 'linear-gradient(135deg, #FCF9EA 0%, #EBF1DF 100%)',
      },
    },
  },
  plugins: [],
};
