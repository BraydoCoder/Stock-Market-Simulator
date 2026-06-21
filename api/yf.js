// Vercel serverless function — proxies Yahoo Finance quote requests
// so the browser never hits CORS restrictions in production.
// Dev uses the Vite proxy instead (vite.config.js /yf → Yahoo Finance).

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const url = new URL(req.url)
  const symbols = url.searchParams.get('symbols') ?? ''
  if (!symbols) return new Response('missing symbols', { status: 400 })

  const yfUrl =
    `https://query1.finance.yahoo.com/v7/finance/quote` +
    `?symbols=${encodeURIComponent(symbols)}` +
    `&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose`

  try {
    const res = await fetch(yfUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 502 })
  }
}
