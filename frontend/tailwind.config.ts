import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Custom brand colors
        cream: {
          50: '#fdfbf7',
          100: '#fbf8f0',
          200: '#f7f4ef',
          300: '#f0ebe3',
          400: '#e8e2d8',
          500: '#d5ccbd',
        },
        ink: {
          DEFAULT: '#1c1814',
          soft: '#5a5248',
          muted: '#8a8478',
          faint: '#b8b2a8',
        },
        clay: {
          DEFAULT: '#c84b31',
          dark: '#b03d23',
          light: '#e85d3a',
          subtle: '#f5e6e0',
          pale: '#fcf2ed',
        },
        teal: {
          DEFAULT: '#2d5a5a',
          light: '#3d7a7a',
          pale: '#e8f0f0',
        },
        surface: {
          DEFAULT: '#ffffff',
          warm: '#f7f4ef',
          hover: '#f3efe9',
          card: '#ffffff',
          tile: '#1a1814',
        },
        border: {
          DEFAULT: '#e8e2d8',
          light: '#f0ebe3',
        },
        destructive: {
          DEFAULT: '#c84b31',
          foreground: '#ffffff',
        },
        primary: {
          DEFAULT: '#c84b31',
          foreground: '#ffffff',
          50: '#fcf2ed',
          100: '#f5e6e0',
          200: '#e8c4b5',
          300: '#d99a82',
          400: '#c84b31',
          500: '#b03d23',
          600: '#8a2e1a',
        },
        secondary: {
          DEFAULT: '#2d5a5a',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#c84b31',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#f7f4ef',
          foreground: '#8a8478',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1c1814',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#1c1814',
        },
        background: '#f7f4ef',
        foreground: '#1c1814',
        input: '#e8e2d8',
        ring: '#c84b31',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['Sora', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Editorial typographic scale
        'hero': ['64px', { lineHeight: '1.05', fontWeight: '400', letterSpacing: '-0.02em' }],
        'display-xl': ['52px', { lineHeight: '1.08', fontWeight: '400', letterSpacing: '-0.015em' }],
        'display-lg': ['42px', { lineHeight: '1.1', fontWeight: '400', letterSpacing: '-0.01em' }],
        'display-md': ['32px', { lineHeight: '1.2', fontWeight: '400', letterSpacing: '-0.005em' }],
        'display-sm': ['26px', { lineHeight: '1.25', fontWeight: '400', letterSpacing: '0' }],
        'lead': ['22px', { lineHeight: '1.5', fontWeight: '300', letterSpacing: '0.01em' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400', letterSpacing: '0' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400', letterSpacing: '0' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '0.01em' }],
        'caption': ['13px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.02em' }],
        'caption-sm': ['11px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.04em' }],
        'micro': ['10px', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '0.06em' }],
      },
      borderRadius: {
        'editorial': '16px',
        'editorial-sm': '10px',
        'editorial-xs': '6px',
        'pill': '9999px',
        'full': '9999px',
      },
      spacing: {
        'section': '96px',
        'section-sm': '64px',
        'block': '48px',
        'block-sm': '32px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(28, 24, 20, 0.04), 0 4px 12px rgba(28, 24, 20, 0.06)',
        'card-hover': '0 2px 8px rgba(28, 24, 20, 0.06), 0 12px 32px rgba(28, 24, 20, 0.08)',
        'elevated': '0 4px 16px rgba(28, 24, 20, 0.08), 0 20px 48px rgba(28, 24, 20, 0.10)',
        'modal': '0 8px 32px rgba(28, 24, 20, 0.12), 0 40px 64px rgba(28, 24, 20, 0.14)',
      },
      maxWidth: {
        'reading': '720px',
        'content': '980px',
        'grid': '1280px',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
