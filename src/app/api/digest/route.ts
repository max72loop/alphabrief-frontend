import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const CRON_SECRET = process.env.CRON_SECRET ?? ''

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = adminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Top 10 tickers
  const { data: topTickers } = await supabase
    .from('ticker_scores')
    .select('ticker, company_name, score_total')
    .order('score_total', { ascending: false })
    .limit(10)

  // Utilisateurs avec weekly_digest activé
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, weekly_digest')
    .eq('weekly_digest', true)

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  // Récupérer les emails depuis Supabase Auth
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = Object.fromEntries(users.map(u => [u.id, u.email ?? '']))

  let sent = 0
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  for (const profile of profiles) {
    const email = emailMap[profile.id]
    if (!email) continue

    // Watchlist de l'utilisateur
    let watchlistScores: { ticker: string; company_name: string | null; score_total: number }[] = []
    try {
      const { data: wl } = await supabase
        .from('watchlists').select('id').eq('user_id', profile.id).maybeSingle()
      if (wl) {
        const { data: items } = await supabase
          .from('watchlist_tickers').select('ticker').eq('watchlist_id', wl.id)
        const tickers = items?.map(i => i.ticker) ?? []
        if (tickers.length > 0) {
          const { data } = await supabase
            .from('ticker_scores')
            .select('ticker, company_name, score_total')
            .in('ticker', tickers)
            .order('score_total', { ascending: false })
          watchlistScores = data ?? []
        }
      }
    } catch { /* watchlist non migrée */ }

    const html = buildDigestHtml(topTickers ?? [], watchlistScores, date)

    await resend.emails.send({
      from: 'AlphaBrief <digest@maxloop.ovh>',
      to: email,
      subject: `AlphaBrief — Digest du ${date}`,
      html,
    })
    sent++
  }

  return NextResponse.json({ sent })
}

function scoreColor(s: number) {
  if (s >= 70) return '#34d399'
  if (s >= 50) return '#fbbf24'
  return '#f87171'
}

function tickerRows(rows: { ticker: string; company_name: string | null; score_total: number }[]) {
  return rows.map(r => `
    <tr>
      <td style="padding:8px 16px;font-weight:700;color:#fff;font-size:13px">${r.ticker}</td>
      <td style="padding:8px 16px;color:#71717a;font-size:13px">${r.company_name ?? ''}</td>
      <td style="padding:8px 16px;font-weight:700;font-size:14px;color:${scoreColor(r.score_total)}">${r.score_total}</td>
    </tr>
  `).join('')
}

function buildDigestHtml(
  top: { ticker: string; company_name: string | null; score_total: number }[],
  watchlist: { ticker: string; company_name: string | null; score_total: number }[],
  date: string
) {
  const watchlistSection = watchlist.length > 0 ? `
    <h2 style="color:#fff;font-size:14px;font-weight:700;margin:28px 0 10px;letter-spacing:0.05em;text-transform:uppercase">
      Ta watchlist
    </h2>
    <table style="width:100%;border-collapse:collapse;background:rgba(255,255,255,0.02);border-radius:8px;overflow:hidden">
      ${tickerRows(watchlist)}
    </table>
  ` : ''

  return `<!DOCTYPE html>
<html>
<body style="background:#0f0f1a;color:#e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
  <div style="margin-bottom:28px">
    <span style="font-size:20px;font-weight:800;color:#fff">Alpha<span style="color:#818cf8">Brief</span></span>
  </div>

  <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 4px">Digest hebdomadaire</h1>
  <p style="color:#71717a;font-size:13px;margin:0 0 24px">${date}</p>

  <h2 style="color:#fff;font-size:14px;font-weight:700;margin:0 0 10px;letter-spacing:0.05em;text-transform:uppercase">
    Top 10 du screener
  </h2>
  <table style="width:100%;border-collapse:collapse;background:rgba(255,255,255,0.02);border-radius:8px;overflow:hidden">
    <thead>
      <tr style="border-bottom:1px solid rgba(255,255,255,0.06)">
        <th style="text-align:left;padding:8px 16px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.08em">Ticker</th>
        <th style="text-align:left;padding:8px 16px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.08em">Société</th>
        <th style="text-align:left;padding:8px 16px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.08em">Score</th>
      </tr>
    </thead>
    <tbody>${tickerRows(top)}</tbody>
  </table>

  ${watchlistSection}

  <div style="margin-top:36px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06)">
    <a href="https://maxloop.ovh/dashboard"
       style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">
      Voir le screener →
    </a>
    <p style="margin:16px 0 0;font-size:11px;color:#3f3f46">
      <a href="https://maxloop.ovh/settings" style="color:#52525b;text-decoration:underline">Se désabonner</a>
    </p>
  </div>

  <p style="margin-top:24px;font-size:11px;color:#27272a">
    AlphaBrief est un outil d'aide à la décision, pas un conseil financier.
  </p>
</body>
</html>`
}
