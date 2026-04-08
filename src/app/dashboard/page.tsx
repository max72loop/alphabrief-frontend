import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'
import Link from 'next/link'
import ScreenerTable, { type TickerScore } from './ScreenerTable'

const GUEST_LIMIT = 20

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: rows, error }, watchlistTickers] = await Promise.all([
    supabase
      .from('ticker_scores')
      .select('*')
      .order('score_total', { ascending: false })
      .limit(user ? 10000 : GUEST_LIMIT),
    user
      ? (async (): Promise<string[]> => {
          try {
            const { data: wl } = await supabase
              .from('watchlists').select('id').eq('user_id', user.id).maybeSingle()
            if (!wl) return []
            const { data: items } = await supabase
              .from('watchlist_tickers').select('ticker').eq('watchlist_id', wl.id)
            return items?.map(i => i.ticker) ?? []
          } catch { return [] }
        })()
      : Promise.resolve([]),
  ])

  const isAuthenticated = !!user

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <AppNav activePath="/dashboard" />

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Guest CTA banner */}
        {!isAuthenticated && (
          <div className="mb-8 rounded-2xl border border-indigo-500/25 bg-gradient-to-r from-indigo-500/8 to-violet-500/5 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">Top {GUEST_LIMIT} AlphaBrief — aperçu gratuit</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Créez un compte pour accéder à tous les tickers, votre watchlist et l&apos;analyse complète.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg border border-white/[0.1] text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                Se connecter
              </Link>
              <Link
                href="/login?mode=signup"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white transition-colors shadow-lg shadow-indigo-500/20"
              >
                Créer un compte gratuit →
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">
              {isAuthenticated ? 'Mon suivi' : `Top ${GUEST_LIMIT} AlphaBrief`}
            </h1>
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
          <ScreenerTable
            rows={rows as TickerScore[]}
            watchlistTickers={watchlistTickers}
            isAuthenticated={isAuthenticated}
          />
        )}
      </main>
    </div>
  )
}
