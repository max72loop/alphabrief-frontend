import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tickersParam = searchParams.get('tickers') ?? ''
  const tickers = tickersParam.split(',').map(t => t.trim()).filter(Boolean)

  if (!tickers.length) return NextResponse.json({ prices: {} })

  const prices: Record<string, { price: number | null; change_pct: number | null; currency: string }> = {}

  await Promise.allSettled(tickers.map(async ticker => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } })
      const data = await res.json()
      const meta = data?.chart?.result?.[0]?.meta
      if (!meta) return
      const price = meta.regularMarketPrice ?? null
      const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null
      const change_pct = price && prevClose ? ((price - prevClose) / prevClose) * 100 : null
      prices[ticker] = { price, change_pct, currency: meta.currency ?? 'USD' }
    } catch {
      prices[ticker] = { price: null, change_pct: null, currency: 'USD' }
    }
  }))

  return NextResponse.json({ prices })
}
