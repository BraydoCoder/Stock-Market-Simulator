export const pc = (n) =>
  `PC$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const pct = (n, showSign = true) => {
  const sign = n > 0 && showSign ? '+' : ''
  return `${sign}${Number(n).toFixed(2)}%`
}

export const shares = (n) =>
  Number(n) % 1 === 0 ? Number(n).toString() : Number(n).toFixed(4)

export const gainClass = (n) => Number(n) >= 0 ? 'text-gain' : 'text-loss'
export const gainBg    = (n) => Number(n) >= 0 ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'

export const relativeTime = (ts) => {
  const diff = Date.now() - ts
  if (diff < 60_000)  return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString()
}
