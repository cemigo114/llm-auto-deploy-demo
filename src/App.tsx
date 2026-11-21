import { useEffect, useMemo, useState } from 'react'
import {
  Bullseye, Button, Card, CardBody, CardTitle, Content, DescriptionList,
  DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, Divider,
  ExpandableSection, Flex, FlexItem, Form, FormGroup, FormSelect, FormSelectOption,
  Grid, GridItem, Label, Page, PageSection, Spinner, TextInput, Title,
  ToggleGroup, ToggleGroupItem,
} from '@patternfly/react-core'
import { getAnswer, listModels, type AnswerResult } from './fixtures/loader'
import type { LoadUnit, ModelEntry } from './types'
import { fmt, fmtThousands, topologyLabel } from './format'

// Phase A1: the answer-first page, on fixtures (docs/07 section 4). The answer
// comes from configs[0] of a concurrency_capacity / throughput_demand response;
// the latency SLA is shown as pass/warn, not enforced (A0 decision).

export function App() {
  const [models, setModels] = useState<ModelEntry[] | null>(null)
  const [modelKey, setModelKey] = useState('')
  const [unit, setUnit] = useState<LoadUnit>('users')
  const [load, setLoad] = useState('64')
  const [ttftTarget, setTtftTarget] = useState('400')
  const [tpotTarget, setTpotTarget] = useState('30')
  const [gpusFree, setGpusFree] = useState('8')
  const [answer, setAnswer] = useState<AnswerResult | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(key: string, u: LoadUnit, value: number) {
    setBusy(true); setErr(null)
    try {
      setAnswer(await getAnswer(key, u, value))
    } catch (e) {
      setAnswer(null); setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  // First load runs with defaults (docs/07 4.1).
  useEffect(() => {
    void (async () => {
      const ms = await listModels()
      setModels(ms)
      setModelKey(ms[0].key)
      await run(ms[0].key, 'users', 64)
    })()
  }, [])

  if (!models) return <Bullseye><Spinner aria-label="Loading" /></Bullseye>

  return (
    <Page>
      <PageSection>
        <Title headingLevel="h1" size="2xl">Size and deploy a model</Title>
        <Content component="p" style={{ color: '#3c3f42', marginTop: 4 }}>
          Pick a model and your load. The recommendation and the efficiency trade-off come from an
          AISimulate sweep.
        </Content>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem lg={4} md={5}>
            <Inputs
              models={models} modelKey={modelKey} unit={unit} load={load}
              ttft={ttftTarget} tpot={tpotTarget} gpusFree={gpusFree}
              onModel={setModelKey} onUnit={setUnit} onLoad={setLoad}
              onTtft={setTtftTarget} onTpot={setTpotTarget} onGpusFree={setGpusFree}
              onRun={() => run(modelKey, unit, Number(load) || 0)} busy={busy}
            />
          </GridItem>
          <GridItem lg={8} md={7}>
            {err && <Card><CardBody style={{ color: '#a30000' }}>Could not load the recommendation: {err}</CardBody></Card>}
            {!err && (
              <Answer
                answer={answer} unit={unit}
                ttftTarget={Number(ttftTarget)} tpotTarget={Number(tpotTarget)}
                gpusFree={Number(gpusFree)}
                hasRecipe={!!models.find((m) => m.key === modelKey)?.cr}
              />
            )}
          </GridItem>
        </Grid>
      </PageSection>
    </Page>
  )
}

function Inputs(p: {
  models: ModelEntry[]; modelKey: string; unit: LoadUnit; load: string
  ttft: string; tpot: string; gpusFree: string; busy: boolean
  onModel: (v: string) => void; onUnit: (v: LoadUnit) => void; onLoad: (v: string) => void
  onTtft: (v: string) => void; onTpot: (v: string) => void; onGpusFree: (v: string) => void
  onRun: () => void
}) {
  return (
    <Card>
      <CardTitle>Your workload</CardTitle>
      <CardBody>
        <Form>
          <FormGroup label="Model" fieldId="model">
            <FormSelect id="model" value={p.modelKey} onChange={(_e, v) => p.onModel(v)} aria-label="Model">
              {p.models.map((m) => <FormSelectOption key={m.key} value={m.key} label={m.label} />)}
            </FormSelect>
          </FormGroup>
          <FormGroup label="Workload shape" fieldId="shape">
            <FormSelect id="shape" value="chat" aria-label="Workload shape" onChange={() => {}}>
              <FormSelectOption value="chat" label="Chat (1k in / 1k out)" />
            </FormSelect>
          </FormGroup>
          <FormGroup label="Load" fieldId="load">
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <ToggleGroup aria-label="Load unit">
                  <ToggleGroupItem text="Concurrent users" isSelected={p.unit === 'users'} onChange={() => p.onUnit('users')} />
                  <ToggleGroupItem text="Requests/sec" isSelected={p.unit === 'rps'} onChange={() => p.onUnit('rps')} />
                </ToggleGroup>
              </FlexItem>
              <FlexItem>
                <TextInput id="load" type="number" value={p.load} onChange={(_e, v) => p.onLoad(v)} aria-label="Load value" style={{ width: 110 }} />
              </FlexItem>
            </Flex>
          </FormGroup>
          <Grid hasGutter>
            <GridItem span={6}>
              <FormGroup label="Mean TTFT target (ms)" fieldId="ttft">
                <TextInput id="ttft" type="number" value={p.ttft} onChange={(_e, v) => p.onTtft(v)} aria-label="Mean TTFT target" />
              </FormGroup>
            </GridItem>
            <GridItem span={6}>
              <FormGroup label="Mean TPOT target (ms)" fieldId="tpot">
                <TextInput id="tpot" type="number" value={p.tpot} onChange={(_e, v) => p.onTpot(v)} aria-label="Mean TPOT target" />
              </FormGroup>
            </GridItem>
          </Grid>
          <FormGroup label="GPUs free in your cluster" fieldId="free">
            <TextInput id="free" type="number" value={p.gpusFree} onChange={(_e, v) => p.onGpusFree(v)} aria-label="GPUs free" />
          </FormGroup>
          <Button variant="primary" onClick={p.onRun} isLoading={p.busy} isDisabled={p.busy}>Recommend</Button>
        </Form>
      </CardBody>
    </Card>
  )
}

function PassWarn({ label, predicted, target, unitLabel }: { label: string; predicted: number | null; target: number; unitLabel: string }) {
  if (predicted == null) return <Label color="grey">{label}: —</Label>
  const ok = predicted <= target
  return (
    <Label color={ok ? 'green' : 'orange'}>
      {label} {fmt(predicted)} {unitLabel} {ok ? '(meets' : '(over'} {fmt(target)})
    </Label>
  )
}

function Answer({ answer, unit, ttftTarget, tpotTarget, gpusFree, hasRecipe }: {
  answer: AnswerResult | null; unit: LoadUnit; ttftTarget: number; tpotTarget: number
  gpusFree: number; hasRecipe: boolean
}) {
  const [open, setOpen] = useState(false)
  const config = answer?.config ?? null
  const servedNote = useMemo(() => {
    if (!answer) return null
    return answer.requested !== answer.served
      ? `Nearest recorded result is ${answer.served} ${unit === 'users' ? 'users' : 'req/sec'}.`
      : null
  }, [answer, unit])

  if (!config) {
    return (
      <Card>
        <CardTitle>Not supported</CardTitle>
        <CardBody style={{ color: '#3c3f42' }}>The simulator returned no configuration for this model and GPU.</CardBody>
      </Card>
    )
  }

  const needed = config.total_gpus_needed
  const fits = needed <= gpusFree
  const runId = answer?.response.sweep?.run_id

  return (
    <Card>
      <CardTitle>{fits ? 'This deployment fits your cluster.' : 'Needs more GPUs than this cluster has free.'}</CardTitle>
      <CardBody>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsLg' }}>
          <FlexItem>
            <div style={{ fontSize: 44, fontWeight: 700, fontFamily: 'var(--pf-t--global--font--family--heading, inherit)', color: '#151515', lineHeight: 1 }}>{needed}</div>
            <div style={{ color: '#3c3f42' }}>of {gpusFree} GPUs free</div>
          </FlexItem>
          <FlexItem>
            <Button variant="primary" isDisabled={!hasRecipe}>Review and deploy</Button>
            {!hasRecipe && <div style={{ color: '#54585c', fontSize: 12, marginTop: 4 }}>No recipe for this model yet.</div>}
          </FlexItem>
        </Flex>

        <Divider style={{ margin: '16px 0' }} />

        <Flex spaceItems={{ default: 'spaceItemsSm' }} style={{ marginBottom: 12 }}>
          <FlexItem><PassWarn label="Mean TTFT" predicted={config.ttft} target={ttftTarget} unitLabel="ms" /></FlexItem>
          <FlexItem><PassWarn label="Mean TPOT" predicted={config.tpot} target={tpotTarget} unitLabel="ms" /></FlexItem>
        </Flex>

        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Served {unit === 'users' ? 'concurrency' : 'request rate'}</DescriptionListTerm>
            <DescriptionListDescription>
              {unit === 'users' ? `${fmt(config.concurrency)} concurrent` : `${fmt(config.request_rate, 1)} req/sec`}
              {servedNote && <span style={{ color: '#54585c' }}> · {servedNote}</span>}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>

        <ExpandableSection toggleText={open ? 'Hide details' : 'Show details'} onToggle={(_e, v) => setOpen(v)} isExpanded={open}>
          <DescriptionList isHorizontal isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>Deployment</DescriptionListTerm>
              <DescriptionListDescription>{topologyLabel(config.mode, config.tp, config.pp, config.replicas_needed)}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Throughput per GPU</DescriptionListTerm>
              <DescriptionListDescription>{fmtThousands(config.tokens_per_second_per_gpu)} tok/s</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Simulator</DescriptionListTerm>
              <DescriptionListDescription>{config.simulator} · vLLM {config.backend_version ?? '—'}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Run id</DescriptionListTerm>
              <DescriptionListDescription style={{ fontFamily: 'monospace' }}>{runId ?? '—'}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </ExpandableSection>

        <Content component="p" style={{ color: '#54585c', fontSize: 12, marginTop: 14 }}>
          Best-effort estimate from the simulator, not a guarantee. Latency shown against your target, not enforced.
        </Content>
      </CardBody>
    </Card>
  )
}
