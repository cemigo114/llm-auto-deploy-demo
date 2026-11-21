// Small render helpers. No sizing math here (docs/04): these only format values
// the service already returned.

export function fmt(n: number | null | undefined, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function fmtThousands(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n >= 10000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${Math.round(n)}`
}

// Aggregated topology summary from a sizing config (ported idea from configiq
// lib/pareto/recipe.ts; agg only for v1).
export function topologyLabel(mode: string, tp: number | null, pp: number | null, replicas: number): string {
  const parts = [`tp${tp ?? '?'}`]
  if (pp && pp > 1) parts.push(`pp${pp}`)
  const shape = parts.join('·')
  return mode === 'disagg' ? `disaggregated · ${shape}` : `${replicas}× ${shape}`
}
