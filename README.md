# LLM sizing demo

An answer-first UI for sizing and deploying an LLM on OpenShift AI: pick a model and your load,
get the GPU count and deployment shape, with the efficiency trade-off behind it.

**This is an early prototype for feedback.** It runs entirely on **recorded** AISimulate responses
(no live service, no GPUs). Numbers are best-effort simulator estimates, not guarantees, and the
latency target is shown as pass/warn, not enforced.

## Try it
- Live: enabled via GitHub Pages (see the repository's Pages URL).
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
