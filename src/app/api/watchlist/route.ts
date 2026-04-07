import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: wl } = await supabase
    .from('watchlists')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!wl) return NextResponse.json({ tickers: [] })

  const { data: items } = await supabase
    .from('watchlist_tickers')
    .select('ticker')
    .eq('watchlist_id', wl.id)

  return NextResponse.json({ tickers: items?.map(i => i.ticker) ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker } = await req.json()
  if (!ticker || typeof ticker !== 'string') {
    return NextResponse.json({ error: 'Missing ticker' }, { status: 400 })
  }

  // Get or create default watchlist
  let { data: wl } = await supabase
    .from('watchlists')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!wl) {
    const { data } = await supabase
      .from('watchlists')
      .insert({ user_id: user.id, name: 'Mon suivi' })
      .select('id')
      .single()
    wl = data
  }

  if (!wl) return NextResponse.json({ error: 'Failed to create watchlist' }, { status: 500 })

  // Toggle : supprime si présent, ajoute sinon
  const { data: existing } = await supabase
    .from('watchlist_tickers')
    .select('id')
    .eq('watchlist_id', wl.id)
    .eq('ticker', ticker)
    .maybeSingle()

  if (existing) {
    await supabase.from('watchlist_tickers').delete().eq('id', existing.id)
    return NextResponse.json({ action: 'removed' })
  } else {
    await supabase.from('watchlist_tickers').insert({ watchlist_id: wl.id, ticker })
    return NextResponse.json({ action: 'added' })
  }
}
