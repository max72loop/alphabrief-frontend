import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProfilPanel from './ProfilPanel'

async function getUnreadCount() {
  try {
    const supabase = await createClient()
    const { count } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('read', false)
    return count ?? 0
  } catch { return 0 }
}

async function getWatchlistCount(userId: string) {
  try {
    const supabase = await createClient()
    const { data: wl } = await supabase
      .from('watchlists').select('id').eq('user_id', userId).maybeSingle()
    if (!wl) return 0
    const { count } = await supabase
      .from('watchlist_tickers').select('*', { count: 'exact', head: true })
      .eq('watchlist_id', wl.id)
    return count ?? 0
  } catch { return 0 }
}

async function getAnalysesInfo(userId: string): Promise<{ isPremium: boolean; remaining: number | null }> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('is_premium, analyses_today, last_analysis_date')
      .eq('id', userId)
      .maybeSingle()
    if (!data) return { isPremium: false, remaining: 5 }
    if (data.is_premium) return { isPremium: true, remaining: null }
    const today = new Date().toISOString().slice(0, 10)
    const usedToday = data.last_analysis_date === today ? (data.analyses_today ?? 0) : 0
    return { isPremium: false, remaining: Math.max(0, 5 - usedToday) }
  } catch { return { isPremium: false, remaining: null } }
}

export default async function AppNav({ activePath }: { activePath?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [unread, watchlistCount, analysesInfo] = await Promise.all([
    getUnreadCount(),
    user ? getWatchlistCount(user.id) : Promise.resolve(0),
    user ? getAnalysesInfo(user.id) : Promise.resolve({ isPremium: false, remaining: null }),
  ])

  const navLink = (href: string, label: string, matchPaths?: string[]) => {
    const paths = matchPaths ?? [href]
    const active = paths.some(p => activePath === p || activePath?.startsWith(p))
    return (
      <Link
        href={href}
        className={`text-sm font-medium transition-colors ${
          active ? 'text-white' : 'text-zinc-500 hover:text-zinc-200'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <>
      <nav className="flex items-center px-6 h-14 border-b border-white/[0.06] bg-[#0a0a14] sticky top-0 z-40">
        {/* Brand */}
        <Link href="/dashboard" className="text-base font-bold tracking-tight mr-8 shrink-0">
          Alpha<span className="text-indigo-400">Brief</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6 flex-1">
          {navLink('/dashboard', 'Mon suivi', ['/dashboard', '/watchlist', '/ticker'])}
          {navLink('/marche', 'Marché')}
          {navLink('/compare', 'Comparer')}
          {navLink('/portfolio', 'Portfolio')}
          {navLink('/methode', 'Méthode')}
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          {/* Alertes */}
          <Link href="/alerts" className={`relative text-sm font-medium transition-colors ${activePath === '/alerts' ? 'text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>
            Alertes
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-3 bg-indigo-500 text-white text-[0.55rem] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          {/* Profile */}
          {/* Analyses restantes (free users) */}
          {user && !analysesInfo.isPremium && analysesInfo.remaining !== null && (
            <Link href="/pricing" title="Passer à Premium pour des analyses illimitées"
              className={`hidden sm:flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors
                ${analysesInfo.remaining === 0
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                  : 'border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-zinc-300'
                }`}>
              <span className="tabular-nums">{analysesInfo.remaining}/5</span>
              <span className="text-[0.6rem] uppercase tracking-wide">analyses</span>
            </Link>
          )}

          {user ? (
            <ProfilPanel
              email={user.email ?? ''}
              watchlistCount={watchlistCount}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Se connecter
              </Link>
              <Link
                href="/login?mode=signup"
                className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Essayer
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
