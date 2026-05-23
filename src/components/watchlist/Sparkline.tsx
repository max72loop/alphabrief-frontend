"use client"

import { useId } from "react"
import { C } from "@/components/landing/Gauge"

type Props = {
  data: number[]
  width?: number
  height?: number
  color?: string
  area?: boolean
  showDot?: boolean
}

export function Sparkline({ data, width = 96, height = 28, color, area = true, showDot = true }: Props) {
  const id = useId()
  if (!data || data.length === 0) return <svg width={width} height={height} />

  const safeData = data.length === 1 ? [data[0], data[0]] : data
  const min = Math.min(...safeData)
  const max = Math.max(...safeData)
  const range = (max - min) || 1
  const padY = 3
  const pts = safeData.map((v, i) => {
    const x = (i / (safeData.length - 1)) * (width - 2) + 1
    const y = height - padY - ((v - min) / range) * (height - padY * 2)
    return [x, y] as const
  })
  const path = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const areaPath = `${path} L ${pts[pts.length - 1][0]} ${height} L ${pts[0][0]} ${height} Z`
  const trendUp = safeData[safeData.length - 1] >= safeData[0]
  const c = color || (trendUp ? C.phosphor : C.sanguine)
  const lastPt = pts[pts.length - 1]

  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.28" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={areaPath} fill={`url(#${id})`} />}
      <path d={path} fill="none" stroke={c} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
      {showDot && (
        <g>
          <circle cx={lastPt[0]} cy={lastPt[1]} r={2.6} fill={c} />
          <circle cx={lastPt[0]} cy={lastPt[1]} r={5.5} fill={c} opacity="0.18" />
        </g>
      )}
    </svg>
  )
}
