'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CompareSelects({ tickers, a, b }: { tickers: string[]; a: string; b: string }) {
  const router = useRouter()

  function update(field: 'a' | 'b', val: string) {
    const params = new URLSearchParams()
    if (field === 'a') { params.set('a', val); if (b) params.set('b', b) }
    else { if (a) params.set('a', a); params.set('b', val) }
    router.push(`/compare?${params.toString()}`)
  }

  const selectCls = 'bg-[#13131f] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500/50 min-w-[160px]'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-500">Ticker A</label>
        <select className={selectCls} value={a} onChange={e => update('a', e.target.value)}>
          <option value="">— choisir —</option>
          {tickers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <span className="text-zinc-600 font-bold text-sm mt-4">VS</span>
      <div className="flex flex-col gap-1">
        <label className="text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-500">Ticker B</label>
        <select className={selectCls} value={b} onChange={e => update('b', e.target.value)}>
          <option value="">— choisir —</option>
          {tickers.filter(t => t !== a).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  )
}
