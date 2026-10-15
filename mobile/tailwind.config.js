/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './providers/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Apple HIG System Tint (Dark Mode)
        primary: {
          DEFAULT: '#0091FF',
          light: '#3CD3FE',
          dark: '#0077ED',
        },
        // Apple Semantic Accents
        apple: {
          blue: '#0091FF',
          cyan: '#3CD3FE',
          teal: '#00D2E0',
          green: '#30D158',
          orange: '#FF9F0A',
          red: '#FF453A',
          purple: '#BF5AF2',
          gray: '#8E8E93',
          gray2: '#636366',
          gray3: '#48484A',
          gray4: '#3A3A3C',
          gray5: '#2C2C2E',
          gray6: '#1C1C1E',
        },
        // Semantic status
        success: { DEFAULT: '#30D158', light: '#34C759', dark: '#248A3D' },
        warning: { DEFAULT: '#FF9F0A', light: '#FFD60A', dark: '#C97800' },
        danger: { DEFAULT: '#FF453A', light: '#FF6961', dark: '#D70015' },
        info: { DEFAULT: '#64D2FF', light: '#70D7FF', dark: '#0071A4' },
        // Apple Dark Mode System Surfaces
        surface: {
          DEFAULT: '#1C1C1E',
          base: '#000000',
          dark: '#000000',
          secondary: '#1C1C1E',
          elevated: '#2C2C2E',
          quaternary: '#3A3A3C',
        },
        // Apple Label Hierarchy
        label: {
          DEFAULT: '#FFFFFF',
          primary: '#FFFFFF',
          secondary: 'rgba(235, 235, 245, 0.60)',
          tertiary: 'rgba(235, 235, 245, 0.35)',
          quaternary: 'rgba(235, 235, 245, 0.18)',
        },
        separator: 'rgba(84, 84, 88, 0.55)',
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '28px',
        pill: '9999px',
      },
      zIndex: {
        base: '0',
        raised: '10',
        overlay: '20',
        modal: '30',
        toast: '40',
        top: '50',
      },
    },
  },
  plugins: [],
};
