'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { C, serif, sans, mono } from '@/components/landing/Gauge'
import type { WatchlistItem } from '@/components/watchlist/types'
import { WatchlistSubnav, type TabKey } from '@/components/watchlist/Subnav'
import { WatchlistMasthead } from '@/components/watchlist/Masthead'
import { WatchlistHero } from '@/components/watchlist/HeroMovers'
import { Constellation } from '@/components/watchlist/Constellation'
import { EditorialTable } from '@/components/watchlist/EditorialTable'
import { SectorMap } from '@/components/watchlist/SectorMap'
import { WatchlistBottomCTA } from '@/components/watchlist/BottomCTA'

export default function WatchlistClient({
  initialItems,
  isPremium,
  todayLabel,
}: {
  initialItems: WatchlistItem[]
  isPremium: boolean
  todayLabel: string
}) {
  const router = useRouter()
  const [items, setItems] = useState<WatchlistItem[]>(initialItems)
  const [tab, setTab] = useState<TabKey>('all')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => { setItems(initialItems) }, [initialItems])

  const add = async (ticker: string): Promise<boolean> => {
    if (!ticker || items.some(i => i.ticker === ticker)) {
      setError(ticker ? 'Ce titre est déjà dans votre watchlist.' : '')
      return false
    }
    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      })
      if (!res.ok) {
        setError("Impossible d'ajouter ce titre — vérifiez le ticker et réessayez.")
        return false
      }
      router.refresh()
      return true
    } catch {
      setError('Erreur réseau. Réessayez.')
      return false
    } finally {
      setAdding(false)
    }
  }

  const remove = async (ticker: string) => {
    setRemoving(ticker)
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      })
      if (res.ok) {
        setItems(prev => prev.filter(i => i.ticker !== ticker))
        router.refresh()
      }
    } finally {
      setRemoving(null)
    }
  }

  const filtered = useMemo(() => {
    switch (tab) {
      case 'movers': return items.filter(t => Math.abs(t.score - t.prev) >= 3)
      case 'alerts': return items.filter(t => t.alert)
      case 'strong': return items.filter(t => t.score >= 70)
      case 'weak':   return items.filter(t => t.score < 50)
      default:       return items
    }
  }, [items, tab])

  if (initialItems.length === 0) {
    return (
      <main style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 40px 60px' }}>
        <WatchlistSubnav
          items={items}
          active={tab}
          onChange={setTab}
          onAdd={add}
          adding={adding}
          errorMessage={error}
          todayLabel={todayLabel}
        />
        <section style={{ padding: '60px 0 0' }}>
          <div style={{
            borderTop: `2px solid ${C.ink}`, borderBottom: `1px solid ${C.rule}`,
            padding: '26px 0 32px',
          }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.phosphor, letterSpacing: '0.22em', marginBottom: 18 }}>
              § L&apos;ALMANACH DES SUIVIS
            </div>
            <h1 style={{ fontFamily: serif, fontSize: 64, fontWeight: 500, lineHeight: 0.95, letterSpacing: '-0.035em', color: C.ink, margin: 0 }}>
              Votre <span style={{ fontStyle: 'italic', color: C.phosphor }}>watchlist</span> est vide.
            </h1>
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 19, color: C.inkDim, marginTop: 22, marginBottom: 0, maxWidth: 580, fontWeight: 500 }}>
              Ajoutez votre premier ticker pour faire apparaître l&apos;almanach — masthead, mouvements, constellation et secteurs se composent à partir de vos titres.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
              {['AAPL', 'NVDA', 'MSFT', 'MC.PA'].map(sym => (
                <button
                  key={sym}
                  onClick={() => add(sym)}
                  disabled={adding}
                  style={{
                    padding: '8px 14px', background: C.bgCard, border: `1px solid ${C.rule}`,
                    borderRadius: 8, color: C.inkDim, fontFamily: mono, fontSize: 12,
                    letterSpacing: '0.06em', cursor: adding ? 'wait' : 'pointer',
                  }}
                >
                  + {sym}
                </button>
              ))}
              <Link
                href="/dashboard"
                style={{
                  padding: '8px 14px', background: C.phosphor, color: C.bg,
                  fontFamily: sans, fontSize: 13, fontWeight: 600, borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                Parcourir le screener →
              </Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const suggestionA = items.find(i => i.score >= 70)?.ticker || items[0]?.ticker
  const suggestionB = items.find(i => i.score < 50)?.ticker || items[items.length - 1]?.ticker

  return (
    <>
      <WatchlistSubnav
        items={items}
        active={tab}
        onChange={setTab}
        onAdd={add}
        adding={adding}
        errorMessage={error}
        todayLabel={todayLabel}
      />
      <WatchlistMasthead items={filtered} />
      <WatchlistHero items={filtered} />
      <Constellation items={filtered} />
      <EditorialTable items={filtered} onRemove={remove} removing={removing} />
      <SectorMap items={filtered} />
      <WatchlistBottomCTA
        count={items.length}
        isPremium={isPremium}
        suggestionA={suggestionA}
        suggestionB={suggestionB}
      />
    </>
  )
}
