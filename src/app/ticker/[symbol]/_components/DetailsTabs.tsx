'use client'

import { useEffect, useState } from 'react'
import { C, sans } from '@/components/landing/Gauge'

type Tab = { id: string; label: string }

const TABS: Tab[] = [
  { id: 'overview',     label: "Vue d'ensemble" },
  { id: 'fundamentals', label: 'Fondamentaux' },
  { id: 'technicals',   label: 'Technique' },
  { id: 'momentum',     label: 'Momentum' },
  { id: 'history',      label: 'Historique' },
  { id: 'peers',        label: 'Pairs' },
]

export default function DetailsTabs() {
  const [active, setActive] = useState<string>('overview')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sections = TABS
      .map(t => document.getElementById(t.id))
      .filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    sections.forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ flex: 1, display: 'flex', gap: 4, marginLeft: 20 }}>
      {TABS.map(t => {
        const isActive = active === t.id
        return (
          <a
            key={t.id}
            href={`#${t.id}`}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: isActive ? C.ink : C.muteDeep,
              textDecoration: 'none',
              fontFamily: sans,
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              borderBottom: `2px solid ${isActive ? C.phosphor : 'transparent'}`,
              marginBottom: -1,
              transition: 'color 0.15s, border-color 0.15s, font-weight 0.15s',
            }}
          >
            {t.label}
          </a>
        )
      })}
    </div>
  )
}
