'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WatchlistButton({
  ticker,
  initialInWatchlist,
  size = 'sm',
}: {
  ticker: string
  initialInWatchlist: boolean
  size?: 'sm' | 'lg'
}) {
  const router = useRouter()
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist)
  const [loading, setLoading] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      const method = inWatchlist ? 'DELETE' : 'POST'
      const res = await fetch('/api/watchlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      })
      if (res.ok) {
        const body = await res.json().catch(() => ({} as { action?: string }))
        // On se fie à l'action renvoyée pour éviter toute désynchro.
        if (body.action === 'added' || body.action === 'already_present') {
          setInWatchlist(true)
        } else if (body.action === 'removed' || body.action === 'not_present') {
          setInWatchlist(false)
        } else {
          setInWatchlist(prev => !prev)
        }
        // Rafraîchit la nav (compteur watchlist) et toute liste server-rendered.
        router.refresh()
      } else {
        const body = await res.json().catch(() => ({} as { error?: string }))
        // Pas de système de toast pour le moment — on log pour ne rien masquer.
        console.error('Watchlist toggle failed:', body.error || res.status)
      }
    } catch (err) {
      console.error('Watchlist toggle network error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={inWatchlist ? 'Retirer du suivi' : 'Ajouter au suivi'}
      className={`leading-none transition-colors disabled:opacity-40 ${
        size === 'lg' ? 'text-2xl' : 'text-base'
      } ${
        inWatchlist
          ? 'text-amber-400 hover:text-amber-300'
          : 'text-zinc-600 hover:text-zinc-300'
      }`}
    >
      {inWatchlist ? '★' : '☆'}
    </button>
  )
}
