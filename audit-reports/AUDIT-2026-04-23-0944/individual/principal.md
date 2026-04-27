# Principal Engineer Audit

Date: 2026-04-23  
Scope: `.`

## Severity Summary

- High: 3
- Medium: 2
- Low: 1

## Findings

### 🔴 High

1) **Render-path debug telemetry introduces side effects, noise, and sensitive runtime leakage risk**
- Multiple UI and layout components execute `fetch("http://127.0.0.1:7242/...")` directly in render paths (or render-adjacent execution), which violates clean component responsibility and causes unnecessary network work during normal rendering.
- This pattern appears broadly and repeatedly, creating avoidable re-render overhead and coupling production runtime behavior to local debugging infrastructure.
- The payloads include environment-derived metadata (e.g., key presence/length checks), which should not be emitted from app render code.
- Evidence: `app/layout.tsx`, `app/providers.tsx`, `components/BoardCanvas.tsx`, `components/VideoRoom.tsx`, `app/board/[id]/page.tsx`, `app/meeting/[id]/page.tsx`.

2) **Convex auth integration is structurally broken (compile-time failures)**
- `convex/http.ts` imports `./auth`, but no `convex/auth.ts` exists in the repository.
- `convex/schema.ts` imports `@convex-dev/auth/convex`, but the package is not present in dependencies.
- TypeScript compile confirms both failures, meaning current auth path is not build-safe.
- Evidence: `convex/http.ts`, `convex/schema.ts`; `npx tsc --noEmit` reports:
  - `Cannot find module './auth'`
  - `Cannot find module '@convex-dev/auth/convex'`

3) **Authentication configuration ships with placeholder identity provider values**
- `convex/auth.config.ts` uses placeholder issuer/JWKS URLs (`your.issuer.url.com`), which means auth trust configuration is not production-valid.
- This is a high-risk operational issue: auth behavior may fail at runtime or give false confidence during integration.
- Evidence: `convex/auth.config.ts`.

### 🟡 Medium

1) **Provider bootstrapping masks critical misconfiguration with placeholder fallback**
- `ConvexReactClient` is initialized with a hardcoded placeholder URL when `NEXT_PUBLIC_CONVEX_URL` is missing.
- This defers failure to runtime behavior and obscures root-cause diagnosis; fail-fast configuration validation is preferable.
- Evidence: `app/providers.tsx`.

2) **Generated typing file contains environment-specific dev path**
- `next-env.d.ts` imports `./.next/dev/types/routes.d.ts`, a local dev-generated path that should not be relied on as committed source-of-truth.
- This creates portability/consistency risk across CI and clean environments.
- Evidence: `next-env.d.ts`.

### 🔵 Low

1) **`BoardCanvas` is a God component with mixed concerns**
- `components/BoardCanvas.tsx` (~390 lines) handles rendering, network persistence, presence, merge logic, file conversion, and instrumentation in one component.
- This increases cognitive load and slows safe iteration/testing.
- Evidence: `components/BoardCanvas.tsx`.

## Notes

- Principal rubric requested reporting medium+ findings; low is included here only for prioritization context.
- Additional TypeScript errors exist in tests (`toBeInTheDocument` matcher typing), but they are secondary to the core architecture/integration issues above.
