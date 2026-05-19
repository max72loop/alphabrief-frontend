'use client'
import { useRouter } from 'next/navigation'

const mono = 'var(--font-jetbrains-mono, monospace)'

export default function CompareSelects({ tickers, a, b }: { tickers: string[]; a: string; b: string }) {
  const router = useRouter()

  function update(field: 'a' | 'b', val: string) {
    const params = new URLSearchParams()
    if (field === 'a') { params.set('a', val); if (b) params.set('b', b) }
    else { if (a) params.set('a', a); params.set('b', val) }
    router.push(`/compare?${params.toString()}`)
  }

  const selectCls = 'bg-[#13201A] border border-[#1A2520] text-[#F0EBDB] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#7EE5A3]/50 min-w-[160px]'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-[0.18em] text-[#6D7A72]" style={{ fontFamily: mono }}>Ticker A</label>
        <select className={selectCls} value={a} onChange={e => update('a', e.target.value)} style={{ fontFamily: mono }}>
          <option value="">— choisir —</option>
          {tickers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <span className="text-[#4A6355] font-bold text-sm mt-4" style={{ fontFamily: mono, letterSpacing: '0.14em' }}>VS</span>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-[0.18em] text-[#6D7A72]" style={{ fontFamily: mono }}>Ticker B</label>
        <select className={selectCls} value={b} onChange={e => update('b', e.target.value)} style={{ fontFamily: mono }}>
          <option value="">— choisir —</option>
          {tickers.filter(t => t !== a).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  )
}
