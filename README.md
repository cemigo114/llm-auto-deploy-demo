# Auto-deploy (prototype)

Auto-deploy an LLM on OpenShift AI: pick a model and your load, get a recommended deployment with
the GPU count and shape, and run it on your cluster. The efficiency trade-off sits behind the answer.

**Early prototype for feedback.** It runs entirely on **recorded** AISimulate responses (no live
service, no GPUs). Numbers are best-effort simulator estimates, not guarantees, and the latency
target is shown as pass/warn, not enforced.

Not to be confused with ConfigIQ (planning: compare GPUs, model cost). This is the deploy path:
recommend, then run it in your cluster.

## Try it
- Live: https://cemigo114.github.io/llm-sizing-demo/
- Local:
  ```
  npm install
  npm run dev
  ```

## What to look at
- The **answer**: GPUs needed of GPUs free, mean TTFT/TPOT vs your target, the served load the
  simulator reports.
- The **inputs**: model, workload shape, a concurrent-users / requests-per-second toggle, latency
  targets, and your free GPU count.

## Feedback
Open an issue with what was confusing, what you expected, or what is missing.

## Notes
- Recorded fixtures live in `public/fixtures/` (real, untrimmed `/recommend` responses).
- Built with Vite + React + PatternFly v6.
