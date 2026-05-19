import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'

type SearchResult = {
  ticker: string
  company_name: string | null
  sector: string | null
  score_total: number
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q ?? '').trim()
  if (!query) redirect('/dashboard')

  const supabase = await createClient()
  const upper = query.toUpperCase()

  // 1) Match exact sur le ticker → redirection directe
  const { data: exact } = await supabase
    .from('ticker_scores')
    .select('ticker')
    .eq('ticker', upper)
    .maybeSingle()
  if (exact) redirect(`/ticker/${exact.ticker}`)

  // 2) Recherche floue sur ticker + company_name
  const { data: rows } = await supabase
    .from('ticker_scores')
    .select('ticker, company_name, sector, score_total')
    .or(`ticker.ilike.%${query}%,company_name.ilike.%${query}%`)
    .order('score_total', { ascending: false })
    .limit(20)

  const results = (rows ?? []) as SearchResult[]

  // 3) Si un seul résultat → redirection
  if (results.length === 1) redirect(`/ticker/${results[0].ticker}`)

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#F0EBDB]">
      <AppNav activePath="" />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3] mb-3">§ RECHERCHE</p>
        <h1 className="text-3xl mb-1" style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 500, letterSpacing: '-0.02em' }}>
          {results.length === 0 ? 'Aucun résultat' : `${results.length} résultats`} pour <span className="italic text-[#7EE5A3]">«{query}»</span>
        </h1>
        <p className="text-sm text-[#6D7A72] mb-8">
          {results.length === 0
            ? 'Essayez un ticker (ex. AAPL, MSFT, TSLA) ou un nom d\'entreprise.'
            : 'Cliquez sur un titre pour ouvrir son dossier.'}
        </p>

        {results.length > 0 && (
          <ul className="divide-y divide-[#1A2520]">
            {results.map(r => (
              <li key={r.ticker} className="py-4">
                <Link
                  href={`/ticker/${r.ticker}`}
                  className="flex items-baseline gap-4 hover:bg-[#13201A]/50 -mx-3 px-3 py-2 rounded-lg transition-colors"
                >
                  <span className="font-mono text-base font-bold text-[#F0EBDB] w-20 shrink-0">{r.ticker}</span>
                  <span className="flex-1 text-sm text-[#F0EBDB] truncate">{r.company_name ?? '—'}</span>
                  <span className="text-xs text-[#6D7A72] hidden sm:inline">{r.sector ?? ''}</span>
                  <span className="font-mono text-sm font-bold text-[#7EE5A3] w-10 text-right">
                    {Math.round(r.score_total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
