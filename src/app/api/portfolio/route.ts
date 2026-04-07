import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker, quantity, buy_price } = await req.json()
  if (!ticker) return NextResponse.json({ error: 'Missing ticker' }, { status: 400 })

  const { data, error } = await supabase
    .from('portfolio_holdings')
    .upsert({ user_id: user.id, ticker: ticker.toUpperCase(), quantity: quantity ?? 0, buy_price: buy_price ?? 0 }, { onConflict: 'user_id,ticker' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ holding: data })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, quantity, buy_price } = await req.json()
  const { error } = await supabase
    .from('portfolio_holdings')
    .update({ quantity, buy_price })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabase
    .from('portfolio_holdings')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
