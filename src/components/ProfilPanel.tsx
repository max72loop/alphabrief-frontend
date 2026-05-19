'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const mono = 'var(--font-jetbrains-mono, monospace)'
const serif = 'var(--font-fraunces, serif)'

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
        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7EE5A3] to-[#5AB983] flex items-center justify-center text-[#0A0F0C] text-xs font-bold shrink-0 hover:opacity-85 transition-opacity"
        style={{ fontFamily: serif }}
        aria-label="Ouvrir le profil"
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
      <aside className={`fixed top-0 right-0 bottom-0 w-[min(380px,100vw)] bg-[#0A0F0C] border-l border-[#1A2520] z-50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2520]">
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3]" style={{ fontFamily: mono }}>
            § PROFIL
          </span>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-lg bg-[#13201A] text-[#6D7A72] hover:text-[#F0EBDB] hover:bg-[#1A2520] flex items-center justify-center transition-colors text-base"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7EE5A3] to-[#5AB983] flex items-center justify-center text-[#0A0F0C] text-lg font-bold shrink-0"
              style={{ fontFamily: serif }}>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-[#F0EBDB] truncate">{email || 'Utilisateur'}</div>
              <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-[#6D7A72] bg-[#13201A] border border-[#1A2520] px-2 py-0.5 rounded-full"
                style={{ fontFamily: mono }}>
                Plan Gratuit
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: watchlistCount, label: 'SUIVI' },
              { val: 5, label: 'ANALYSES/J' },
              { val: '0€', label: 'PLAN' },
            ].map(s => (
              <div key={s.label} className="bg-[#0E1511] border border-[#1A2520] rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-[#F0EBDB] tabular-nums" style={{ fontFamily: mono }}>
                  {s.val}
                </div>
                <div className="text-[10px] text-[#6D7A72] uppercase tracking-[0.14em] mt-0.5" style={{ fontFamily: mono }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Upgrade */}
          <div className="rounded-xl bg-[#7EE5A3]/[0.06] border border-[#7EE5A3]/30 p-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3] font-bold mb-2" style={{ fontFamily: mono }}>
              Passer Premium
            </div>
            <div className="text-sm text-[#C6C0A9] leading-relaxed mb-3"
              style={{ fontFamily: serif, fontStyle: 'italic' }}>
              Analyses illimitées, alertes, historique du score et export PDF.
            </div>
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="inline-block text-xs font-bold text-[#0A0F0C] bg-[#7EE5A3] hover:bg-[#9AEDB5] px-4 py-1.5 rounded-lg transition-colors"
            >
              Voir les offres →
            </Link>
          </div>

          {/* Links */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#4A6355] mb-2" style={{ fontFamily: mono }}>
              Compte
            </div>
            <div className="flex flex-col gap-1">
              {[
                { href: '/dashboard',  label: 'Édition du jour' },
                { href: '/watchlist',  label: 'Ma watchlist' },
                { href: '/portfolio',  label: 'Mon portefeuille' },
                { href: '/alerts',     label: 'Mes alertes' },
                { href: '/settings',   label: 'Paramètres' },
              ].map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0E1511] border border-[#1A2520] text-sm text-[#C6C0A9] hover:text-[#F0EBDB] hover:border-[#7EE5A3]/30 transition-colors"
                >
                  <span>{l.label}</span><span className="text-[#6D7A72]">→</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#4A6355] mb-2" style={{ fontFamily: mono }}>
              Outils
            </div>
            <div className="flex flex-col gap-1">
              {[
                { href: '/methode',    label: 'Méthodologie du score' },
                { href: '/compare',    label: 'Comparer deux titres' },
                { href: '/marche',     label: 'Marché global' },
                { href: '/historique', label: 'Archives éditions' },
              ].map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0E1511] border border-[#1A2520] text-sm text-[#C6C0A9] hover:text-[#F0EBDB] hover:border-[#7EE5A3]/30 transition-colors"
                >
                  <span>{l.label}</span><span className="text-[#6D7A72]">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full py-2.5 rounded-lg border border-[#1A2520] text-sm text-[#6D7A72] hover:text-[#D85F66] hover:border-[#D85F66]/30 transition-colors"
          >
            Se déconnecter
          </button>

          {/* Disclaimer */}
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#4A6355] text-center leading-relaxed"
            style={{ fontFamily: mono }}>
            OUTIL D&apos;ANALYSE QUANTITATIVE · NE CONSTITUE PAS UN CONSEIL EN INVESTISSEMENT
          </p>
        </div>
      </aside>
    </>
  )
}
