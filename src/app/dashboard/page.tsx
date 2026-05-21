import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'
import Link from 'next/link'
import ScreenerTable, { type TickerScore } from './ScreenerTable'
import Greeting from './_components/Greeting'
import PersonalEdition, { type EditionItem } from './_components/PersonalEdition'
import DashboardWatchlist, { type WatchRow } from './_components/DashboardWatchlist'
import QuickScorer, { type RecentItem, type Suggestion } from './_components/QuickScorer'
import AlertsAndQuota, { type AlertItem, type Quota } from './_components/AlertsAndQuota'
import { TickerTape } from '@/components/landing/TickerTape'
import { SCORE_THRESHOLDS } from '@/components/landing/Gauge'
import { FREE_DAILY_QUOTA } from '@/lib/quota'

const GUEST_LIMIT = 20

function firstNameFrom(user: { user_metadata?: { full_name?: string; first_name?: string; name?: string }; email?: string }): string {
  const meta = user.user_metadata ?? {}
  const fromMeta = meta.first_name ?? (meta.full_name ?? meta.name ?? '').split(' ')[0]
  if (fromMeta && fromMeta.trim().length > 0) return fromMeta.trim()
  if (user.email) {
    const local = user.email.split('@')[0]
    const clean = local.split(/[._-]/)[0]
    return clean ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() : 'Investisseur'
  }
  return 'Investisseur'
}

function noteFor(score: number, prev?: number | null): string {
  if (prev != null) {
    const delta = score - prev
    if (delta >= 5) return "Le score grimpe nettement — un pilier vire au vert."
    if (delta <= -5) return "Score en baisse marquée. Risque sur un des piliers."
  }
  if (score >= SCORE_THRESHOLDS.excellent) return "Signal premium. Fondamentaux, technique et momentum alignés."
  if (score >= SCORE_THRESHOLDS.good)      return "Profil solide. Surveiller le rythme de croissance."
  if (score >= SCORE_THRESHOLDS.neutral)   return "Score neutre. Pas de signal franc dans un sens ou l'autre."
  return "Vent contraire. Plusieurs piliers en faiblesse."
}

