import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'
import PortfolioClient from './PortfolioClient'

export default async function PortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: holdings } = await supabase
    .from('portfolio_holdings')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  const tickers = holdings?.map(h => h.ticker) ?? []

  const { data: scores } = tickers.length
    ? await supabase.from('ticker_scores')
        .select('ticker,company_name,score_total,score_label')
        .in('ticker', tickers)
    : { data: [] }

  const scoreMap = Object.fromEntries((scores ?? []).map(s => [s.ticker, s]))

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#F0EBDB]">
      <AppNav activePath="/portfolio" />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3] mb-3"
            style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
            § PORTEFEUILLE
          </p>
          <h1 className="text-3xl flex items-baseline gap-3 flex-wrap"
            style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 500, letterSpacing: '-0.02em' }}>
            Vos <span style={{ fontStyle: 'italic', color: '#7EE5A3' }}>positions</span>.
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#6D7A72]"
              style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
              {holdings?.length ?? 0} {(holdings?.length ?? 0) === 1 ? 'position' : 'positions'}
            </span>
          </h1>
        </div>
        <PortfolioClient
          initialHoldings={holdings ?? []}
          scoreMap={scoreMap}
          userId={user.id}
        />
      </main>
    </div>
  )
}
