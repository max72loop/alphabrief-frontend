export type WatchlistItem = {
  ticker: string
  name: string
  score: number
  prev: number
  hist: number[]
  chg: string
  price: string
  sector: string
  fund: number
  tech: number
  mom: number
  alert: boolean
  note: string
  added: string
}

export function tone(s: number): string {
  if (s >= 75) return "#7EE5A3"
  if (s >= 60) return "#5AB983"
  if (s >= 45) return "#E5A04E"
  if (s >= 30) return "#E58A4E"
  return "#D85F66"
}

export function band(s: number): string {
  if (s >= 75) return "EXCELLENT"
  if (s >= 60) return "BON"
  if (s >= 45) return "NEUTRE"
  if (s >= 30) return "ATTENTION"
  return "RISQUÉ"
}
