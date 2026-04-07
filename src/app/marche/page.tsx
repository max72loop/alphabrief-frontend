import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase = 'expansion' | 'slowdown' | 'recession' | 'recovery'

const PHASE_LABELS: Record<Phase, string> = {
  expansion: 'Expansion',
  slowdown:  'Ralentissement',
  recession: 'Récession',
  recovery:  'Reprise',
}

const PHASE_COLORS: Record<Phase, string> = {
  expansion: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  slowdown:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  recession: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  recovery:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

const SCORE_META: Record<number, { label: string; cls: string }> = {
  5: { label: 'ACHETER FORT',   cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  4: { label: 'ACHETER',        cls: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' },
  3: { label: 'NEUTRE',         cls: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  2: { label: 'SOUS-PONDÉRER', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  1: { label: 'ÉVITER',         cls: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
}

const SCORE_BORDER: Record<number, string> = {
  5: 'border-l-emerald-500',
  4: 'border-l-indigo-500',
  3: 'border-l-amber-500',
  2: 'border-l-orange-500',
  1: 'border-l-rose-500',
}

// Sector → asset class id
const SECTOR_TO_ASSET: Record<string, string> = {
  'Technology':             'tech',
  'Communication Services': 'tech',
  'Financial Services':     'financials',
  'Financials':             'financials',
  'Consumer Cyclical':      'tech',
  'Consumer Defensive':     'staples',
  'Healthcare':             'staples',
  'Health Care':            'staples',
  'Industrials':            'energy',
  'Basic Materials':        'materials',
  'Materials':              'materials',
  'Energy':                 'energy',
  'Utilities':              'bonds',
  'Real Estate':            'realestate',
}
const CRYPTO_TICKERS = new Set(['COIN', 'MSTR', 'HOOD', 'SOFI'])

type AssetClass = {
  id: string
  name: string
  subtitle: string
  icon: string
  proxyTicker: string
  phaseScores: Record<Phase, number>
  phaseReasons: Record<Phase, string>
}

const ASSET_CLASSES: AssetClass[] = [
  {
    id: 'bitcoin', name: 'Bitcoin', subtitle: 'Crypto-monnaie', icon: '₿', proxyTicker: 'BTC-USD',
    phaseScores:  { expansion: 5, slowdown: 3, recession: 1, recovery: 5 },
    phaseReasons: {
      expansion: 'Liquidité abondante et appétit maximal pour le risque. Phase idéale pour le Bitcoin.',
      slowdown:  'Volatilité croissante avec les craintes de récession. Prudence recommandée.',
      recession: 'Forte corrélation avec les actifs risqués. Pression vendeuse importante.',
      recovery:  'Parmi les premiers actifs à rebondir. Catalyseur idéal de reprise.',
    },
  },
  {
    id: 'tech', name: 'Actions Technologiques', subtitle: 'Nasdaq 100 — QQQ', icon: '💻', proxyTicker: 'QQQ',
    phaseScores:  { expansion: 5, slowdown: 3, recession: 1, recovery: 4 },
    phaseReasons: {
      expansion: 'Leader absolu en expansion. Revenus et multiples de valorisation en hausse.',
      slowdown:  'Compression des multiples. Surveiller les révisions de bénéfices.',
      recession: 'Forte contraction. Multiples réduits, révisions à la baisse.',
      recovery:  'Fort rebond dès les premiers signes. Co-leader de la reprise.',
    },
  },
  {
    id: 'financials', name: 'Banques & Finance', subtitle: 'Secteur financier — XLF', icon: '🏦', proxyTicker: 'XLF',
    phaseScores:  { expansion: 4, slowdown: 3, recession: 1, recovery: 4 },
    phaseReasons: {
      expansion: "Marges nettes d'intérêt solides. Activité crédit et M&A en hausse.",
      slowdown:  'Mix de signaux. Taux encore élevés mais risques en hausse.',
      recession: 'Hausse des créances douteuses et resserrement du crédit.',
      recovery:  'Premières bénéficiaires de la normalisation du crédit.',
    },
  },
  {
    id: 'realestate', name: 'Immobilier (REIT)', subtitle: 'Real Estate — VNQ', icon: '🏢', proxyTicker: 'VNQ',
    phaseScores:  { expansion: 4, slowdown: 2, recession: 1, recovery: 5 },
    phaseReasons: {
      expansion: 'Demande locative forte. Valorisations et loyers en hausse.',
      slowdown:  'Sensible aux taux montants. Pression sur les valorisations.',
      recession: 'Forte correction. Défauts et vacances locatives en hausse.',
      recovery:  'Rebond historiquement le plus fort de tous les secteurs.',
    },
  },
  {
    id: 'energy', name: 'Énergie', subtitle: 'Pétrole & Gaz — XLE', icon: '⚡', proxyTicker: 'XLE',
    phaseScores:  { expansion: 4, slowdown: 3, recession: 2, recovery: 4 },
    phaseReasons: {
      expansion: "Demande mondiale forte. Prix de l'énergie bien orientés.",
      slowdown:  'Résilient grâce à la géopolitique et aux coupes OPEP.',
      recession: 'Demande industrielle réduite. Prix pétroliers sous pression.',
      recovery:  'Rebond de la demande industrielle mondiale.',
    },
  },
  {
    id: 'gold', name: 'Or', subtitle: 'Métal précieux — GLD', icon: '🥇', proxyTicker: 'GLD',
    phaseScores:  { expansion: 2, slowdown: 4, recession: 5, recovery: 2 },
    phaseReasons: {
      expansion: "Peu attractif. Coût d'opportunité élevé face aux actifs risqués.",
      slowdown:  'Valeur refuge croissante. Inflation et incertitudes le soutiennent.',
      recession: "Valeur refuge ultime. Surperforme quand tout s'effondre.",
      recovery:  'Délaissé au profit des actifs cycliques plus attractifs.',
    },
  },
  {
    id: 'bonds', name: 'Obligations Long Terme', subtitle: 'Treasuries 20+ ans — TLT', icon: '📄', proxyTicker: 'TLT',
    phaseScores:  { expansion: 1, slowdown: 3, recession: 5, recovery: 2 },
    phaseReasons: {
      expansion: 'Éviter. Les taux montent, les prix des obligations baissent.',
      slowdown:  'Intérêt croissant. Les taux vont plafonner.',
      recession: 'Phase idéale. La FED baisse les taux, forte appréciation.',
      recovery:  'Pression vendeuse avec la remontée des taux.',
    },
  },
  {
    id: 'staples', name: 'Consommation Défensive', subtitle: 'Consumer Staples — XLP', icon: '🛒', proxyTicker: 'XLP',
    phaseScores:  { expansion: 2, slowdown: 4, recession: 5, recovery: 2 },
    phaseReasons: {
      expansion: 'Sous-performe en expansion. Préférer les secteurs cycliques.',
      slowdown:  'Rotation défensive. Stabilité et dividendes appréciés.',
      recession: 'Protection maximale. La consommation de base est inélastique.',
      recovery:  'Délaissé au profit des valeurs cycliques.',
    },
  },
  {
    id: 'materials', name: 'Matières Premières', subtitle: 'Commodities — GSG', icon: '⛏️', proxyTicker: 'GSG',
    phaseScores:  { expansion: 3, slowdown: 2, recession: 1, recovery: 5 },
    phaseReasons: {
      expansion: 'Demande industrielle soutient les prix. Bon en mi-expansion.',
      slowdown:  'Affecté par la baisse de la demande industrielle mondiale.',
      recession: 'Forte baisse. Demande mondiale effondrée.',
      recovery:  'Rebond ultra-fort. Reprise industrielle et infrastructure.',
    },
  },
]

// ── Stars helper ───────────────────────────────────────────────────────────────
function Stars({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const s = size === 'lg' ? 'text-base' : 'text-[0.7rem]'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`${s} ${i <= score ? 'text-amber-400' : 'text-white/10'}`}>★</span>
      ))}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function MarchePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Current phase — hardcoded for now, can be made dynamic via a Supabase config table
  const phase: Phase = 'expansion'

  // User's watchlist tickers + their sectors from ticker_scores
  const { data: wl } = await supabase
    .from('watchlists').select('id').eq('user_id', user.id).maybeSingle()

  let watchlistByClass: Record<string, string[]> = {}
  if (wl) {
    const { data: items } = await supabase
      .from('watchlist_tickers').select('ticker').eq('watchlist_id', wl.id)
    const tickers = (items ?? []).map(i => i.ticker as string)

    if (tickers.length > 0) {
      const { data: scores } = await supabase
        .from('ticker_scores').select('ticker,sector').in('ticker', tickers)
      for (const s of scores ?? []) {
        const t = s.ticker as string
        let assetId = CRYPTO_TICKERS.has(t) ? 'bitcoin' : SECTOR_TO_ASSET[s.sector ?? ''] ?? ''
        if (assetId) {
          watchlistByClass[assetId] = [...(watchlistByClass[assetId] ?? []), t]
        }
      }
    }
  }

  // Score each asset class for the current phase, sort by score
  const scored = ASSET_CLASSES
    .map(a => ({
      ...a,
      score: a.phaseScores[phase],
      reason: a.phaseReasons[phase],
      meta: SCORE_META[a.phaseScores[phase]],
      watchlistTickers: watchlistByClass[a.id] ?? [],
    }))
    .sort((a, b) => b.score - a.score)

  const top = scored[0]
  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const tagCls = (score: number) =>
    score >= 4
      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
      : score === 3
        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <AppNav activePath="/marche" />
      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="text-xl font-bold">Marché Global</h1>
          <span className="text-xs text-zinc-500">{currentMonth}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${PHASE_COLORS[phase]}`}>
            {PHASE_LABELS[phase]}
          </span>
          <span className="text-[0.65rem] text-zinc-600 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded">
            Phase manuelle — automatisation prévue
          </span>
        </div>

        {/* Top pick */}
        {top && (
          <div className={`bg-white/[0.02] border border-white/[0.06] border-l-4 ${SCORE_BORDER[top.score]} rounded-xl p-5 mb-6`}>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500 mb-3">Achat principal du mois</p>
            <div className="flex items-start gap-4 flex-wrap">
              <span className="text-3xl leading-none flex-shrink-0 mt-0.5">{top.icon}</span>
              <div className="flex-1 min-w-[160px]">
                <p className="text-lg font-bold">{top.name}</p>
                <p className="text-sm text-zinc-500 mb-2">{top.subtitle}</p>
                <Stars score={top.score} size="lg" />
                <span className={`inline-block mt-2 text-[0.65rem] font-bold uppercase tracking-wide px-2.5 py-1 rounded border ${top.meta.cls}`}>
                  {top.meta.label}
                </span>
              </div>
              <span className="text-xs text-zinc-600 font-mono">{top.proxyTicker}</span>
            </div>
            <p className="text-sm text-zinc-400 mt-4 pt-4 border-t border-white/[0.06] leading-relaxed">{top.reason}</p>
            {top.watchlistTickers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 items-center">
                <span className="text-[0.65rem] text-zinc-500">Dans votre suivi :</span>
                {top.watchlistTickers.map(t => (
                  <Link key={t} href={`/ticker/${t}`} className={`text-[0.65rem] font-bold px-2 py-0.5 rounded ${tagCls(top.score)}`}>
                    {t}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All asset classes */}
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500 mb-3">
          Toutes les classes d'actifs — classées par score
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scored.map(asset => (
            <div
              key={asset.id}
              className={`bg-white/[0.02] border border-white/[0.06] border-l-4 ${SCORE_BORDER[asset.score]} rounded-xl p-4 flex flex-col gap-2`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xl leading-none flex-shrink-0 mt-0.5">{asset.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight">{asset.name}</p>
                  <p className="text-[0.65rem] text-zinc-500 mt-0.5">{asset.subtitle}</p>
                </div>
              </div>

              <Stars score={asset.score} />

              <span className={`self-start text-[0.6rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${asset.meta.cls}`}>
                {asset.meta.label}
              </span>

              <p className="text-[0.72rem] text-zinc-500 leading-relaxed border-t border-white/[0.06] pt-2 flex-1">
                {asset.reason}
              </p>

              {asset.watchlistTickers.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {asset.watchlistTickers.map(t => (
                    <Link key={t} href={`/ticker/${t}`} className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded ${tagCls(asset.score)}`}>
                      {t}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-8 pt-5 border-t border-white/[0.06] text-[0.65rem] text-zinc-600">
          {[5, 4, 3, 2, 1].map(s => (
            <span key={s} className={`px-2 py-0.5 rounded border ${SCORE_META[s].cls}`}>
              {'★'.repeat(s)}{'☆'.repeat(5 - s)} {SCORE_META[s].label}
            </span>
          ))}
          <span className="ml-auto">Source : analyse cycle économique S&P 500</span>
        </div>
      </main>
    </div>
  )
}
