'use client'
import { useState } from 'react'

export default function DigestToggle({ initialValue }: { initialValue: boolean }) {
  const [enabled, setEnabled] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  const toggle = async () => {
    setLoading(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekly_digest: !enabled }),
      })
      if (res.ok) {
        setEnabled(prev => !prev)
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 2000)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#F0EBDB]">Digest hebdomadaire</p>
        <p className="text-xs text-[#6D7A72] mt-0.5 leading-relaxed">
          Reçois chaque lundi le top 10 du screener + ton suivi par email.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-6">
        {status === 'saved' && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#7EE5A3]"
            style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
            Enregistré
          </span>
        )}
        {status === 'error' && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#D85F66]"
            style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
            Erreur
          </span>
        )}
        <button
          onClick={toggle}
          disabled={loading}
          aria-pressed={enabled}
          className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? 'bg-[#7EE5A3]' : 'bg-[#1A2520]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform ${
              enabled ? 'bg-[#0A0F0C] translate-x-5' : 'bg-[#F0EBDB] translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
