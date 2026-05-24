'use client'
import { useRouter } from 'next/navigation'

const mono = 'var(--font-jetbrains-mono, monospace)'
const sans = 'var(--font-inter-tight), -apple-system, system-ui, sans-serif'

type TickerOption = { ticker: string; name: string | null }

function optionLabel(t: TickerOption): string {
  return t.name ? `${t.name} (${t.ticker})` : t.ticker
}

export default function CompareSelects({ tickers, a, b }: { tickers: TickerOption[]; a: string; b: string }) {
  const router = useRouter()

  function update(field: 'a' | 'b', val: string) {
    const params = new URLSearchParams()
    if (field === 'a') { params.set('a', val); if (b) params.set('b', b) }
    else { if (a) params.set('a', a); params.set('b', val) }
    router.push(`/compare?${params.toString()}`)
  }

  // Tri alphabétique par nom (fallback ticker) pour rendre la recherche au clavier utile.
  const sorted = [...tickers].sort((x, y) =>
    optionLabel(x).localeCompare(optionLabel(y), 'fr', { sensitivity: 'base' })
  )

  const selectCls = 'bg-[#13201A] border border-[#1A2520] text-[#F0EBDB] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#7EE5A3]/50 min-w-[220px]'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-[0.18em] text-[#6D7A72]" style={{ fontFamily: mono }}>Entreprise A</label>
        <select className={selectCls} value={a} onChange={e => update('a', e.target.value)} style={{ fontFamily: sans }}>
          <option value="">— choisir —</option>
          {sorted.map(t => <option key={t.ticker} value={t.ticker}>{optionLabel(t)}</option>)}
        </select>
      </div>
      <span className="text-[#4A6355] font-bold text-sm mt-4" style={{ fontFamily: mono, letterSpacing: '0.14em' }}>VS</span>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-[0.18em] text-[#6D7A72]" style={{ fontFamily: mono }}>Entreprise B</label>
        <select className={selectCls} value={b} onChange={e => update('b', e.target.value)} style={{ fontFamily: sans }}>
          <option value="">— choisir —</option>
          {sorted.filter(t => t.ticker !== a).map(t => <option key={t.ticker} value={t.ticker}>{optionLabel(t)}</option>)}
        </select>
      </div>
    </div>
  )
}
