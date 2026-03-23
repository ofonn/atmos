import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Atmos Celestial palette
        primary: {
          DEFAULT: '#c7bfff',
          container: '#8f7fff',
          dim: '#c7bfff',
          blue: '#5B96FD',
          light: '#A6C0FF',
          purple: '#B046FB',
          lavender: '#B0AAFF',
        },
        secondary: {
          DEFAULT: '#acc7ff',
          container: '#005ec2',
        },
        surface: {
          DEFAULT: '#10131c',
          dim: '#10131c',
          bright: '#363943',
          container: '#1c1f28',
          'container-low': '#181b24',
          'container-high': '#272a33',
          'container-highest': '#32343e',
          'container-lowest': '#0b0e16',
          variant: '#32343e',
        },
        'on-surface': '#e0e2ee',
        'on-surface-variant': '#c9c4d6',
        'on-primary': '#2b009e',
        'on-primary-container': '#25008c',
        outline: '#928ea0',
        'outline-variant': '#474554',
        'inverse-primary': '#5b47d1',
        dark: '#1A1C26',
      },
      fontFamily: {
        headline: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        body: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        label: ['var(--font-inter)', 'Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #806EF8 0%, #5896FD 100%)',
        'card-gradient': 'linear-gradient(135deg, #A6C0FF 0%, #5B96FD 100%)',
        'atmospheric-glow': 'radial-gradient(circle at 50% -20%, #4329b8 0%, #10131c 70%)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(91, 150, 253, 0.15)',
        card: '0 4px 24px 0 rgba(0, 0, 0, 0.06)',
        ambient: '0 20px 50px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      letterSpacing: {
        tighter: '-0.02em',
      },
    },
  },
  plugins: [],
}
export default config
