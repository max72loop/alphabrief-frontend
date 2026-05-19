import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'
import WatchlistButton from '@/app/dashboard/WatchlistButton'
import { Gauge, C, serif, sans, mono } from '@/components/landing/Gauge'
import { TickerTape } from '@/components/landing/TickerTape'

// ── Types ────────────────────────────────────────────────────────────────────

type ImportanceItem = {
  label: string
  importance: number | null
  why: string
  direction: 'positive' | 'negative' | 'neutral'
}

type Financials = {
  revenue_cagr_3y: number | null
  ebit_margin: number | null
  gross_margin: number | null
  fcf_margin: number | null
  roe: number | null
  roic: number | null
  net_debt_to_ebitda: number | null
  pe_ttm: number | null
  ev_ebitda_ttm: number | null
  fcf_yield_ttm: number | null
  pb_ratio: number | null
}

type MarketData = {
  current_price: number | null
  change_pct: number | null
  previous_close: number | null
  volume: number | null
  avg_volume_3m: number | null
  momentum_1m: number | null
  momentum_3m: number | null
  momentum_6m: number | null
  momentum_12m: number | null
  rsi_14: number | null
  sma_50: number | null
  sma_200: number | null
  macd_histogram: number | null
  macd_line: number | null
  beta: number | null
  dividend_yield: number | null
  fifty_two_week_low: number | null
  fifty_two_week_high: number | null
  analyst_target_mean: number | null
  analyst_target_low: number | null
  analyst_target_high: number | null
  analyst_count: number | null
  analyst_recommendation: string | null
}

type TickerScore = {
  ticker: string
  company_name: string | null
  sector: string | null
  exchange: string | null
  currency: string | null
  market_cap: number | null
  one_liner: string | null
  moat_tags: string[] | null
  score_total: number
  score_fundamentals: number
  score_technicals: number
  score_momentum: number
  score_label: string | null
  importance_items: ImportanceItem[] | null
  financials: Financials | null
  market_data: MarketData | null
  score_date: string
  computed_at: string
}

type ScoreHistory = { score: number; confidence: number; scored_at: string }
type PeerRow = Pick<TickerScore,
  'ticker' | 'company_name' | 'score_total' | 'score_fundamentals'
  | 'score_technicals' | 'score_momentum' | 'market_cap' | 'sector'> & {
  financials: Pick<Financials, 'pe_ttm' | 'revenue_cagr_3y'> | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function n(v: number | null | undefined): v is number { return v != null && isFinite(v) }
function fmtPct(v: number | null | undefined, dec = 1): string {
  if (!n(v)) return '—'
  return `${v.toFixed(dec)}%`
}
function fmtSignPct(v: number | null | undefined, dec = 1): string {
  if (!n(v)) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(dec)}%`
}
function fmtCap(v: number | null | undefined): string {
  if (!n(v)) return '—'
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)} T`
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} Mds`
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)} M`
  return `${v}`
}
function fmtVol(v: number | null | undefined): string {
  if (!n(v)) return '—'
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} Md`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)} M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)} K`
  return `${v}`
}
function toneFor(score: number): string {
  if (score >= 75) return C.phosphor
  if (score >= 60) return C.phosphorSoft
  if (score >= 45) return C.ember
  if (score >= 30) return '#E58A4E'
  return C.sanguine
}
function bandFor(score: number): string {
  if (score >= 75) return 'EXCELLENT'
  if (score >= 60) return 'BON'
  if (score >= 45) return 'NEUTRE'
  if (score >= 30) return 'ATTENTION'
  return 'RISQUÉ'
}
function verdictFor(score: number): string {
  if (score >= 75) return 'Signal fort'
  if (score >= 60) return 'À surveiller'
  if (score >= 45) return 'Pas de signal'
  if (score >= 30) return 'Vent contraire'
  return 'À éviter'
}
function dateFmt(iso: string): string {
  const d = new Date(iso)
  const months = ['JANV.', 'FÉV.', 'MARS', 'AVR.', 'MAI', 'JUIN', 'JUIL.', 'AOÛT', 'SEPT.', 'OCT.', 'NOV.', 'DÉC.']
  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]}`
}
function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  if (days < 31) return `il y a ${Math.floor(days / 7)} sem.`
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`
  return `il y a ${Math.floor(days / 365)} ans`
}

// ── Teaser (non-auth) — kept simple ──────────────────────────────────────────

function TeaserBlock({ ticker, row }: { ticker: string; row: TickerScore }) {
  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.ink }}>
      <AppNav activePath="" />
      <main style={{ maxWidth: 1320, margin: '0 auto', padding: '48px 40px' }}>
        <Link href="/dashboard" style={{ fontFamily: mono, fontSize: 11, color: C.muted, textDecoration: 'none', letterSpacing: '0.14em' }}>
          ← RETOUR AU SCREENER
        </Link>

        <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 11, color: toneFor(row.score_total), letterSpacing: '0.22em', marginBottom: 12 }}>
              § APERÇU · {(row.sector ?? '').toUpperCase()}
            </div>
            <h1 style={{ fontFamily: serif, fontSize: 64, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.03em', margin: 0 }}>
              {row.company_name ?? ticker}
            </h1>
            <div style={{ marginTop: 18, fontFamily: mono, fontSize: 13, color: C.muted, letterSpacing: '0.12em' }}>
              {ticker} · {row.exchange ?? '—'}
            </div>
          </div>
          <Gauge value={row.score_total} size={200} stroke={14} label={bandFor(row.score_total)} />
        </div>

        <div style={{ marginTop: 48, padding: 32, border: `1px solid ${C.phosphor}40`, background: `${C.phosphor}06`, borderRadius: 16, textAlign: 'center' }}>
          <div style={{ fontFamily: serif, fontSize: 24, color: C.ink, marginBottom: 12 }}>
            Le dossier complet est <span style={{ fontStyle: 'italic', color: C.phosphor }}>réservé aux comptes.</span>
          </div>
          <div style={{ fontFamily: sans, fontSize: 14, color: C.inkDim, marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
            Décomposition des trois piliers, métriques détaillées, historique du score, comparaison sectorielle.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/login?mode=signup" style={{
              padding: '12px 24px', background: C.phosphor, color: C.bg, borderRadius: 8,
              fontFamily: sans, fontWeight: 600, fontSize: 14, textDecoration: 'none',
            }}>
              Créer un compte gratuit
            </Link>
            <Link href="/login" style={{
              padding: '12px 24px', border: `1px solid ${C.rule}`, color: C.inkDim, borderRadius: 8,
              fontFamily: sans, fontWeight: 600, fontSize: 14, textDecoration: 'none',
            }}>
              Se connecter
            </Link>
          </div>
          <div style={{ marginTop: 18, fontFamily: mono, fontSize: 10, color: C.muteDeep, letterSpacing: '0.18em' }}>
            5 ANALYSES GRATUITES PAR JOUR · SANS CARTE BANCAIRE
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Paywall ──────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 5
const LEMON_URL = process.env.NEXT_PUBLIC_LEMON_CHECKOUT_URL || '/pricing'

function PaywallBlock({
  ticker, companyName, score, email, userId,
}: {
  ticker: string; companyName: string | null; score: number; scoreLabel: string | null
  email: string; userId: string
}) {
  const checkoutUrl = LEMON_URL !== '/pricing'
    ? `${LEMON_URL}?checkout[email]=${encodeURIComponent(email)}&checkout[custom][user_id]=${userId}`
    : '/pricing'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg, color: C.ink }}>
      <AppNav activePath="" />
      <main className="flex-1 flex items-center justify-center" style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.ember, letterSpacing: '0.24em', marginBottom: 18 }}>
            § QUOTA ATTEINT
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 56, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.03em', margin: '0 0 18px' }}>
            <span style={{ fontStyle: 'italic', color: C.ember }}>{companyName ?? ticker}</span> reste verrouillé.
          </h1>
          <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 17, color: C.inkDim, lineHeight: 1.5, margin: '0 auto 32px', maxWidth: 380 }}>
            Vos {DAILY_LIMIT} analyses gratuites sont consommées. Le compteur revient à zéro à minuit UTC.
          </p>
          <div style={{ marginBottom: 24 }}>
            <Gauge value={score} size={140} stroke={10} showNumeral={false} />
          </div>
          <a href={checkoutUrl} style={{
            display: 'block', padding: '14px 22px', background: C.phosphor, color: C.bg, borderRadius: 10,
            fontFamily: sans, fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 12,
          }}>
            Passer à Premium — 4,99 €/mois
          </a>
          <Link href="/dashboard" style={{
            display: 'block', padding: '12px 22px', border: `1px solid ${C.rule}`, color: C.inkDim, borderRadius: 10,
            fontFamily: sans, fontWeight: 600, fontSize: 14, textDecoration: 'none',
          }}>
            Retour au screener
          </Link>
        </div>
      </main>
    </div>
  )
}

