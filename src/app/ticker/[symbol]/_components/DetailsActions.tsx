'use client'

import { useEffect, useState } from 'react'
import { C, mono } from '@/components/landing/Gauge'

type Props = {
  ticker: string
  companyName: string | null
  shareUrl?: string
}

const buttonStyle = (active = false): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 12px',
  border: `1px solid ${active ? C.phosphor + '60' : C.rule}`,
  borderRadius: 6,
  background: active ? `${C.phosphor}10` : 'transparent',
  color: active ? C.phosphor : C.inkDim,
  fontFamily: mono,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.14em',
  cursor: 'pointer',
  transition: 'border 0.15s, background 0.15s, color 0.15s',
})

export default function ShareButton({ ticker, companyName, shareUrl }: Props) {
  const [copied, setCopied] = useState(false)

  const onShare = async () => {
    const url = shareUrl ?? (typeof window !== 'undefined' ? window.location.href : '')
    const title = companyName ? `${ticker} · ${companyName} — AlphaBrief` : `${ticker} — AlphaBrief`
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await (navigator as Navigator & { share: (data: { title: string; url: string }) => Promise<void> }).share({ title, url })
        return
      }
    } catch { /* fall through to clipboard */ }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* noop */ }
  }

  return (
    <button type="button" onClick={onShare} style={buttonStyle(copied)} aria-label="Partager">
      <span style={{ fontSize: 12 }}>↗</span>
      {copied ? 'COPIÉ' : 'PARTAGER'}
    </button>
  )
}

export function AlertButton({ ticker }: { ticker: string }) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('alphabrief.alerts')
      if (!raw) return
      const list = JSON.parse(raw) as string[]
      setArmed(list.includes(ticker))
    } catch { /* noop */ }
  }, [ticker])

  const toggle = () => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('alphabrief.alerts')
      const list: string[] = raw ? JSON.parse(raw) : []
      const next = armed ? list.filter(t => t !== ticker) : Array.from(new Set([...list, ticker]))
      window.localStorage.setItem('alphabrief.alerts', JSON.stringify(next))
      setArmed(!armed)
    } catch { /* noop */ }
  }

  return (
    <button type="button" onClick={toggle} style={buttonStyle(armed)} aria-pressed={armed} aria-label="Activer une alerte">
      <span style={{ fontSize: 12 }}>{armed ? '◉' : '⚠'}</span>
      {armed ? 'ALERTE ON' : 'ALERTE'}
    </button>
  )
}
