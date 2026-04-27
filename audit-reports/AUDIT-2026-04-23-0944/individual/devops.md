# DevOps / Platform Audit — Repository scope: `.`

Audit performed per `.cursor/commands/audit-devops.md`. Focus: observability, resilience, configuration, scalability, deployment hygiene, Next.js ops.

---

```
// 🔴 [DEVOPS] Performance & reliability: Hardcoded debug `fetch("http://127.0.0.1:7242/ingest/...")` runs on server render (`RootLayout`) and on high-frequency client render paths (e.g. `BoardCanvas` entry and branches), with no environment gate.
//    Evidence: `app/layout.tsx`, `app/providers.tsx`, `components/BoardCanvas.tsx`, `components/VideoRoom.tsx`, `app/meeting/[id]/page.tsx`, `app/board/[id]/page.tsx`
//    Fix: Remove before production or guard with an explicit dev-only flag; replace with a real APM/trace product if telemetry is required.
//    Risk: Extra latency, connection churn, and noisy failures in production; worst case material client jank on heavy boards/meetings.

// 🔴 [DEVOPS] Configuration (fail-late): `ConvexReactClient` is instantiated with `https://placeholder.convex.cloud` when `NEXT_PUBLIC_CONVEX_URL` is missing.
//    Evidence: `app/providers.tsx` (constructor fallback)
//    Fix: Fail the build (e.g. `if (!process.env.NEXT_PUBLIC_CONVEX_URL) throw …` in a small env module) or assert in CI; avoid silent placeholder in production bundles.
//    Risk: A misconfigured deploy can look “up” while every Convex call targets the wrong host, causing broad user-visible outages.

// 🟡 [DEVOPS] Deployment signals: No liveness/readiness HTTP endpoint for the Next.js app.
//    Evidence: No `app/api/**` routes; `convex/http.ts` only registers Clerk auth routes.
//    Fix: Add e.g. `GET /api/health` (liveness) and optionally readiness that reflects critical dependencies.
//    Risk: Load balancers and orchestrators cannot automatically drain or restart bad instances; longer MTTR during incidents.

// 🟡 [DEVOPS] Container hygiene: Dockerfile runs as root, has no `HEALTHCHECK`, and uses a single-stage image that copies the full tree into the runtime layer.
//    Evidence: `Dockerfile` (no `USER`, no `HEALTHCHECK`)
//    Fix: Run as non-root, add `HEALTHCHECK` against `$PORT`, consider multi-stage build to shrink attack surface and image size.
//    Risk: Higher blast radius if the container is compromised; slower automated detection of stuck processes during rollouts.

// 🟡 [DEVOPS] Next.js platform defaults: `next.config.mjs` is empty — no security headers, no explicit `images.remotePatterns`, no caching/headers policy.
//    Evidence: `next.config.mjs`
//    Fix: Set baseline security headers appropriate to the app; configure `images` if using `next/image` with remote URLs; document caching expectations.
//    Risk: Weaker default hardening and less predictable CDN/browser behavior than an explicit policy.

// 🟡 [DEVOPS] Resilience: Convex `generateVisual` chains OpenAI calls and `fetch(imageUrl)` without explicit timeouts, retries, or backoff for transient failures.
//    Evidence: `convex/ai.ts`
//    Fix: Set client timeouts (OpenAI + `fetch` with `AbortSignal`), add bounded retries for idempotent steps where safe.
//    Risk: Long-running actions consume Convex capacity; a slow or hung upstream stalls the feature for users.

// 🟡 [DEVOPS] Observability & error semantics: Resend email actions log with `console.error` / `console.warn` and return `null` on failure — no structured fields or correlation IDs for production log pipelines.
//    Evidence: `convex/email.ts`; similar unstructured `console.error` in `app/dashboard/page.tsx`, `components/BoardCanvas.tsx`, `components/MeetingScheduler.tsx`
//    Fix: Emit structured logs (JSON) with meeting/board identifiers; consider retries or a dead-letter pattern for email failures.
//    Risk: Silent or hard-to-query notification failures in production.

// 🔵 [DEVOPS] Supply chain / reproducibility: Base image `node:20-alpine` pins the major line only, not a patch version or digest.
//    Evidence: `Dockerfile` line 1
//    Fix: Pin to a specific patch or image digest so prod builds are reproducible.

// 🔵 [DEVOPS] Delivery automation: No `.github/workflows` (or other checked-in CI) for lint, test, and build on change.
//    Evidence: repository root (no CI configs found)
//    Fix: Add a minimal pipeline (`npm ci`, `npm run lint`, `npm test`, `npm run build`) on pull requests.
//    Risk: Regressions and misconfigurations reach production more often.

// 🔵 [DEVOPS] Sensitive context in debug payloads: Root layout ingest payload includes booleans derived from env presence (e.g. whether a secret key is set) alongside key length hints.
//    Evidence: `app/layout.tsx` agent log payload
//    Fix: Remove debug telemetry from production paths; if diagnostics are needed, use approved secret-free health checks.
//    Risk: Increases accidental leakage of deployment metadata if the ingest endpoint or proxies ever change.
```

---

## Checklist snapshot (from role)

| Area | Status |
|------|--------|
| Structured logging / PII-safe logs | Gaps (plain `console.*`, debug payloads) |
| External calls: timeout / retry | Gaps (`convex/ai.ts`, Resend usage) |
| Env validation at startup | Partial (some Convex actions validate; Next.js allows placeholder Convex URL) |
| Health endpoint | Missing |
| Dockerfile non-root / pinned base / migrations on boot | Non-root missing; base major-only pin; Convex migrations not in-repo on boot (platform-managed) |
| Next.js headers / images / scripts | Defaults only (`next.config.mjs` empty) |

---

```
/* ═══════════════════════════════════════════
   DEVOPS AUDIT — repository `.` — 2026-04-23
   🔴 High: 2  🟡 Medium: 5  🔵 Low: 3
   ═══════════════════════════════════════════ */
```
