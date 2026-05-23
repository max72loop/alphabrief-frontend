import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

const WATCHLIST_FREE_LIMIT = 10

function normalizeTicker(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const t = input.trim().toUpperCase()
  return t || null
}

async function getOrCreateWatchlist(supabase: SupabaseClient, userId: string) {
  const { data: existing } = await supabase
    .from('watchlists').select('id').eq('user_id', userId).maybeSingle()
  if (existing) return { wl: existing, error: null }

  const { data: created, error } = await supabase
    .from('watchlists')
    .insert({ user_id: userId, name: 'Mon suivi' })
    .select('id')
    .single()
  if (error) {
    // Race-condition friendly : si un autre POST simultané vient juste d'en créer une,
    // l'insert peut violer un UNIQUE(user_id) — on retombe alors sur le select.
    if (error.code === '23505') {
      const { data: retry } = await supabase
        .from('watchlists').select('id').eq('user_id', userId).maybeSingle()
      if (retry) return { wl: retry, error: null }
    }
    return { wl: null, error }
  }
  return { wl: created, error: null }
}

// GET — liste les tickers de la watchlist de l'utilisateur.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: wl } = await supabase
    .from('watchlists').select('id').eq('user_id', user.id).maybeSingle()

  if (!wl) return NextResponse.json({ tickers: [] })

  const { data: items } = await supabase
    .from('watchlist_tickers').select('ticker').eq('watchlist_id', wl.id)

  return NextResponse.json({ tickers: items?.map(i => i.ticker) ?? [] })
}

// POST — ajoute un ticker. Idempotent : si déjà présent, renvoie 200 sans erreur.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const ticker = normalizeTicker((body as { ticker?: unknown }).ticker)
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker manquant ou invalide.' }, { status: 400 })
  }

  // 1. Valide que le ticker est suivi par AlphaBrief.
  const { data: scoreRow } = await supabase
    .from('ticker_scores').select('ticker').eq('ticker', ticker).maybeSingle()
  if (!scoreRow) {
    return NextResponse.json({
      error: `${ticker} n'est pas suivi par AlphaBrief. Vérifiez l'orthographe (ex : AAPL, MC.PA).`,
      code: 'TICKER_NOT_FOUND',
    }, { status: 404 })
  }

  // 2. Récupère/crée la watchlist par défaut.
  const { wl, error: wlError } = await getOrCreateWatchlist(supabase, user.id)
  if (!wl) {
    return NextResponse.json({
      error: `Impossible d'accéder à votre watchlist : ${wlError?.message ?? 'erreur inconnue'}.`,
      code: wlError?.code,
    }, { status: 500 })
  }

  // 3. Enforce la limite Gratuit (skippée pour Premium).
  const { data: profile } = await supabase
    .from('profiles').select('plan').eq('id', user.id).maybeSingle()
  const isPremium = (profile?.plan ?? '').toLowerCase() === 'premium'
  if (!isPremium) {
    const { count } = await supabase
      .from('watchlist_tickers').select('*', { count: 'exact', head: true })
      .eq('watchlist_id', wl.id)
    if (count != null && count >= WATCHLIST_FREE_LIMIT) {
      return NextResponse.json({
        error: `Limite atteinte : ${WATCHLIST_FREE_LIMIT} titres pour le plan Gratuit. Passez Pro pour des titres illimités.`,
        code: 'LIMIT_REACHED',
      }, { status: 403 })
    }
  }

  // 4. Insert avec gestion de l'idempotence.
  const { error: insertError } = await supabase
    .from('watchlist_tickers')
    .insert({ watchlist_id: wl.id, ticker })
  if (insertError) {
    // 23505 = unique_violation (le ticker est déjà dans la watchlist).
    if (insertError.code === '23505') {
      return NextResponse.json({ action: 'already_present', ticker })
    }
    return NextResponse.json({
      error: `Échec de l'ajout : ${insertError.message}.`,
      code: insertError.code,
    }, { status: 500 })
  }

  return NextResponse.json({ action: 'added', ticker }, { status: 201 })
}

// DELETE — retire un ticker. Idempotent : 200 même si le ticker n'était pas présent.
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const ticker = normalizeTicker((body as { ticker?: unknown }).ticker)
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker manquant ou invalide.' }, { status: 400 })
  }

  const { data: wl } = await supabase
    .from('watchlists').select('id').eq('user_id', user.id).maybeSingle()
  if (!wl) {
    return NextResponse.json({ action: 'not_present', ticker })
  }

  const { error: deleteError } = await supabase
    .from('watchlist_tickers').delete()
    .eq('watchlist_id', wl.id).eq('ticker', ticker)
  if (deleteError) {
    return NextResponse.json({
      error: `Échec du retrait : ${deleteError.message}.`,
      code: deleteError.code,
    }, { status: 500 })
  }

  return NextResponse.json({ action: 'removed', ticker })
}
