/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        bg:                '#0A0E1A',
        surface:           '#111827',
        'surface-elevated':'#1F2937',
        border:            '#374151',
        'accent-primary':  '#00D4AA',
        'accent-secondary':'#6366F1',
        gain:              '#10B981',
        loss:              '#EF4444',
        warning:           '#F59E0B',
        'text-primary':    '#F9FAFB',
        'text-secondary':  '#9CA3AF',
        'text-muted':      '#6B7280',
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
