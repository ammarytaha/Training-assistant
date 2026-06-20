/** @type {import('tailwindcss').Config} */
// Colors reference CSS custom properties so the dark/light theme toggle can
// swap the entire palette by toggling a class on <html>. The RGB-triple format
// (e.g. "215 255 80") is required so Tailwind's opacity modifiers work
// (bg-accent/5, shadow-accent/20, etc.).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:              'rgb(var(--color-bg) / <alpha-value>)',
        surface:         'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2':     'rgb(var(--color-surface-2) / <alpha-value>)',
        border:          'rgb(var(--color-border) / <alpha-value>)',
        'border-strong': 'rgb(var(--color-border-strong) / <alpha-value>)',
        text:            'rgb(var(--color-text) / <alpha-value>)',
        'text-mid':      'rgb(var(--color-text-mid) / <alpha-value>)',
        'text-dim':      'rgb(var(--color-text-dim) / <alpha-value>)',
        accent:          'rgb(var(--color-accent) / <alpha-value>)',
        'accent-dim':    'rgb(var(--color-accent-dim) / <alpha-value>)',
        warm:            'rgb(var(--color-warm) / <alpha-value>)',
        danger:          'rgb(var(--color-danger) / <alpha-value>)',
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
