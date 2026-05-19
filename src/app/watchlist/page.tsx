import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'
import WatchlistClient from './WatchlistClient'

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wl } = await supabase
    .from('watchlists')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: items } = wl
    ? await supabase.from('watchlist_tickers').select('ticker').eq('watchlist_id', wl.id)
    : { data: [] as { ticker: string }[] }

  const tickers = items?.map(i => i.ticker) ?? []
  const { data: scores } = tickers.length
    ? await supabase
        .from('ticker_scores')
        .select('ticker, company_name, score_total, score_label, score_date, market_data')
        .in('ticker', tickers)
    : { data: [] }

  const scoreMap = Object.fromEntries((scores ?? []).map(s => [s.ticker, s]))

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#F0EBDB]">
      <AppNav activePath="/watchlist" />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3] mb-3"
            style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
            § VOTRE SUIVI
          </p>
          <h1 className="text-3xl flex items-baseline gap-3 flex-wrap"
            style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 500, letterSpacing: '-0.02em' }}>
            {tickers.length === 0 ? (
              <>Votre <span style={{ fontStyle: 'italic', color: '#7EE5A3' }}>watchlist</span>.</>
            ) : (
              <>{tickers.length} <span style={{ fontStyle: 'italic', color: '#7EE5A3' }}>{tickers.length === 1 ? 'titre suivi' : 'titres suivis'}</span>.</>
            )}
          </h1>
        </div>
        <WatchlistClient initialTickers={tickers} scoreMap={scoreMap} watchlistId={wl?.id ?? null} />
      </main>
    </div>
  )
}
