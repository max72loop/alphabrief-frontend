import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'

type Edition = {
  date: string
  count: number
  top: { ticker: string; company_name: string | null; score_total: number }[]
}

const LAUNCH_DATE = new Date('2026-01-01T00:00:00Z')

function issueNumberFor(d: Date): number {
  const ms = d.getTime() - LAUNCH_DATE.getTime()
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1)
}

function historyCutoffIso(): string {
  return new Date(Date.now() - 35 * 86_400_000).toISOString()
}

export default async function HistoriquePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Bug fix : on lit `score_history` (append-only par run) au lieu de `ticker_scores`
  // (UPSERT = un seul row par ticker écrasé chaque jour). Sans ça la page ne pouvait
  // afficher qu'une seule édition (celle du jour).
  // On remonte 35 jours pour garantir au moins 30 éditions visibles malgré les
  // jours sans scoring (weekends, trous prod).
  const cutoff = historyCutoffIso()
  const [historyResult, namesResult] = await Promise.all([
    supabase
      .from('score_history')
      .select('ticker, score, scored_at')
      .gte('scored_at', cutoff)
      .order('scored_at', { ascending: false })
      .limit(5000),
    supabase
      .from('ticker_scores')
      .select('ticker, company_name'),
  ])
  const nameByTicker = new Map<string, string | null>(
    (namesResult.data ?? []).map(n => [n.ticker as string, n.company_name as string | null])
  )

  const byDate = new Map<string, Edition>()
  for (const r of historyResult.data ?? []) {
    const key = (r.scored_at as string | null)?.slice(0, 10) ?? ''
    if (!key) continue
    const existing: Edition = byDate.get(key) ?? { date: key, count: 0, top: [] }
    existing.count += 1
    existing.top.push({
      ticker: r.ticker as string,
      company_name: nameByTicker.get(r.ticker as string) ?? null,
      score_total: r.score as number,
    })
    byDate.set(key, existing)
  }
  const editions = Array.from(byDate.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)
    .map(e => ({
      ...e,
      top: [...e.top].sort((x, y) => y.score_total - x.score_total).slice(0, 3),
    }))

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#F0EBDB]">
      <AppNav activePath="/historique" />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3] mb-3">§ ARCHIVES</p>
          <h1 className="text-4xl font-medium mb-2" style={{ fontFamily: 'var(--font-fraunces, serif)', letterSpacing: '-0.02em' }}>
            Historique des <span className="italic text-[#7EE5A3]">éditions.</span>
          </h1>
          <p className="text-sm text-[#6D7A72] max-w-xl">
            Chaque jour, AlphaBrief recalcule les scores. Retrouvez ici les éditions passées et les titres
            qui dominaient le screener à chaque date.
          </p>
        </div>

        {editions.length === 0 ? (
          <div className="text-center py-20 text-[#6D7A72]">
            <p className="text-base">Aucune édition archivée pour le moment.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#1A2520]">
            {editions.map(ed => {
              const d = new Date(ed.date)
              const longDate = d.toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })
              return (
                <li key={ed.date} className="py-5 flex items-baseline gap-6">
                  <div className="shrink-0 w-32 font-mono text-[10px] tracking-[0.18em] text-[#6D7A72] uppercase">
                    N°{issueNumberFor(d).toString().padStart(3, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#F0EBDB] uppercase tracking-wider mb-1">
                      {longDate}
                    </div>
                    <div className="text-xs text-[#6D7A72] flex flex-wrap gap-x-4 gap-y-1">
                      <span>{ed.count} analyses</span>
                      {ed.top.map(t => (
                        <Link
                          key={t.ticker}
                          href={`/ticker/${t.ticker}`}
                          className="hover:text-[#7EE5A3] transition-colors"
                          title={t.ticker}
                        >
                          {t.company_name || t.ticker} · {Math.round(t.score_total)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
