import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'
import ScreenerTable, { type TickerScore } from './ScreenerTable'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rows, error }, watchlistTickers] = await Promise.all([
    supabase
      .from('ticker_scores')
      .select('*')
      .order('score_total', { ascending: false }),
    (async (): Promise<string[]> => {
      try {
        const { data: wl } = await supabase
          .from('watchlists').select('id').eq('user_id', user.id).maybeSingle()
        if (!wl) return []
        const { data: items } = await supabase
          .from('watchlist_tickers').select('ticker').eq('watchlist_id', wl.id)
        return items?.map(i => i.ticker) ?? []
      } catch { return [] }
    })(),
  ])

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <AppNav activePath="/dashboard" />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Mon suivi</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {rows?.length ?? 0} action{rows?.length !== 1 ? 's' : ''} — trié par score
            </p>
          </div>
        </div>

        {error && <div className="text-rose-400 text-sm mb-4">Erreur : {error.message}</div>}

        {!rows || rows.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg font-medium mb-2">Aucun score disponible</p>
            <p className="text-sm">Lance <code className="text-indigo-400">python -m core.generator AAPL</code> pour scorer un ticker.</p>
          </div>
        ) : (
          <ScreenerTable rows={rows as TickerScore[]} watchlistTickers={watchlistTickers} />
        )}
      </main>
    </div>
  )
}