// ── §0 Subnav — sticky tabs + actions ────────────────────────────────────────

function DetailsSubnav({ row, ticker, inWatchlist }: {
  row: TickerScore; ticker: string; inWatchlist: boolean
}) {
  const tabs = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'pillars',  label: 'Piliers' },
    { id: 'history',  label: 'Historique' },
    { id: 'peers',    label: 'Pairs' },
    { id: 'events',   label: 'Calendrier' },
  ]
  return (
    <div style={{
      position: 'sticky', top: 56, zIndex: 30,
      background: `${C.bg}F0`, backdropFilter: 'blur(14px)',
      borderBottom: `1px solid ${C.rule}`,
    }}>
      <div style={{
        maxWidth: 1320, margin: '0 auto', padding: '0 40px',
        display: 'flex', alignItems: 'center', gap: 24, height: 52,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>
            {ticker}
          </span>
          <span style={{ fontFamily: sans, fontSize: 12, color: C.muted }}>
            {row.company_name ?? ''}
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', gap: 4, marginLeft: 20 }}>
          {tabs.map(t => (
            <a key={t.id} href={`#${t.id}`} style={{
              padding: '6px 12px', background: 'transparent',
              color: C.muteDeep, textDecoration: 'none',
              fontFamily: sans, fontSize: 13, fontWeight: 400,
              borderBottom: '2px solid transparent', marginBottom: -1,
            }}>
              {t.label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            border: `1px solid ${inWatchlist ? C.phosphor + '60' : C.rule}`,
            padding: '6px 10px', borderRadius: 6,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', fontWeight: 600,
            color: inWatchlist ? C.phosphor : C.inkDim,
          }}>
            <WatchlistButton ticker={ticker} initialInWatchlist={inWatchlist} size="sm" />
            {inWatchlist ? 'SUIVI' : 'SUIVRE'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── §1 Masthead — hero with gauge + verdict ──────────────────────────────────

function DetailsMasthead({ row, ticker, history }: {
  row: TickerScore; ticker: string; history: ScoreHistory[]
}) {
  const score = row.score_total
  const tone = toneFor(score)
  const band = bandFor(score)
  const verdict = verdictFor(score)
  const mkt = row.market_data
  const fin = row.financials
  const currency = row.currency ?? ''

  const decomp = {
    fund: row.score_fundamentals / 100,
    tech: row.score_technicals / 100,
    mom:  row.score_momentum / 100,
  }

  // Takeaways: top 3 importance_items
  const imp = row.importance_items ?? []
  const takeaways = [...imp]
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
    .slice(0, 3)
    .map((t, i) => ({
      tag: t.direction === 'positive' ? 'FORCE' : t.direction === 'negative' ? 'FAIBLESSE' : 'CONTEXTE',
      tone: t.direction === 'positive' ? C.phosphor : t.direction === 'negative' ? C.sanguine : C.ember,
      text: t.why || t.label,
      idx: i + 1,
    }))

  // Last recompute time
  const lastIso = history.length > 0 ? history[history.length - 1].scored_at : row.computed_at
  const lastTime = new Date(lastIso)
  const recomputeLabel = `${lastTime.toISOString().slice(11, 16)} UTC`

  const verdictText = row.one_liner ??
    (score >= 75 ? "Les trois piliers sont alignés. La conjoncture, les fondamentaux et le momentum convergent — c'est exactement la situation que le screener cherche à isoler."
    : score >= 60 ? "Le score est solide, mais un pilier traîne. Avant d'entrer, vérifiez la cohérence entre la croissance et la valorisation."
    : score >= 45 ? "Aucun signal franc dans un sens ou dans l'autre. Le titre n'est ni à acheter ni à éviter — il attend une catalyse."
    : "Plusieurs piliers en faiblesse. Ce n'est pas le moment d'ajouter — c'est le moment de poser des questions au management.")

  return (
    <section id="overview" style={{ padding: '32px 40px 0', maxWidth: 1320, margin: '0 auto' }}>
      {/* breadcrumb / dateline */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.18em',
        paddingBottom: 14, borderBottom: `1px solid ${C.rule}`, flexWrap: 'wrap', gap: 12,
      }}>
        <span>
          <Link href="/dashboard" style={{ color: C.muted, textDecoration: 'none' }}>SCREENER</Link>
          &nbsp;/&nbsp;
          <span style={{ color: C.muted }}>{(row.sector ?? '').toUpperCase()}</span>
          &nbsp;/&nbsp;
          <span style={{ color: C.ink }}>{ticker}</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: C.phosphor,
            boxShadow: `0 0 6px ${C.phosphor}`,
          }} />
          DERNIER RECALCUL · {recomputeLabel}
        </span>
        <span>
          {lastTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
        </span>
      </div>

      {/* Title + price strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 60, padding: '36px 0 28px' }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 11, color: tone, letterSpacing: '0.22em', marginBottom: 14 }}>
            § DOSSIER · {(row.sector ?? '').toUpperCase()}
          </div>
          {(() => {
            const fullName = row.company_name ?? ticker
            const words = fullName.split(/\s+/)
            // Choose font size based on total length (keep title 1-2 lines on most cases)
            const fs = fullName.length > 30 ? 56 : fullName.length > 20 ? 72 : 88
            // Italic split: first word normal, rest italic — only if name has 2-4 words
            if (words.length >= 2 && words.length <= 4) {
              return (
                <h1 style={{
                  fontFamily: serif, fontSize: fs, fontWeight: 500, lineHeight: 0.95,
                  letterSpacing: '-0.04em', color: C.ink, margin: 0,
                }}>
                  {words[0]}<br/>
                  <span style={{ fontStyle: 'italic', color: tone }}>
                    {words.slice(1).join(' ')}
                  </span>
                </h1>
              )
            }
            // Single word or 5+ words → just display without split
            return (
              <h1 style={{
                fontFamily: serif, fontSize: fs, fontWeight: 500, lineHeight: 0.95,
                letterSpacing: '-0.04em', color: C.ink, margin: 0,
              }}>
                {fullName}
              </h1>
            )
          })()}
          <div style={{ display: 'flex', gap: 24, marginTop: 22, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: mono, fontSize: 13, color: C.muted, letterSpacing: '0.12em' }}>
              {ticker} · {row.exchange ?? '—'}
            </span>
            {n(mkt?.current_price) && (
              <span style={{ fontFamily: mono, fontSize: 13, color: C.inkDim }}>
                {mkt!.current_price!.toFixed(2)} {currency}
              </span>
            )}
            {n(mkt?.change_pct) && (
              <>
                <span style={{
                  fontFamily: mono, fontSize: 13, fontWeight: 600,
                  color: mkt!.change_pct! < 0 ? C.sanguine : C.phosphor,
                }}>
                  {mkt!.change_pct! < 0 ? '▼' : '▲'} {fmtSignPct(mkt!.change_pct!)}
                </span>
                <span style={{ fontFamily: mono, fontSize: 12, color: C.muted, letterSpacing: '0.1em' }}>
                  VS HIER
                </span>
              </>
            )}
            {row.moat_tags && row.moat_tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6 }}>
                {row.moat_tags.slice(0, 3).map(t => (
                  <span key={t} style={{
                    fontFamily: mono, fontSize: 9, color: C.phosphor, letterSpacing: '0.16em',
                    border: `1px solid ${C.phosphor}40`, padding: '3px 7px', borderRadius: 3,
                  }}>
                    {t.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Price stat strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          border: `1px solid ${C.rule}`, borderRadius: 12, overflow: 'hidden',
        }}>
          {[
            { lab: 'CAP. BOURS.', val: row.market_cap ? `${fmtCap(row.market_cap)}` : '—' },
            { lab: 'PER', val: n(fin?.pe_ttm) && fin!.pe_ttm! > 0 ? `${fin!.pe_ttm!.toFixed(1)}×` : '—' },
            { lab: 'VOL. JOUR', val: fmtVol(mkt?.volume) },
            {
              lab: '52S RANGE',
              val: n(mkt?.fifty_two_week_low) && n(mkt?.fifty_two_week_high)
                ? `${mkt!.fifty_two_week_low!.toFixed(0)}–${mkt!.fifty_two_week_high!.toFixed(0)}`
                : '—',
              small: true,
            },
          ].map((s, i) => (
            <div key={s.lab} style={{
              padding: '14px 12px', background: C.bgCard,
              borderRight: i < 3 ? `1px solid ${C.rule}` : 'none',
            }}>
              <div style={{ fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: '0.18em' }}>
                {s.lab}
              </div>
              <div style={{
                fontFamily: mono, fontSize: (s as { small?: boolean }).small ? 14 : 20, fontWeight: 600,
                color: C.ink, letterSpacing: '-0.02em', marginTop: 8, lineHeight: 1.1,
              }}>
                {s.val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero block — gauge left, verdict right */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 48,
        padding: '28px 0 48px', alignItems: 'center',
        borderTop: `1px dashed ${C.rule}`, borderBottom: `1px dashed ${C.rule}`,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.22em' }}>
            SCORE COMPOSITE · DÉCOMPOSITION
          </div>
          <Gauge value={score} size={340} stroke={22} decomposition={decomp} showNumeral={true} label={band} />
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { lab: 'FOND.', v: row.score_fundamentals, max: 50, c: C.phosphor },
              { lab: 'TECH.', v: row.score_technicals,   max: 25, c: C.phosphorSoft },
              { lab: 'MOM.',  v: row.score_momentum,     max: 25, c: C.ember },
            ].map(p => (
              <div key={p.lab} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: p.c }} />
                <span style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.12em' }}>
                  {p.lab}
                </span>
                <span style={{ fontFamily: mono, fontSize: 12, color: C.ink, fontWeight: 600 }}>
                  {Math.round(p.v * p.max / 100)}/{p.max}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* verdict editorial */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.22em', marginBottom: 18 }}>
            VERDICT ÉDITORIAL
          </div>
          <div style={{
            fontFamily: serif, fontSize: 56, fontWeight: 500, lineHeight: 1,
            color: tone, letterSpacing: '-0.03em', marginBottom: 18,
          }}>
            {verdict}.
          </div>
          <p style={{
            fontFamily: serif, fontStyle: 'italic', fontSize: 21, lineHeight: 1.5,
            color: C.inkDim, margin: 0, maxWidth: 580,
          }}>
            <span style={{
              fontFamily: serif, fontStyle: 'normal', fontSize: 56, color: tone,
              float: 'left', lineHeight: 0.8, marginRight: 8, marginTop: 8,
            }}>«</span>
            {verdictText}
          </p>

          {takeaways.length > 0 && (
            <div style={{
              marginTop: 28, padding: '20px 0', borderTop: `1px solid ${C.rule}`,
              display: 'grid', gridTemplateColumns: `repeat(${takeaways.length}, 1fr)`, gap: 24,
            }}>
              {takeaways.map(t => (
                <div key={t.idx}>
                  <div style={{
                    fontFamily: mono, fontSize: 10, color: t.tone, letterSpacing: '0.18em', marginBottom: 6,
                  }}>
                    {String(t.idx).padStart(2, '0')} · {t.tag}
                  </div>
                  <div style={{ fontFamily: sans, fontSize: 13, color: C.ink, lineHeight: 1.45 }}>
                    {t.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ── §2 PillarsDeepDive — 3 columns with metrics ──────────────────────────────

type PillarMetric = { lab: string; val: string; good: boolean | null }

function PillarsDeepDive({ row }: { row: TickerScore }) {
  const fin = row.financials
  const mkt = row.market_data
  const cur = mkt?.current_price

  const fundMetrics: PillarMetric[] = [
    { lab: 'Marge EBIT',     val: fmtPct(fin?.ebit_margin),     good: n(fin?.ebit_margin) ? fin!.ebit_margin! >= 15 : null },
    { lab: 'ROIC',           val: fmtPct(fin?.roic),            good: n(fin?.roic) ? fin!.roic! >= 15 : null },
    { lab: 'Croiss. CA 3a',  val: fmtSignPct(fin?.revenue_cagr_3y), good: n(fin?.revenue_cagr_3y) ? fin!.revenue_cagr_3y! >= 10 : null },
    { lab: 'FCF Margin',     val: fmtPct(fin?.fcf_margin),      good: n(fin?.fcf_margin) ? fin!.fcf_margin! >= 10 : null },
    { lab: 'ROE',            val: fmtPct(fin?.roe),             good: n(fin?.roe) ? fin!.roe! >= 15 : null },
    { lab: 'Dette / EBITDA', val: n(fin?.net_debt_to_ebitda) ? `${fin!.net_debt_to_ebitda!.toFixed(1)}×` : '—', good: n(fin?.net_debt_to_ebitda) ? fin!.net_debt_to_ebitda! < 2 : null },
  ]

  const trendLabel = (() => {
    if (!n(mkt?.sma_50) || !n(mkt?.sma_200) || !n(cur)) return '—'
    if (cur! > mkt!.sma_50! && mkt!.sma_50! > mkt!.sma_200!) return 'Haussier'
    if (cur! < mkt!.sma_50! && mkt!.sma_50! < mkt!.sma_200!) return 'Baissier'
    return 'Mixte'
  })()
  const trendGood = trendLabel === 'Haussier'

  const distMa50 = n(cur) && n(mkt?.sma_50)
    ? ((cur! - mkt!.sma_50!) / mkt!.sma_50!) * 100
    : null
  const volRel = n(mkt?.volume) && n(mkt?.avg_volume_3m) && mkt!.avg_volume_3m! > 0
    ? mkt!.volume! / mkt!.avg_volume_3m!
    : null

  const techMetrics: PillarMetric[] = [
    { lab: 'RSI 14',        val: n(mkt?.rsi_14) ? mkt!.rsi_14!.toFixed(0) : '—', good: n(mkt?.rsi_14) ? mkt!.rsi_14! >= 30 && mkt!.rsi_14! <= 70 : null },
    { lab: 'Tendance',      val: trendLabel, good: trendLabel !== '—' ? trendGood : null },
    { lab: 'Distance SMA50',val: fmtSignPct(distMa50), good: n(distMa50) ? Math.abs(distMa50) < 10 : null },
    { lab: 'Volume relatif',val: n(volRel) ? `${volRel.toFixed(2)}×` : '—', good: n(volRel) ? volRel >= 0.8 && volRel <= 2 : null },
    { lab: 'Beta',          val: n(mkt?.beta) ? mkt!.beta!.toFixed(2) : '—', good: n(mkt?.beta) ? mkt!.beta! < 1.5 : null },
    { lab: 'MACD',          val: n(mkt?.macd_histogram) ? (mkt!.macd_histogram! >= 0 ? 'Bullish' : 'Bearish') : '—', good: n(mkt?.macd_histogram) ? mkt!.macd_histogram! >= 0 : null },
  ]

  const momMetrics: PillarMetric[] = [
    { lab: 'Perf 1M',   val: fmtSignPct(mkt?.momentum_1m),   good: n(mkt?.momentum_1m)  ? mkt!.momentum_1m!  >= 0 : null },
    { lab: 'Perf 3M',   val: fmtSignPct(mkt?.momentum_3m),   good: n(mkt?.momentum_3m)  ? mkt!.momentum_3m!  >= 0 : null },
    { lab: 'Perf 6M',   val: fmtSignPct(mkt?.momentum_6m),   good: n(mkt?.momentum_6m)  ? mkt!.momentum_6m!  >= 0 : null },
    { lab: 'Perf 12M',  val: fmtSignPct(mkt?.momentum_12m),  good: n(mkt?.momentum_12m) ? mkt!.momentum_12m! >= 0 : null },
    { lab: 'Vol. 1Y',   val: n(mkt?.beta) ? `${(mkt!.beta! * 16).toFixed(0)}%` : '—', good: null },
    { lab: 'Drawdown',  val: n(mkt?.fifty_two_week_high) && n(cur)
        ? `${(((cur! - mkt!.fifty_two_week_high!) / mkt!.fifty_two_week_high!) * 100).toFixed(0)}%`
        : '—',
      good: n(mkt?.fifty_two_week_high) && n(cur) ? cur! / mkt!.fifty_two_week_high! > 0.85 : null },
  ]

  const pillars = [
    {
      key: 'fund', label: 'FONDAMENTAUX', weight: 50, color: C.phosphor,
      value: row.score_fundamentals, total: 50,
      title: "Ce que l'entreprise vaut.",
      thesis: row.one_liner ??
        "Les fondamentaux décrivent la machine économique : marges, retour sur capital, capacité à générer du cash. Plus le score est haut, plus l'entreprise transforme efficacement son chiffre d'affaires en valeur.",
      metrics: fundMetrics,
    },
    {
      key: 'tech', label: 'TECHNIQUE', weight: 25, color: C.phosphorSoft,
      value: row.score_technicals, total: 25,
      title: 'Ce que le marché en pense.',
      thesis: "RSI, tendance moyenne mobile, distance aux supports : ce pilier capte le rapport entre prix et signaux de marché. Il ne dit pas si l'entreprise est bonne, il dit si le moment d'entrée est cohérent.",
      metrics: techMetrics,
    },
    {
      key: 'mom', label: 'MOMENTUM', weight: 25, color: C.ember,
      value: row.score_momentum, total: 25,
      title: 'Où va le vent.',
      thesis: "Performance sur 1, 3, 6, 12 mois. Le momentum mesure la pente du titre — un score élevé indique une dynamique en place. Attention à la lecture isolée : un momentum fort sans fondamentaux est un signal de surchauffe.",
      metrics: momMetrics,
    },
  ]

  return (
    <section id="pillars" style={{ padding: '60px 40px', maxWidth: 1320, margin: '0 auto' }}>
      <div style={{
        borderTop: `2px solid ${C.ink}`, borderBottom: `1px solid ${C.rule}`,
        padding: '18px 0 14px', marginBottom: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.3em', color: C.phosphor, marginBottom: 6 }}>
            § 01 · TROIS PILIERS
          </div>
          <h2 style={{
            fontFamily: serif, fontSize: 38, fontWeight: 500,
            letterSpacing: '-0.025em', color: C.ink, margin: 0, lineHeight: 1,
          }}>
            <span style={{ fontFamily: mono, fontSize: 32 }}>{Math.round(row.score_total)}</span> points — <span style={{ fontStyle: 'italic', color: C.phosphor }}>décomposés.</span>
          </h2>
        </div>
        <div style={{ fontFamily: mono, fontSize: 11, color: C.muted, textAlign: 'right', letterSpacing: '0.1em' }}>
          QUALITY 50% · TECHNICAL 25%<br/>MOMENTUM 25%
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        borderBottom: `1px solid ${C.rule}`,
      }}>
        {pillars.map((p, i) => {
          const pillarPct = (p.value * 100) / (p.total * 4)
          return (
          <div key={p.key} style={{
            padding: '28px 24px',
            borderRight: i < 2 ? `1px solid ${C.rule}` : 'none',
            display: 'flex', flexDirection: 'column', gap: 18,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: mono, fontSize: 10, color: p.color, letterSpacing: '0.22em', fontWeight: 600 }}>
                  {p.label}
                </div>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: C.ink, marginTop: 8, letterSpacing: '-0.02em' }}>
                  {p.title}
                </div>
                <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.1em', marginTop: 4 }}>
                  PONDÉRATION {p.weight}%
                </div>
              </div>
              <Gauge value={p.value} size={68} stroke={6} showNumeral={false} />
            </div>

            <div style={{
              padding: '14px 0', borderTop: `1px dashed ${C.rule}`, borderBottom: `1px dashed ${C.rule}`,
              display: 'flex', alignItems: 'baseline', gap: 10,
            }}>
              <span style={{
                fontFamily: mono, fontSize: 48, fontWeight: 600,
                color: p.color, letterSpacing: '-0.04em', lineHeight: 1,
              }}>
                {Math.round(p.value * p.total / 100)}
              </span>
              <span style={{ fontFamily: mono, fontSize: 20, color: C.muted, fontWeight: 500 }}>
                /{p.total}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 11, color: p.color, letterSpacing: '0.14em' }}>
                {Math.round(p.value)}% UTILISÉS
              </span>
              {/* keep pillarPct referenced */}
              <span style={{ display: 'none' }}>{pillarPct}</span>
            </div>

            <p style={{
              fontFamily: serif, fontStyle: 'italic', fontSize: 14.5, lineHeight: 1.5,
              color: C.inkDim, margin: 0,
            }}>
              <span style={{ color: p.color, fontStyle: 'normal', marginRight: 6 }}>›</span>
              {p.thesis}
            </p>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: 0,
              border: `1px solid ${C.rule}`, borderRadius: 8, overflow: 'hidden',
            }}>
              {p.metrics.map((m, j) => (
                <div key={m.lab} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto',
                  padding: '10px 12px', gap: 10, alignItems: 'baseline',
                  background: j % 2 === 0 ? C.bgCard : 'transparent',
                  borderBottom: j < p.metrics.length - 1 ? `1px solid ${C.rule}` : 'none',
                }}>
                  <div style={{ fontFamily: sans, fontSize: 12, color: C.inkDim }}>{m.lab}</div>
                  <div style={{
                    fontFamily: mono, fontSize: 13, fontWeight: 600,
                    color: m.good === null ? C.muted : (m.good ? C.ink : C.ember),
                    letterSpacing: '-0.01em', textAlign: 'right',
                  }}>
                    {m.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )})}
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        padding: '12px 0', fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.1em',
      }}>
        <span>SOURCES : FUNDAMENTALS · MARKET DATA · CACHE 4H</span>
        <span>MÉTHODE INSPIRÉE DE BRIAN FEROLDI</span>
      </div>
    </section>
  )
}

// ── §3 ScoreHistory — chart with real score_history data ─────────────────────

function ScoreHistorySection({ history, currentScore }: {
  history: ScoreHistory[]; currentScore: number
}) {
  if (history.length < 2) {
    return (
      <section id="history" style={{ padding: '40px 40px 60px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{
          borderTop: `2px solid ${C.ink}`, borderBottom: `1px solid ${C.rule}`,
          padding: '18px 0 14px',
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.3em', color: C.phosphor, marginBottom: 6 }}>
            § 02 · HISTORIQUE DU SCORE
          </div>
          <h2 style={{ fontFamily: serif, fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', color: C.ink, margin: 0 }}>
            Pas encore <span style={{ fontStyle: 'italic', color: C.phosphor }}>d&apos;historique.</span>
          </h2>
          <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 15, color: C.inkDim, marginTop: 12 }}>
            Le score est recalculé toutes les nuits. Repassez demain pour voir la première variation.
          </p>
        </div>
      </section>
    )
  }

  const points = history.map(h => ({ score: h.score, iso: h.scored_at }))
  // Use currentScore for the latest point to keep alignment with the masthead
  const seriesWithCurrent = [...points.slice(0, -1), { score: currentScore, iso: points[points.length - 1].iso }]
  const W = 1100, H = 280, P = { l: 50, r: 30, t: 20, b: 36 }
  const ix = (i: number) => P.l + (i / Math.max(1, seriesWithCurrent.length - 1)) * (W - P.l - P.r)
  const iy = (s: number) => P.t + (1 - s / 100) * (H - P.t - P.b)
  const path = seriesWithCurrent.map((p, i) => `${i === 0 ? 'M' : 'L'} ${ix(i)} ${iy(p.score)}`).join(' ')
  const area = path + ` L ${ix(seriesWithCurrent.length - 1)} ${H - P.b} L ${ix(0)} ${H - P.b} Z`

  const bands = [
    { min: 75, max: 100, c: C.phosphor,     lab: 'EXCELLENT' },
    { min: 60, max: 75,  c: C.phosphorSoft, lab: 'BON' },
    { min: 45, max: 60,  c: C.ember,        lab: 'NEUTRE' },
    { min: 30, max: 45,  c: '#E58A4E',      lab: 'ATTENTION' },
    { min: 0,  max: 30,  c: C.sanguine,     lab: 'RISQUÉ' },
  ]

  const firstScore = Math.round(seriesWithCurrent[0].score)
  const lastScore = Math.round(seriesWithCurrent[seriesWithCurrent.length - 1].score)
  const delta = lastScore - firstScore
  const firstDate = new Date(seriesWithCurrent[0].iso)
  const lastDate = new Date(seriesWithCurrent[seriesWithCurrent.length - 1].iso)
  const days = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / 86_400_000))
  const periodLabel = days >= 365 ? `${Math.round(days / 365)} an${days >= 730 ? 's' : ''}`
    : days >= 30 ? `${Math.round(days / 30)} mois`
    : `${days} jours`

  return (
    <section id="history" style={{ padding: '40px 40px 60px', maxWidth: 1320, margin: '0 auto' }}>
      <div style={{
        borderTop: `2px solid ${C.ink}`, borderBottom: `1px solid ${C.rule}`,
        padding: '18px 0 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.3em', color: C.phosphor, marginBottom: 6 }}>
            § 02 · HISTORIQUE DU SCORE
          </div>
          <h2 style={{
            fontFamily: serif, fontSize: 38, fontWeight: 500,
            letterSpacing: '-0.025em', color: C.ink, margin: 0, lineHeight: 1,
          }}>
            <span style={{ fontFamily: mono, fontSize: 32 }}>{firstScore}</span> →
            <span style={{ fontFamily: mono, fontSize: 32, color: C.phosphor }}> {lastScore}</span>
            &nbsp;sur {periodLabel}. <span style={{ fontStyle: 'italic', color: delta >= 0 ? C.phosphor : C.sanguine }}>
              {delta >= 0 ? '+' : ''}{delta} points.
            </span>
          </h2>
        </div>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.18em' }}>
          {seriesWithCurrent.length} POINTS · 1/JOUR
        </div>
      </div>

      <div style={{
        background: C.bgCard, border: `1px solid ${C.rule}`, borderRadius: 16,
        padding: '28px 28px 22px', marginTop: 16,
      }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="score-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={C.phosphor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={C.phosphor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[100, 75, 60, 45, 30, 0].map(y => (
            <g key={y}>
              <line x1={P.l} y1={iy(y)} x2={W - P.r} y2={iy(y)}
                stroke={y === 0 || y === 100 ? C.rule : C.ruleDim}
                strokeDasharray={y === 100 || y === 0 ? '0' : '2 4'} />
              <text x={P.l - 8} y={iy(y) + 3} textAnchor="end"
                style={{ fontFamily: mono, fontSize: 10, fill: C.muted }}>
                {y}
              </text>
            </g>
          ))}

          {bands.map(b => (
            <text key={b.lab} x={W - P.r - 6} y={iy((b.min + b.max) / 2) + 3} textAnchor="end"
              style={{ fontFamily: mono, fontSize: 9, fill: b.c, letterSpacing: '0.16em', opacity: 0.5 }}>
              {b.lab}
            </text>
          ))}

          <path d={area} fill="url(#score-area)" />
          <path d={path} fill="none" stroke={toneFor(lastScore)} strokeWidth="2" strokeLinecap="round" />

          <circle cx={ix(seriesWithCurrent.length - 1)} cy={iy(lastScore)} r="6"
            fill={toneFor(lastScore)} opacity="0.3" />
          <circle cx={ix(seriesWithCurrent.length - 1)} cy={iy(lastScore)} r="3"
            fill={toneFor(lastScore)} />
        </svg>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        padding: '12px 0', fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.1em',
      }}>
        <span>1 POINT PAR RECALCUL · RANGE COMPLET DISPONIBLE</span>
        <span>DU {dateFmt(seriesWithCurrent[0].iso)} AU {dateFmt(seriesWithCurrent[seriesWithCurrent.length - 1].iso)}</span>
      </div>
    </section>
  )
}

// ── §4 PeersComparison — same sector top 5 ───────────────────────────────────

function PeersComparison({ row, peers }: { row: TickerScore; peers: PeerRow[] }) {
  if (peers.length === 0) {
    return null
  }

  const all: (PeerRow & { isYou?: boolean })[] = [
    {
      ticker: row.ticker,
      company_name: row.company_name,
      score_total: row.score_total,
      score_fundamentals: row.score_fundamentals,
      score_technicals: row.score_technicals,
      score_momentum: row.score_momentum,
      market_cap: row.market_cap,
      sector: row.sector,
      financials: row.financials ? { pe_ttm: row.financials.pe_ttm, revenue_cagr_3y: row.financials.revenue_cagr_3y } : null,
      isYou: true,
    },
    ...peers,
  ]

  const sorted = [...all].sort((a, b) => b.score_total - a.score_total)
  const rank = sorted.findIndex(p => p.isYou) + 1

  return (
    <section id="peers" style={{ padding: '40px 40px 60px', maxWidth: 1320, margin: '0 auto' }}>
      <div style={{
        borderTop: `2px solid ${C.ink}`, borderBottom: `1px solid ${C.rule}`,
        padding: '18px 0 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.3em', color: C.phosphor, marginBottom: 6 }}>
            § 03 · COMPARABLES SECTORIELLES
          </div>
          <h2 style={{
            fontFamily: serif, fontSize: 38, fontWeight: 500,
            letterSpacing: '-0.025em', color: C.ink, margin: 0, lineHeight: 1,
          }}>
            <span style={{ fontStyle: 'italic', color: C.phosphor }}>{row.ticker}</span> face à {peers.length} pair{peers.length > 1 ? 's' : ''} — rang
            <span style={{ fontFamily: mono, fontSize: 30, color: C.phosphor, padding: '0 6px' }}>{rank}</span>
            sur {sorted.length}.
          </h2>
        </div>
        <div style={{ fontFamily: mono, fontSize: 11, color: C.muted, textAlign: 'right', letterSpacing: '0.1em' }}>
          UNIVERS : {(row.sector ?? '').toUpperCase()}<br/>
          PAIRS RETENUS : {peers.length}
        </div>
      </div>

      <div>
        <div style={{
          display: 'grid', gridTemplateColumns: '60px 1.4fr 90px 1fr 100px 100px 110px',
          padding: '14px 0', gap: 16,
          fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', color: C.muted,
          borderBottom: `1px solid ${C.rule}`,
        }}>
          <span>GAUGE</span>
          <span>TITRE</span>
          <span style={{ textAlign: 'right' }}>SCORE</span>
          <span>F · T · M</span>
          <span style={{ textAlign: 'right' }}>CAP.</span>
          <span style={{ textAlign: 'right' }}>PER</span>
          <span style={{ textAlign: 'right' }}>CROISS. CA</span>
        </div>

        {sorted.map((p, i) => (
          <div key={p.ticker} style={{
            display: 'grid', gridTemplateColumns: '60px 1.4fr 90px 1fr 100px 100px 110px',
            padding: '18px 0', gap: 16, alignItems: 'center',
            borderBottom: i === sorted.length - 1 ? 'none' : `1px solid ${C.rule}`,
            background: p.isYou ? `${C.phosphor}06` : 'transparent',
            position: 'relative',
          }}>
            {p.isYou && (
              <span style={{
                position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
                width: 4, height: 32, background: C.phosphor, borderRadius: 2,
              }} />
            )}
            <Gauge value={p.score_total} size={48} stroke={5} showNumeral={false} />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                {p.isYou ? (
                  <span style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>
                    {p.ticker}
                  </span>
                ) : (
                  <Link href={`/ticker/${p.ticker}`} style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em', textDecoration: 'none' }}>
                    {p.ticker}
                  </Link>
                )}
                {p.isYou && (
                  <span style={{
                    fontFamily: mono, fontSize: 9, color: C.phosphor, letterSpacing: '0.18em',
                    border: `1px solid ${C.phosphor}60`, padding: '2px 6px', borderRadius: 3,
                  }}>
                    VOUS LISEZ
                  </span>
                )}
              </div>
              <div style={{ fontFamily: sans, fontSize: 13, color: C.inkDim, marginTop: 2 }}>
                {p.company_name ?? '—'}
              </div>
            </div>
            <div style={{
              textAlign: 'right',
              fontFamily: mono, fontSize: 26, fontWeight: 600,
              color: toneFor(p.score_total), letterSpacing: '-0.04em', lineHeight: 1,
            }}>
              {Math.round(p.score_total)}
            </div>
            <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: C.rule }}>
              <span style={{ width: `${(p.score_fundamentals / 100) * (100 / 3)}%`, background: C.phosphor }} />
              <span style={{ width: `${(p.score_technicals  / 100) * (100 / 3)}%`, background: C.phosphorSoft }} />
              <span style={{ width: `${(p.score_momentum    / 100) * (100 / 3)}%`, background: C.ember }} />
            </div>
            <div style={{ textAlign: 'right', fontFamily: mono, fontSize: 13, color: C.ink }}>
              {fmtCap(p.market_cap)}
            </div>
            <div style={{ textAlign: 'right', fontFamily: mono, fontSize: 13, color: C.inkDim }}>
              {n(p.financials?.pe_ttm) && p.financials!.pe_ttm! > 0 ? `${p.financials!.pe_ttm!.toFixed(1)}×` : '—'}
            </div>
            <div style={{
              textAlign: 'right', fontFamily: mono, fontSize: 13, fontWeight: 600,
              color: n(p.financials?.revenue_cagr_3y)
                ? (p.financials!.revenue_cagr_3y! < 0 ? C.sanguine : C.phosphor)
                : C.muted,
            }}>
              {fmtSignPct(p.financials?.revenue_cagr_3y, 0)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── §5 EventsTimeline — derived from score_history big moves ─────────────────

type DerivedEvent = { iso: string; score: number; prev: number; delta: number }

function deriveEvents(history: ScoreHistory[]): DerivedEvent[] {
  if (history.length < 2) return []
  const events: DerivedEvent[] = []
  for (let i = 1; i < history.length; i++) {
    const delta = history[i].score - history[i - 1].score
    if (Math.abs(delta) >= 3) {
      events.push({
        iso: history[i].scored_at,
        score: history[i].score,
        prev: history[i - 1].score,
        delta,
      })
    }
  }
  // Most recent first, max 5
  return events.reverse().slice(0, 5)
}

function EventsTimeline({ ticker, history }: { ticker: string; history: ScoreHistory[] }) {
  const events = deriveEvents(history)

  return (
    <section id="events" style={{ padding: '40px 40px 60px', maxWidth: 1320, margin: '0 auto' }}>
      <div style={{
        borderTop: `2px solid ${C.ink}`, borderBottom: `1px solid ${C.rule}`,
        padding: '18px 0 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.3em', color: C.phosphor, marginBottom: 6 }}>
            § 04 · MOUVEMENTS RÉCENTS
          </div>
          <h2 style={{
            fontFamily: serif, fontSize: 38, fontWeight: 500,
            letterSpacing: '-0.025em', color: C.ink, margin: 0, lineHeight: 1,
          }}>
            {events.length > 0
              ? <>Cinq variations <span style={{ fontStyle: 'italic', color: C.phosphor }}>marquantes</span>.</>
              : <>Un score <span style={{ fontStyle: 'italic', color: C.phosphor }}>stable</span>.</>
            }
          </h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, paddingTop: 28 }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.22em', marginBottom: 14 }}>
            HISTORIQUE RÉCENT
          </div>
          {events.length === 0 ? (
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: C.inkDim, lineHeight: 1.5 }}>
              Pas encore de variation supérieure à 3 points sur la fenêtre d&apos;observation. Le titre traverse une phase calme — utile à savoir, peu d&apos;urgence.
            </p>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 24 }}>
              <div style={{
                position: 'absolute', left: 6, top: 4, bottom: 4, width: 1,
                background: `linear-gradient(to bottom, ${C.phosphor}, ${C.rule})`,
              }} />
              {events.map((e, i) => {
                const up = e.delta > 0
                const tone = up ? C.phosphor : C.sanguine
                return (
                  <div key={i} style={{
                    position: 'relative',
                    paddingBottom: i === events.length - 1 ? 0 : 22,
                  }}>
                    <span style={{
                      position: 'absolute', left: -22, top: 4,
                      width: 13, height: 13, borderRadius: '50%',
                      background: C.bg, border: `2px solid ${tone}`,
                      boxShadow: i === 0 ? `0 0 10px ${tone}80` : 'none',
                    }} />
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: mono, fontSize: 11, color: C.ink, fontWeight: 600, letterSpacing: '0.08em' }}>
                        {dateFmt(e.iso)}
                      </span>
                      <span style={{ fontFamily: mono, fontSize: 9, color: tone, letterSpacing: '0.18em', fontWeight: 600 }}>
                        {up ? 'HAUSSE' : 'BAISSE'}
                      </span>
                      <span style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.1em', marginLeft: 'auto' }}>
                        {timeAgo(e.iso).toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 500, color: C.ink, letterSpacing: '-0.01em', marginBottom: 6 }}>
                      Score recalculé
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{
                        fontFamily: mono, fontSize: 11, fontWeight: 600,
                        color: tone,
                      }}>
                        {up ? '▲' : '▼'} {Math.abs(e.delta).toFixed(0)} pts ({Math.round(e.prev)} → {Math.round(e.score)})
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column — alert CTA */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.22em', marginBottom: 14 }}>
            ALERTES
          </div>
          <div style={{
            padding: '20px 22px',
            background: `${C.phosphor}06`, border: `1px solid ${C.phosphor}30`,
            borderRadius: 12,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: C.phosphor, letterSpacing: '0.2em', marginBottom: 10 }}>
              🔔 PROCHAINE PUBLICATION
            </div>
            <div style={{ fontFamily: serif, fontSize: 18, color: C.ink, lineHeight: 1.35, fontWeight: 500 }}>
              Soyez prévenu si le score de <span style={{ color: C.phosphor, fontFamily: mono }}>{ticker}</span> franchit <span style={{ color: C.phosphor, fontFamily: mono }}>80</span> ou passe sous <span style={{ color: C.ember, fontFamily: mono }}>70</span>.
            </div>
            <Link href="/alerts" style={{
              display: 'inline-block', marginTop: 16,
              padding: '9px 18px', background: C.phosphor, color: C.bg,
              fontFamily: sans, fontSize: 13, fontWeight: 600,
              borderRadius: 8, textDecoration: 'none',
            }}>
              Configurer une alerte →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── §6 NextRead — 3 related tickers same sector ──────────────────────────────

function NextRead({ peers }: { peers: PeerRow[] }) {
  if (peers.length === 0) return null
  const next = peers.slice(0, 3)
  return (
    <section style={{ padding: '40px 40px 60px', maxWidth: 1320, margin: '0 auto' }}>
      <div style={{
        borderTop: `2px solid ${C.ink}`,
        padding: '18px 0 14px',
      }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.3em', color: C.phosphor, marginBottom: 6 }}>
          § 05 · À LIRE ENSUITE
        </div>
        <h2 style={{
          fontFamily: serif, fontSize: 32, fontWeight: 500,
          letterSpacing: '-0.025em', color: C.ink, margin: 0, lineHeight: 1,
        }}>
          Trois dossiers <span style={{ fontStyle: 'italic', color: C.phosphor }}>connexes</span>.
        </h2>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${next.length}, 1fr)`, gap: 0,
        borderBottom: `1px solid ${C.rule}`, borderTop: `1px solid ${C.rule}`,
        marginTop: 20,
      }}>
        {next.map((n2, i) => {
          const tone = toneFor(n2.score_total)
          return (
            <Link href={`/ticker/${n2.ticker}`} key={n2.ticker} style={{
              padding: '24px 24px',
              borderRight: i < next.length - 1 ? `1px solid ${C.rule}` : 'none',
              display: 'flex', alignItems: 'center', gap: 18, textDecoration: 'none',
            }}>
              <Gauge value={n2.score_total} size={56} stroke={6} showNumeral={false} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>
                  {n2.ticker} <span style={{
                    fontFamily: mono, fontSize: 18, color: tone, fontWeight: 600, marginLeft: 8,
                  }}>{Math.round(n2.score_total)}</span>
                </div>
                <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14, color: C.inkDim, marginTop: 4 }}>
                  Même secteur — {n2.company_name ?? n2.ticker}.
                </div>
              </div>
              <span style={{ fontFamily: mono, fontSize: 14, color: C.phosphor }}>→</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default async function TickerPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const ticker = symbol.toUpperCase()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const today = new Date().toISOString().slice(0, 10)

  const { data: tickerData, error: tickerError } = await supabase
    .from('ticker_scores').select('*').eq('ticker', ticker).single()

  if (tickerError || !tickerData) notFound()
  const row = tickerData as TickerScore

  if (!user) {
    return <TeaserBlock ticker={ticker} row={row} />
  }

  const [inWatchlistResult, historyResult, profileResult, peersResult] = await Promise.all([
    (async () => {
      try {
        const { data: wl } = await supabase.from('watchlists').select('id').eq('user_id', user.id).maybeSingle()
        if (!wl) return false
        const { data: item } = await supabase.from('watchlist_tickers').select('id')
          .eq('watchlist_id', wl.id).eq('ticker', ticker).maybeSingle()
        return !!item
      } catch { return false }
    })(),
    supabase.from('score_history').select('score, confidence, scored_at')
      .eq('ticker', ticker).order('scored_at', { ascending: true }).limit(60),
    supabase.from('profiles')
      .select('plan, analyses_today, last_analysis_date')
      .eq('id', user.id)
      .maybeSingle(),
    row.sector
      ? supabase.from('ticker_scores')
          .select('ticker, company_name, score_total, score_fundamentals, score_technicals, score_momentum, market_cap, sector, financials')
          .eq('sector', row.sector)
          .neq('ticker', ticker)
          .order('score_total', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] as PeerRow[] }),
  ])

  const profile = profileResult.data
  const isPremium = (profile?.plan ?? '').toLowerCase() === 'premium'
  const isToday = profile?.last_analysis_date === today
  const usedToday = isToday ? (profile?.analyses_today ?? 0) : 0

  if (!isPremium && usedToday >= DAILY_LIMIT) {
    return (
      <PaywallBlock
        ticker={ticker}
        companyName={row.company_name}
        score={row.score_total}
        scoreLabel={row.score_label}
        email={user.email ?? ''}
        userId={user.id}
      />
    )
  }

  if (!isPremium) {
    await supabase.from('profiles').upsert({
      id: user.id,
      analyses_today: usedToday + 1,
      last_analysis_date: today,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  const inWatchlist = inWatchlistResult
  const history = (historyResult.data ?? []) as ScoreHistory[]
  const peers = (peersResult.data ?? []) as PeerRow[]

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.ink }}>
      <AppNav activePath="" />
      <TickerTape inline />
      <DetailsSubnav row={row} ticker={ticker} inWatchlist={inWatchlist} />

      <main>
        <DetailsMasthead row={row} ticker={ticker} history={history} />
        <PillarsDeepDive row={row} />
        <ScoreHistorySection history={history} currentScore={row.score_total} />
        <PeersComparison row={row} peers={peers} />
        <EventsTimeline ticker={ticker} history={history} />
        <NextRead peers={peers} />

        <footer style={{
          borderTop: `1px solid ${C.rule}`,
          padding: '24px 40px',
          maxWidth: 1320,
          margin: '40px auto 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: mono,
          fontSize: 10,
          color: C.muted,
          letterSpacing: '0.14em',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <span>ALPHABRIEF · DOSSIER {ticker} · NE CONSTITUE PAS UN CONSEIL EN INVESTISSEMENT</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/methode" style={{ color: 'inherit', textDecoration: 'none' }}>MÉTHODE</Link>
            <Link href="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>PRICING</Link>
            <Link href="/alerts" style={{ color: 'inherit', textDecoration: 'none' }}>ALERTES</Link>
          </div>
        </footer>
      </main>
    </div>
  )
}
