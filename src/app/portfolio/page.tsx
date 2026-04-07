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
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <AppNav activePath="/portfolio" />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-xl font-bold">Mon Portefeuille</h1>
          <span className="text-xs font-semibold text-zinc-500 bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 rounded-full">
            {holdings?.length ?? 0} position{(holdings?.length ?? 0) !== 1 ? 's' : ''}
          </span>
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
