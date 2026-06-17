/** @type {import('tailwindcss').Config} */
// Theme mirrors the original index.html design tokens: near-black surfaces,
// lime accent, warm orange secondary — athletic and clean.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        surface: '#141414',
        'surface-2': '#1C1C1C',
        border: '#232323',
        'border-strong': '#333333',
        text: '#FAFAFA',
        'text-mid': '#888888',
        'text-dim': '#555555',
        accent: '#D7FF50',
        'accent-dim': '#5F7A1A',
        warm: '#FF7B47',
        danger: '#E74C3C',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      maxWidth: {
        app: '540px',
      },
    },
  },
  plugins: [],
};
