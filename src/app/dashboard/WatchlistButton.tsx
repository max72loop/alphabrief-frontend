'use client'
import { useState } from 'react'

export default function WatchlistButton({
  ticker,
  initialInWatchlist,
  size = 'sm',
}: {
  ticker: string
  initialInWatchlist: boolean
  size?: 'sm' | 'lg'
}) {
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist)
  const [loading, setLoading] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      })
      if (res.ok) setInWatchlist(prev => !prev)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={inWatchlist ? 'Retirer de la watchlist' : 'Ajouter à la watchlist'}
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
