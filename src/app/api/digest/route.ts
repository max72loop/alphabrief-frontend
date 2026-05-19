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
  if (s >= 75) return '#7EE5A3'  // phosphor
  if (s >= 60) return '#5AB983'  // phosphorSoft
  if (s >= 45) return '#E5A04E'  // ember
  return '#D85F66'               // sanguine
}

function tickerRows(rows: { ticker: string; company_name: string | null; score_total: number }[]) {
  return rows.map(r => `
    <tr>
      <td style="padding:10px 18px;font-weight:700;color:#F0EBDB;font-size:13px;font-family:monospace,Menlo,Courier">${r.ticker}</td>
      <td style="padding:10px 18px;color:#C6C0A9;font-size:13px">${r.company_name ?? ''}</td>
      <td style="padding:10px 18px;font-weight:700;font-size:14px;color:${scoreColor(r.score_total)};font-family:monospace,Menlo,Courier">${r.score_total}</td>
    </tr>
  `).join('')
}

function buildDigestHtml(
  top: { ticker: string; company_name: string | null; score_total: number }[],
  watchlist: { ticker: string; company_name: string | null; score_total: number }[],
  date: string
) {
  const watchlistSection = watchlist.length > 0 ? `
    <p style="color:#7EE5A3;font-size:10px;font-weight:700;margin:32px 0 10px;letter-spacing:0.22em;text-transform:uppercase;font-family:monospace,Menlo,Courier">
      § VOTRE SUIVI
    </p>
    <table style="width:100%;border-collapse:collapse;background:#0E1511;border:1px solid #1A2520;border-radius:8px;overflow:hidden">
      ${tickerRows(watchlist)}
    </table>
  ` : ''

  return `<!DOCTYPE html>
<html>
<body style="background:#0A0F0C;color:#F0EBDB;font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;padding:36px 24px">
  <div style="margin-bottom:30px">
    <span style="font-size:22px;font-weight:500;color:#F0EBDB;font-family:Georgia,serif">
      <span style="font-style:italic;color:#7EE5A3">α</span>lpha<span style="font-weight:400">Brief</span>
    </span>
  </div>

  <p style="color:#7EE5A3;font-size:10px;font-weight:700;margin:0 0 10px;letter-spacing:0.22em;text-transform:uppercase;font-family:monospace,Menlo,Courier">
    § DIGEST HEBDOMADAIRE
  </p>
  <h1 style="color:#F0EBDB;font-size:30px;font-weight:500;margin:0 0 4px;letter-spacing:-0.02em;line-height:1.05">
    Édition du <span style="font-style:italic;color:#7EE5A3">${date}</span>.
  </h1>

  <p style="color:#7EE5A3;font-size:10px;font-weight:700;margin:32px 0 10px;letter-spacing:0.22em;text-transform:uppercase;font-family:monospace,Menlo,Courier">
    § TOP 10 DU SCREENER
  </p>
  <table style="width:100%;border-collapse:collapse;background:#0E1511;border:1px solid #1A2520;border-radius:8px;overflow:hidden">
    <thead>
      <tr style="border-bottom:1px solid #1A2520">
        <th style="text-align:left;padding:10px 18px;font-size:10px;color:#6D7A72;text-transform:uppercase;letter-spacing:0.16em;font-family:monospace,Menlo,Courier;font-weight:600">Ticker</th>
        <th style="text-align:left;padding:10px 18px;font-size:10px;color:#6D7A72;text-transform:uppercase;letter-spacing:0.16em;font-family:monospace,Menlo,Courier;font-weight:600">Société</th>
        <th style="text-align:left;padding:10px 18px;font-size:10px;color:#6D7A72;text-transform:uppercase;letter-spacing:0.16em;font-family:monospace,Menlo,Courier;font-weight:600">Score</th>
      </tr>
    </thead>
    <tbody>${tickerRows(top)}</tbody>
  </table>

  ${watchlistSection}

  <div style="margin-top:40px;padding-top:24px;border-top:1px solid #1A2520">
    <a href="https://maxloop.ovh/dashboard"
       style="display:inline-block;padding:11px 22px;background:#7EE5A3;color:#0A0F0C;text-decoration:none;border-radius:8px;font-size:13px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,sans-serif">
      Ouvrir le screener →
    </a>
    <p style="margin:18px 0 0;font-size:10px;color:#4A6355;font-family:monospace,Menlo,Courier;letter-spacing:0.14em;text-transform:uppercase">
      <a href="https://maxloop.ovh/settings" style="color:#6D7A72;text-decoration:underline">Se désabonner</a>
    </p>
  </div>

  <p style="margin-top:28px;font-size:10px;color:#4A6355;font-family:monospace,Menlo,Courier;letter-spacing:0.16em;text-transform:uppercase">
    ALPHABRIEF · OUTIL D'AIDE À LA DÉCISION · NE CONSTITUE PAS UN CONSEIL EN INVESTISSEMENT
  </p>
</body>
</html>`
}
