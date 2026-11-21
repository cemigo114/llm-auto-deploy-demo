// Fixtures layer (A0). Serves recorded AISimulators responses with their real
// shapes from /public/fixtures. No live gateway call, no synthesized data.
import type {
  Manifest, ModelEntry, RecommendResponse, LoadUnit, SizingConfig,
} from '../types'

const base = import.meta.env.BASE_URL || '/'
const url = (f: string) => `${base}fixtures/${f}`

let _manifest: Manifest | null = null

export async function loadManifest(): Promise<Manifest> {
  if (_manifest) return _manifest
  const r = await fetch(url('manifest.json'))
  if (!r.ok) throw new Error(`manifest.json ${r.status}`)
  _manifest = (await r.json()) as Manifest
  return _manifest
}

export async function listModels(): Promise<ModelEntry[]> {
  return (await loadManifest()).models
}

function entryOf(m: Manifest, key: string): ModelEntry {
  const e = m.models.find((x) => x.key === key)
  if (!e) throw new Error(`unknown model ${key}`)
  return e
}

async function fetchJson<T>(f: string): Promise<T> {
  const r = await fetch(url(f))
  if (!r.ok) throw new Error(`${f} ${r.status}`)
  return (await r.json()) as T
}

export interface AnswerResult {
  /** configs[0] = the pick, or null when the response has no configs. */
  config: SizingConfig | null
  response: RecommendResponse
  /** The load value the user asked for vs the value the matched fixture was captured at. */
  requested: number
  served: number
}

/**
 * The answer call (docs/07 decision): users -> concurrency_capacity,
 * rps -> throughput_demand, both sla_mode=none. Picks the captured fixture
 * nearest the requested load value.
 */
export async function getAnswer(key: string, unit: LoadUnit, value: number): Promise<AnswerResult> {
  const m = await loadManifest()
  const opts = entryOf(m, key).answers[unit]
  if (!opts || opts.length === 0) throw new Error(`no ${unit} answers for ${key}`)
  const pick = opts.reduce((a, b) => (Math.abs(b.value - value) < Math.abs(a.value - value) ? b : a))
  const response = await fetchJson<RecommendResponse>(pick.file)
  return { config: response.configs?.[0] ?? null, response, requested: value, served: pick.value }
}

/** The evidence frontier (pareto). May have an empty pareto_front. */
export async function getFrontier(key: string): Promise<RecommendResponse | null> {
  const m = await loadManifest()
  const e = entryOf(m, key)
  return e.frontier ? fetchJson<RecommendResponse>(e.frontier) : null
}

/** The pre-rendered LLMInferenceService (B1), or null when no recipe exists. */
export async function getCR(key: string): Promise<string | null> {
  const m = await loadManifest()
  const e = entryOf(m, key)
  if (!e.cr) return null
  const r = await fetch(url(e.cr))
  return r.ok ? r.text() : null
}
