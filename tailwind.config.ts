import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EAB308',
          hover: '#CA8A04',
          foreground: '#1F2937',
        },
        sidebar: {
          DEFAULT: '#3B2718',
          hover: '#6C4A28',
        },
        background: '#FDF9EE',
        surface: '#FFFFFF',
        border: '#E7E2D9',
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          muted: '#6B7280',
        },
        success: '#16A34A',
        warning: '#FACC15',
        danger: '#EF4444',
      },
      borderRadius: {
        lg: '12px',
        md: '10px',
        sm: '8px',
      },
    },
  },
  plugins: [],
}

export default config
