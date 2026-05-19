import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProfilPanel from './ProfilPanel'
import NavSearchBox from './NavSearchBox'
import { FREE_DAILY_QUOTA } from '@/lib/quota'

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
      .select('plan, analyses_today, last_analysis_date')
      .eq('id', userId)
      .maybeSingle()
    if (!data) return { isPremium: false, remaining: FREE_DAILY_QUOTA }
    if ((data.plan ?? '').toLowerCase() === 'premium') return { isPremium: true, remaining: null }
    const today = new Date().toISOString().slice(0, 10)
    const usedToday = data.last_analysis_date === today ? (data.analyses_today ?? 0) : 0
    return { isPremium: false, remaining: Math.max(0, FREE_DAILY_QUOTA - usedToday) }
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
          active ? 'text-[#F0EBDB]' : 'text-[#4A6355] hover:text-[#F0EBDB]'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <>
      <nav className="flex items-center px-6 h-14 border-b border-[#1A2520] bg-[#0A0F0C]/95 backdrop-blur-md sticky top-0 z-40">
        {/* Brand */}
        <Link href="/dashboard" className="tracking-tight mr-6 shrink-0 select-none">
          <span
            className="text-xl text-[#7EE5A3]"
            style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", fontWeight: 500 }}
          >α</span>
          <span className="text-lg font-bold text-[#F0EBDB]">lpha</span>
          <span className="text-lg font-medium text-[#F0EBDB]">Brief</span>
        </Link>

        {/* Cmd+K search */}
        {user && <NavSearchBox />}

        {/* Nav principale — primary (visible) + secondary (outils) */}
        <div className="flex items-center gap-5 ml-6 flex-1 min-w-0">
          {/* Primary */}
          {navLink('/dashboard', 'Édition', ['/dashboard', '/ticker'])}
          {navLink('/watchlist', 'Watchlist')}
          {navLink('/historique', 'Historique')}
          <Link
            href="/alerts"
            className={`relative text-sm font-medium transition-colors ${
              activePath === '/alerts' ? 'text-[#F0EBDB]' : 'text-[#4A6355] hover:text-[#F0EBDB]'
            }`}
          >
            Alertes
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-3 bg-[#7EE5A3] text-[#0A0F0C] text-[0.55rem] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          {/* Séparateur + outils secondaires (cachés < lg pour respecter la respiration mobile) */}
          <span className="hidden lg:inline-block w-px h-4 bg-[#1A2520] mx-2" aria-hidden="true" />
          <div className="hidden lg:flex items-center gap-5">
            {navLink('/compare',   'Comparer')}
            {navLink('/portfolio', 'Portfolio')}
            {navLink('/marche',    'Marché')}
            {navLink('/methode',   'Méthode')}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          {/* Profile */}
          {/* Analyses restantes (free users) */}
          {user && !analysesInfo.isPremium && analysesInfo.remaining !== null && (
            <Link href="/pricing" title="Passer à Premium pour des analyses illimitées"
              className={`hidden sm:flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors
                ${analysesInfo.remaining === 0
                  ? 'border-[#E5A04E]/40 bg-[#E5A04E]/10 text-[#E5A04E] hover:bg-[#E5A04E]/20'
                  : 'border-[#1A2520] bg-[#0F1A13] text-[#4A6355] hover:text-[#F0EBDB]'
                }`}>
              <span className="tabular-nums">{analysesInfo.remaining}/{FREE_DAILY_QUOTA}</span>
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
              <Link href="/login" className="text-sm text-[#4A6355] hover:text-[#F0EBDB] transition-colors">
                Se connecter
              </Link>
              <Link
                href="/login?mode=signup"
                className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-[#7EE5A3] hover:bg-[#9AEDB5] text-[#0A0F0C] transition-colors"
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
