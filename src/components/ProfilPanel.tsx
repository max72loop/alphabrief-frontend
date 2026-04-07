'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfilPanel({
  email,
  watchlistCount,
}: {
  email: string
  watchlistCount: number
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const initials = email ? email[0].toUpperCase() : 'U'

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const logout = async () => {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 hover:opacity-85 transition-opacity"
      >
        {initials}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <aside className={`fixed top-0 right-0 bottom-0 w-[min(380px,100vw)] bg-[#0d0d1a] border-l border-white/[0.08] z-50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <span className="font-bold text-sm">Mon Profil</span>
          <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.12] flex items-center justify-center transition-colors text-base">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
              {initials}
            </div>
            <div>
              <div className="font-bold text-sm">{email || 'Utilisateur'}</div>
              <span className="mt-1 inline-block text-[0.6rem] font-semibold uppercase tracking-widest text-zinc-500 bg-white/[0.06] border border-white/[0.1] px-2 py-0.5 rounded-full">Plan Gratuit</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: watchlistCount, label: 'Watchlist' },
              { val: 5, label: 'Analyses/jour' },
              { val: '0€', label: 'Plan actuel' },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold">{s.val}</div>
                <div className="text-[0.6rem] text-zinc-500 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Upgrade */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-600/10 border border-indigo-500/30 p-4">
            <div className="text-sm font-bold text-indigo-400 mb-1">Passer Premium</div>
            <div className="text-xs text-zinc-400 leading-relaxed mb-3">Analyses illimitées, alertes, historique des scores et export PDF.</div>
            <Link href="/pricing" onClick={() => setOpen(false)} className="inline-block text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-lg transition-colors">
              Voir les offres →
            </Link>
          </div>

          {/* Links */}
          <div>
            <div className="text-[0.6rem] font-bold uppercase tracking-widest text-zinc-600 mb-2">Compte</div>
            <div className="flex flex-col gap-1">
              {[
                { href: '/watchlist', label: 'Ma Watchlist' },
                { href: '/portfolio', label: 'Mon Portfolio' },
                { href: '/alerts', label: 'Mes Alertes' },
              ].map(l => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-colors">
                  <span>{l.label}</span><span>→</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[0.6rem] font-bold uppercase tracking-widest text-zinc-600 mb-2">Outils</div>
            <div className="flex flex-col gap-1">
              {[
                { href: '/methode', label: 'Comment fonctionne le score' },
              ].map(l => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-colors">
                  <span>{l.label}</span><span>→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Logout */}
          <button onClick={logout} className="w-full py-2.5 rounded-lg border border-white/[0.08] text-sm text-zinc-500 hover:text-rose-400 hover:border-rose-500/30 transition-colors">
            Se déconnecter
          </button>

          {/* Disclaimer */}
          <p className="text-[0.6rem] text-zinc-700 text-center leading-relaxed">
            Outil d&apos;analyse quantitative — pas un conseil en investissement au sens MIF II. AlphaBrief n&apos;est pas enregistré auprès de l&apos;AMF.
          </p>
        </div>
      </aside>
    </>
  )
}
