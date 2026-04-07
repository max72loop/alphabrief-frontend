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
    <div className="flex items-center justify-between py-4 border-b border-white/[0.06]">
      <div>
        <p className="text-sm font-medium text-white">Digest hebdomadaire</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          Reçois chaque lundi le top 10 du screener + ton suivi par email.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-6">
        {status === 'saved' && <span className="text-xs text-emerald-400">Enregistré</span>}
        {status === 'error' && <span className="text-xs text-rose-400">Erreur</span>}
        <button
          onClick={toggle}
          disabled={loading}
          className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? 'bg-indigo-600' : 'bg-white/[0.1]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