function tagFor(score: number, watching: boolean): string {
  if (score >= SCORE_THRESHOLDS.excellent) return watching ? "PROMOTION" : "TOP DU JOUR"
  if (score >= SCORE_THRESHOLDS.good)      return "ROTATION"
  if (score >= SCORE_THRESHOLDS.neutral)   return "STABLE"
  return "DOWNGRADE"
}

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

  // ── Guest view : keep existing top-20 screener ────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0F0C] text-[#F0EBDB]">
        <AppNav activePath="/dashboard" />
        <main className="max-w-5xl mx-auto px-6 py-10">
          <div className="mb-8 rounded-2xl border border-[#7EE5A3]/25 bg-gradient-to-r from-[#7EE5A3]/8 to-[#5AB983]/5 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#F0EBDB] text-sm">Top {GUEST_LIMIT} AlphaBrief — aperçu gratuit</p>
              <p className="text-xs text-[#6D7A72] mt-0.5">
                Créez un compte pour accéder à tous les tickers, votre watchlist et l&apos;analyse complète.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg border border-[#1A2520] text-sm text-[#6D7A72] hover:text-[#F0EBDB] hover:bg-[#13201A] transition-colors"
              >
                Se connecter
              </Link>
              <Link
                href="/login?mode=signup"
                className="px-4 py-2 rounded-lg bg-[#7EE5A3] hover:bg-[#9AEDB5] text-sm font-bold text-[#0A0F0C] transition-colors"
              >
                Créer un compte gratuit →
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold">Top {GUEST_LIMIT} AlphaBrief</h1>
              <p className="text-sm text-[#6D7A72] mt-0.5">
                {rows?.length ?? 0} action{rows?.length !== 1 ? 's' : ''} — trié par score
              </p>
            </div>
          </div>

          {error && <div className="text-rose-400 text-sm mb-4">Erreur : {error.message}</div>}

          {!rows || rows.length === 0 ? (
            <div className="text-center py-20 text-[#6D7A72]">
              <p className="text-lg font-medium mb-2">Aucun score disponible</p>
            </div>
          ) : (
            <ScreenerTable rows={rows as TickerScore[]} watchlistTickers={[]} isAuthenticated={false} />
          )}
        </main>
      </div>
    )
  }

  // ── Authenticated : new editorial dashboard ────────────────────────────
  const allRows = (rows ?? []) as TickerScore[]
  const watchSet = new Set(watchlistTickers)

  const watchRows: WatchRow[] = allRows
    .filter(r => watchSet.has(r.ticker))
    .map(r => ({
      ticker: r.ticker,
      name: r.company_name,
      sector: r.sector,
      score: Math.round(r.score_total),
      fund: Math.round(r.score_fundamentals),
      tech: Math.round(r.score_technicals),
      mom: Math.round(r.score_momentum),
      alert: false,
      momentum3m: r.market_data?.momentum_3m ?? null,
      rsi14: r.market_data?.rsi_14 ?? null,
    }))

  // Fetch alerts (for both alerts panel + flagging watchlist rows)
  let alertItems: AlertItem[] = []
  try {
    const { data: alerts } = await supabase
      .from('alerts')
      .select('ticker, alert_type, message, created_at, read')
      .order('created_at', { ascending: false })
      .limit(10)
    alertItems = (alerts ?? []).map(a => ({
      ticker: a.ticker,
      alert_type: a.alert_type,
      message: a.message,
      created_at: a.created_at,
    }))
    const recentAlertTickers = new Set(
      (alerts ?? [])
        .filter(a => !a.read)
        .map(a => a.ticker)
    )
    watchRows.forEach(w => {
      if (recentAlertTickers.has(w.ticker)) w.alert = true
    })
  } catch { /* no alerts table → silently skip */ }

  // Quota
  let quota: Quota = { used: 0, total: FREE_DAILY_QUOTA, isPremium: false }
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, analyses_today, last_analysis_date')
      .eq('id', user.id)
      .maybeSingle()
    if (profile) {
      const today = new Date().toISOString().slice(0, 10)
      const usedToday = profile.last_analysis_date === today ? (profile.analyses_today ?? 0) : 0
      quota = {
        used: Math.min(usedToday, FREE_DAILY_QUOTA),
        total: FREE_DAILY_QUOTA,
        isPremium: (profile.plan ?? '').toLowerCase() === 'premium',
      }
    }
  } catch { /* keep default */ }

  // Edition items: prioritise watchlist tickers, fall back to top-scored
  const editionPool = watchRows.length >= 4
    ? watchRows
    : [
        ...watchRows,
        ...allRows
          .filter(r => !watchSet.has(r.ticker))
          .slice(0, 4 - watchRows.length)
          .map(r => ({
            ticker: r.ticker,
            name: r.company_name,
            sector: r.sector,
            score: Math.round(r.score_total),
            fund: Math.round(r.score_fundamentals),
            tech: Math.round(r.score_technicals),
            mom: Math.round(r.score_momentum),
            alert: false,
            momentum3m: r.market_data?.momentum_3m ?? null,
            rsi14: r.market_data?.rsi_14 ?? null,
          } as WatchRow)),
      ]

  const editionItems: EditionItem[] = editionPool
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(r => ({
      ticker: r.ticker,
      name: r.name,
      sector: r.sector,
      score: r.score,
      note: noteFor(r.score),
      tag: tagFor(r.score, watchSet.has(r.ticker)),
      watching: watchSet.has(r.ticker),
      momentum3m: r.momentum3m ?? null,
    }))

  // Suggestions for QuickScorer = top 4 non-watched
  const suggestions: Suggestion[] = allRows
    .filter(r => !watchSet.has(r.ticker))
    .slice(0, 4)
    .map(r => ({
      ticker: r.ticker,
      name: r.company_name,
      sector: r.sector,
      score: Math.round(r.score_total),
    }))

  // Recent: use 5 most recent score_date entries from watchlist (fallback: top 5)
  const recent: RecentItem[] = (watchRows.length > 0 ? watchRows : allRows.slice(0, 5).map(r => ({
    ticker: r.ticker,
    name: r.company_name,
    score: Math.round(r.score_total),
  } as { ticker: string; name: string | null; score: number })))
    .slice(0, 5)
    .map(r => ({
      ticker: r.ticker,
      name: r.name ?? null,
      score: r.score,
      when: 'récent',
    }))

  const avg = watchRows.length > 0
    ? Math.round(watchRows.reduce((s, r) => s + r.score, 0) / watchRows.length)
    : null

  const firstName = firstNameFrom(user)

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#F0EBDB]">
      <AppNav activePath="/dashboard" />
      <TickerTape inline />
      <main>
        <Greeting
          firstName={firstName}
          summary={{
            watchlist: watchRows.length,
            avg,
            changes: alertItems.length,
            alerts: alertItems.length,
          }}
        />
        {/* FOCUS PRINCIPAL : l'édition du jour. Les 4 meilleurs scores
            sur la watchlist (fallback : top du marché) avec note éditoriale. */}
        <PersonalEdition items={editionItems} watchlistSize={watchRows.length} />

        {/* SECONDAIRE : table complète de la watchlist personnelle. */}
        <DashboardWatchlist rows={watchRows} />

        {/* TERTIAIRE : actions du jour. Ordre logique : on agit (scorer
            un titre) puis on consulte le suivi (alertes). */}
        <QuickScorer suggestions={suggestions} recent={recent} />
        <AlertsAndQuota alerts={alertItems} quota={quota} />

        <footer
          className="max-w-[1320px] mx-auto px-10 py-6 mt-10 border-t border-[#1A2520] flex items-center justify-center"
          style={{
            fontFamily: 'var(--font-jetbrains-mono), ui-monospace, Menlo, monospace',
            fontSize: 10,
            color: '#6D7A72',
            letterSpacing: '0.14em',
          }}
        >
          ALPHABRIEF · ÉDITION PERSONNELLE · NE CONSTITUE PAS UN CONSEIL EN INVESTISSEMENT
        </footer>
      </main>
    </div>
  )
}
