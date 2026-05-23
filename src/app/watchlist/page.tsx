import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'
import WatchlistClient from './WatchlistClient'
import type { WatchlistItem } from '@/components/watchlist/types'

type MarketData = {
  current_price?: number | null
  change_pct?: number | null
  rsi_14?: number | null
  momentum_3m?: number | null
} | null

const FR_MONTHS = ['janv.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', CHF: 'CHF', JPY: '¥' }

function fmtAdded(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()} ${FR_MONTHS[d.getMonth()]}`
}

function fmtPrice(price: number | null | undefined, currency: string | null | undefined): string {
  if (price == null || !isFinite(price)) return ''
  const sym = currency ? (CURRENCY_SYMBOL[currency] || currency) : ''
  const value = price >= 1000 ? price.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : price.toFixed(price >= 10 ? 1 : 2)
  return currency === 'EUR' ? `${value} ${sym}` : `${sym}${value}`
}

function fmtChange(chg: number | null | undefined): string {
  if (chg == null || !isFinite(chg)) return ''
  return `${chg >= 0 ? '+' : ''}${chg.toFixed(1)}%`
}

function historyCutoffIso(): string {
  return new Date(Date.now() - 14 * 86_400_000).toISOString()
}

function fmtToday(): string {
  const now = new Date()
  const days = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
  const months = ['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE']
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `VOL. I · ${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} · ${hh}:${mm} CET`
}

function deriveNote(score: number, oneLiner: string | null, rsi: number | null | undefined, mom3m: number | null | undefined): string {
  if (oneLiner && oneLiner.trim()) return oneLiner.trim()
  const bits: string[] = []
  if (score >= 75)      bits.push("Trois piliers alignés.")
  else if (score >= 60) bits.push("Bonne qualité globale.")
  else if (score >= 45) bits.push("Profil mixte, signal neutre.")
  else if (score >= 30) bits.push("Faiblesses identifiées sur plusieurs piliers.")
  else                  bits.push("Score faible sur l'ensemble.")
  if (rsi != null && isFinite(rsi)) {
    if (rsi >= 70) bits.push("RSI en zone de surchauffe.")
    else if (rsi <= 30) bits.push("RSI en zone survendue.")
  }
  if (mom3m != null && isFinite(mom3m)) {
    if (mom3m >= 15) bits.push(`Momentum 3M ${mom3m >= 0 ? '+' : ''}${mom3m.toFixed(0)}%.`)
    else if (mom3m <= -10) bits.push(`Momentum 3M ${mom3m.toFixed(0)}%.`)
  }
  return bits.join(' ')
}

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wl } = await supabase
    .from('watchlists').select('id').eq('user_id', user.id).maybeSingle()

  const { data: rawItems } = wl
    ? await supabase.from('watchlist_tickers')
        .select('ticker, created_at')
        .eq('watchlist_id', wl.id)
        .order('created_at', { ascending: true })
    : { data: [] as { ticker: string; created_at: string | null }[] }

  const tickers = (rawItems ?? []).map(i => i.ticker)
  const addedMap = Object.fromEntries((rawItems ?? []).map(i => [i.ticker, i.created_at]))

  const [scoresResult, historyResult, alertsResult, profileResult] = await Promise.all([
    tickers.length
      ? supabase.from('ticker_scores')
          .select('ticker, company_name, sector, currency, score_total, score_fundamentals, score_technicals, score_momentum, market_data, one_liner')
          .in('ticker', tickers)
      : Promise.resolve({ data: [] as Array<{
          ticker: string
          company_name: string | null
          sector: string | null
          currency: string | null
          score_total: number
          score_fundamentals: number
          score_technicals: number
          score_momentum: number
          market_data: MarketData
          one_liner: string | null
        }> }),
    tickers.length
      ? supabase.from('score_history')
          .select('ticker, score, scored_at')
          .in('ticker', tickers)
          .gte('scored_at', historyCutoffIso())
          .order('scored_at', { ascending: true })
      : Promise.resolve({ data: [] as { ticker: string; score: number; scored_at: string }[] }),
    tickers.length
      ? supabase.from('alerts')
          .select('ticker').in('ticker', tickers).eq('read', false)
      : Promise.resolve({ data: [] as { ticker: string }[] }),
    supabase.from('profiles')
      .select('plan').eq('id', user.id).maybeSingle(),
  ])

  const scoreMap = Object.fromEntries((scoresResult.data ?? []).map(s => [s.ticker, s]))

  const histByTicker: Record<string, number[]> = {}
  for (const h of historyResult.data ?? []) {
    if (!histByTicker[h.ticker]) histByTicker[h.ticker] = []
    histByTicker[h.ticker].push(Math.round(h.score))
  }

  const alertSet = new Set((alertsResult.data ?? []).map(a => a.ticker))

  const isPremium = (profileResult.data?.plan ?? '').toLowerCase() === 'premium'

  const items: WatchlistItem[] = tickers.map(ticker => {
    const s = scoreMap[ticker]
    if (!s) {
      return {
        ticker,
        name: ticker,
        score: 0, prev: 0, hist: [0],
        chg: '', price: '', sector: '',
        fund: 0, tech: 0, mom: 0,
        alert: alertSet.has(ticker),
        note: 'Score en cours de calcul.',
        added: fmtAdded(addedMap[ticker]),
      }
    }
    const score = Math.round(s.score_total)
    const rawHist = (histByTicker[ticker] ?? []).slice(-7)
    const hist = rawHist.length > 0 ? rawHist : [score]
    if (hist[hist.length - 1] !== score) hist.push(score)
    const prev = hist.length >= 2 ? hist[0] : score
    const mkt = s.market_data
    return {
      ticker,
      name: s.company_name ?? ticker,
      score,
      prev,
      hist,
      chg: fmtChange(mkt?.change_pct),
      price: fmtPrice(mkt?.current_price, s.currency),
      sector: s.sector ?? '',
      fund: Math.round((s.score_fundamentals / 100) * 50),
      tech: Math.round((s.score_technicals   / 100) * 25),
      mom:  Math.round((s.score_momentum     / 100) * 25),
      alert: alertSet.has(ticker),
      note: deriveNote(score, s.one_liner, mkt?.rsi_14, mkt?.momentum_3m),
      added: fmtAdded(addedMap[ticker]),
    }
  })

  return (
    <div className="min-h-screen" style={{ background: '#0A0F0C', color: '#F0EBDB' }}>
      <AppNav activePath="/watchlist" />
      <WatchlistClient
        initialItems={items}
        isPremium={isPremium}
        todayLabel={fmtToday()}
      />
    </div>
  )
}
