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

export default async function HistoriquePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Récupère les 30 dernières "éditions" — distinct score_date avec top 3 tickers chacune
  const { data: rows } = await supabase
    .from('ticker_scores')
    .select('ticker, company_name, score_total, score_date')
    .order('score_date', { ascending: false })
    .order('score_total', { ascending: false })
    .limit(500)

  const byDate = new Map<string, Edition>()
  for (const r of rows ?? []) {
    const key = (r.score_date as string | null) ?? ''
    if (!key) continue
    const existing: Edition = byDate.get(key) ?? { date: key, count: 0, top: [] }
    existing.count += 1
    if (existing.top.length < 3) {
      existing.top.push({ ticker: r.ticker, company_name: r.company_name, score_total: r.score_total })
    }
    byDate.set(key, existing)
  }
  const editions = Array.from(byDate.values()).slice(0, 30)

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
                          {t.company_name ?? t.ticker} · {Math.round(t.score_total)}
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
