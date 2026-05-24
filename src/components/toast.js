let queue = []
let showing = false

export function toast(message, type = 'info', duration = 3500) {
  queue.push({ message, type, duration })
  if (!showing) drain()
}

function drain() {
  if (!queue.length) { showing = false; return }
  showing = true
  const { message, type, duration } = queue.shift()
  show(message, type, duration)
}

function show(message, type, duration) {
  const el = document.createElement('div')
  el.className = `
    pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg
    text-sm font-medium transition-all duration-300 translate-y-2 opacity-0
    ${colorClass(type)}
  `.trim()
  el.innerHTML = `<span class="shrink-0 text-base">${icon(type)}</span><span>${message}</span>`

  const container = document.getElementById('toast-container')
  if (!container) { drain(); return }

  container.appendChild(el)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.remove('translate-y-2', 'opacity-0')
    })
  })

  setTimeout(() => {
    el.classList.add('translate-y-2', 'opacity-0')
    setTimeout(() => { el.remove(); drain() }, 300)
  }, duration)
}

function colorClass(type) {
  switch (type) {
    case 'success': return 'bg-gain/10 border-gain/30 text-gain'
    case 'error':   return 'bg-loss/10 border-loss/30 text-loss'
    case 'warning': return 'bg-warning/10 border-warning/30 text-warning'
    default:        return 'bg-surface-elevated border-border text-text-primary'
  }
}

function icon(type) {
  switch (type) {
    case 'success': return '✓'
    case 'error':   return '✕'
    case 'warning': return '⚠'
    default:        return 'ℹ'
  }
}
