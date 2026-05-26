/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        bg:                'rgb(var(--c-bg) / <alpha-value>)',
        surface:           'rgb(var(--c-surface) / <alpha-value>)',
        'surface-elevated':'rgb(var(--c-surface-elevated) / <alpha-value>)',
        border:            'rgb(var(--c-border) / <alpha-value>)',
        'accent-primary':  'rgb(var(--c-accent-primary) / <alpha-value>)',
        'accent-secondary':'rgb(var(--c-accent-secondary) / <alpha-value>)',
        gain:              'rgb(var(--c-gain) / <alpha-value>)',
        loss:              'rgb(var(--c-loss) / <alpha-value>)',
        warning:           'rgb(var(--c-warning) / <alpha-value>)',
        'text-primary':    'rgb(var(--c-text-primary) / <alpha-value>)',
        'text-secondary':  'rgb(var(--c-text-secondary) / <alpha-value>)',
        'text-muted':      'rgb(var(--c-text-muted) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body:    ['Space Grotesk', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(16,185,129,0.3)',
        'glow-red':   '0 0 20px rgba(239,68,68,0.3)',
        'glow-teal':  '0 0 20px rgba(0,212,170,0.3)',
      },
    },
  },
  plugins: [],
}
