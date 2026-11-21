// Shapes mirror the AISimulators /recommend response, verbatim from the captured
// fixtures (docs/03, docs/05). The browser renders these; it never synthesizes
// topology or performance (configiq rule, docs/04).

export type CandidateStatus =
  | 'feasible' | 'infeasible' | 'unsupported'
  | 'timed_out' | 'failed' | 'resource_limited'

/** One ranked entry in `configs` (min_gpus / concurrency_capacity / throughput_demand). */
export interface SizingConfig {
  total_gpus_needed: number
  replicas_needed: number
  num_total_gpus: number
  mode: 'agg' | 'disagg'
  tp: number | null
  pp: number | null
  dp: number | null
  bs: number | null
  ttft: number | null
  tpot: number | null
  request_latency: number | null
  concurrency: number | null
  request_rate: number | null
  tokens_per_second: number | null
  tokens_per_second_per_gpu: number | null
  tokens_per_second_per_user: number | null
  backend_version: string | null
  model: string
  system: string
  simulator: string
  serving_config: unknown | null
  provenance: unknown | null
}

export interface CandidateObjectives {
  throughput_per_user: number
  throughput_per_gpu: number
  [k: string]: number
}

export interface Candidate {
  candidate_id: string
  status: CandidateStatus
  reason_category: string | null
  mode: 'agg' | 'disagg'
  topology: Record<string, unknown>
  used_gpus: number | null
  metrics: Record<string, number | null>
  objectives: CandidateObjectives | null
  transfer_delay_modeled: boolean
  provenance_sources: string[]
  simulator: string
}

export interface Sweep {
  run_id: string
  algorithm: string
  evaluated: number | null
  feasible: number | null
  timed_out: number | null
  budget_exhausted: boolean
  strict_sla: boolean | null
  window_min_gpus: number | null
  window_max_gpus: number | null
  modes_searched: ('agg' | 'disagg')[] | null
}

export interface RecommendResponse {
  simulator: string
  chosen_mode: string | null
  configs: SizingConfig[]
  candidates: Candidate[]
  views: { pareto_front: string[]; top_n: string[] } | null
  sweep: Sweep | null
}

export type LoadUnit = 'users' | 'rps'

export interface AnswerFixture {
  value: number
  file: string
}

export interface ModelEntry {
  key: string
  label: string
  system: string
  /** Sweep model id; may differ from the recipe's deployed (quantized) id — docs/05 A0. */
  sweepModelId: string
  answers: Record<LoadUnit, AnswerFixture[]>
  frontier: string | null
  cr: string | null
}

export interface Manifest {
  models: ModelEntry[]
}
