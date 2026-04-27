# DRY & Patterns Audit — Full repo scope

**Scope:** project root (Next.js app, Convex, components, tests, Cypress)  
**Auditor role:** Patterns & Abstraction (per `.cursor/commands/audit-dry.md`)  
**Date:** 2026-04-23

**Severity key**

| Level | Meaning |
|-------|--------|
| **High** | Duplication with strong divergence or defect risk; same behavior maintained in several places. |
| **Medium** | Active copy-paste or parallel logic; maintenance and inconsistency risk. |
| **Low** | Abstraction, constants, or small-component opportunities; improves consistency and readability. |

---

## Findings

### High

```
// None identified for this DRY pass — no duplicated security-critical or correctness-critical
// branches that differ per copy (auth paths are centralized in middleware + Clerk).
```

### Medium

// 🟡 [DRY] **Duplication: Clerk user sync to Convex**  
// Same `useEffect` pattern calling `getOrCreateByClerkId` with `user.id`, `fullName ?? firstName ?? "User"`, email, and `avatarUrl` appears in:  
// - `app/dashboard/page.tsx` (lines ~67–79)  
// - `app/meeting/[id]/page.tsx` (lines ~42–54)  
// **Consolidate into:** e.g. `hooks/useConvexUserId.ts` (or a tiny provider) that returns `{ convexUserId, isReady }` and encapsulates the mutation + dependency array.

// 🟡 [DRY] **Duplication: email validation regex**  
// Identical `^[^\s@]+@[^\s@]+\.[^\s@]+$` check in:  
// - `components/MeetingScheduler.tsx` (`handleAddInvite`)  
// - `app/meeting/[id]/page.tsx` (`handleAddInvite`)  
// **Consolidate into:** `lib/validation/isValidEmail.ts` or shared `validateInviteEmail` used by both (and any future invite UI).

// 🟡 [DRY] **Duplication: board tear-down (shares + presence)**  
// In `convex/boards.ts`, `remove` (lines ~168–183) and `removeAllByOwner` (lines ~196–210) each loop `boardShares` and `boardPresence` then delete the board.  
// **Consolidate into:** internal helper e.g. `deleteBoardCascades(ctx, boardId: Id<"boards">)` called from both mutations to avoid one path gaining cleanup steps the other omits.

// 🟡 [DRY] **Duplication: Resend “send email” actions**  
// `convex/email.ts` — `sendInviteEmail` and `sendMeetingStartedEmail` repeat: env check + warn, `new Resend`, `from`, `to`, error logging, and similar HTML shell/styles.  
// **Consolidate into:** `sendTemplatedResendEmail({ subject, htmlBody })` (or two thin wrappers) in the same file or `convex/lib/resendEmail.ts` for `"use node"` context.

// 🟡 [DRY] **Duplication: `BoardCanvas` + Clerk `currentUser` in two branches**  
// `app/meeting/[id]/page.tsx` repeats the same block for external video platforms vs LiveKit (board present: `BoardCanvas` with `user` → `{ clerkId, name, avatarUrl }` and `onAddImageRef`; board absent: empty-state `div`).  
// **Consolidate into:** small inner component e.g. `MeetingBoardPanel` with props `{ boardId, user, onAddImageRef }` rendering either canvas or empty state once.

### Low

// 🔵 [DRY] **Abstraction: meeting platform label / badge**  
// Platform display logic is repeated as nested ternaries in `app/dashboard/page.tsx` (meeting list) and similar branching exists in `app/meeting/[id]/page.tsx` for copy and layout. `convex/meetings.ts` already centralizes `platform` literals.  
// **Consolidate into:** `lib/meetingPlatform.ts` with `getPlatformLabel(platform): string` and optional short label for badges.

// 🔵 [DRY] **Abstraction: modal shell for dashboard**  
// `app/dashboard/page.tsx` reuses the same overlay pattern many times: `fixed inset-0 z-50 flex items-center justify-center bg-black/40` + `max-w-* rounded-xl border ... bg-white p-6 shadow-lg`.  
// **Consolidate into:** `components/Modal.tsx` (or a single `BoardActionModal` with `variant`) with children + title + footer actions.

// 🔵 [DRY] **Abstraction: share-link base URL**  
// `${window.location.origin}/board/shared/${token}` is built in multiple places in the share modal; clipboard + readonly input duplicate the string.  
// **Consolidate into:** `getBoardShareUrl(shareToken: string)` in `lib/urls.ts` (and use for display + copy).

// 🔵 [DRY] **Abstraction: meeting URL with normalized base**  
// `baseUrl.replace(/\/$/, "")` + `/meeting/${id}` appears in `convex/meetings.ts` (join) and `convex/meetingInvites.ts` (invite).  
// **Consolidate into:** `buildMeetingUrl(baseUrl: string, meetingId: Id<"meetings">): string` in e.g. `convex/lib/urls.ts` (Convex-safe, no `window`).

// 🔵 [DRY] **Validator reuse in Convex**  
// `convex/meetings.ts` repeats the `platform` union in `schedule` args and in `meetingValidator`; `convex/boards.ts` repeats board field shapes in `boardReturnFields`, `listWithShareCounts`, `listSharedWithMe`, and `getByShareToken` return validators.  
// **Consolidate into:** shared `v` fragments (e.g. `boardDocValidator`, `platformValidator`) in `convex/validators/` or the top of the module to keep return types aligned with schema changes.

// 🔵 [DRY] **Component: `VideoRoom` status panels**  
// `components/VideoRoom.tsx` uses the same bordered brown panel classes for error, loading, and misconfiguration states (lines ~55–65, ~68–72, ~77–93).  
// **Consolidate into:** `VideoRoomStatus` subcomponent or `const panelClass = "..."` to avoid class string drift.

// 🔵 [DRY] **Constants: route path segments**  
// `/board/`, `/meeting/`, `/dashboard` appear as string templates across `SwipeBoardCard`, pages, and links.  
// **Consolidate into:** `lib/routes.ts` with `routes.board(id)`, `routes.meeting(id)`, `routes.sharedBoard(token)` (optional, mainly for refactors and grep clarity).

// 🔵 [DRY] **Diagnostic / agent logging**  
// Repeated `fetch('http://127.0.0.1:7242/ingest/...` blocks appear in `components/BoardCanvas.tsx`, `components/VideoRoom.tsx`, `app/meeting/[id]/page.tsx`, and `app/board/[id]/page.tsx` (often wrapped in `// #region agent log`).  
// **Consolidate into:** single dev-only `logDebug(event)` helper or remove before production to reduce noise and merge conflicts.

// 🔵 [DRY] **Type alignment: `CurrentUser` vs inline Clerk user objects**  
// `components/BoardCanvas.tsx` exports `CurrentUser`; board and meeting pages build the same object shape inline.  
// **Consolidate into:** `mapClerkUserToCurrentUser(user): CurrentUser | null` in e.g. `lib/clerkUser.ts`.

---

## Summary

| Bucket | Count |
|--------|--------|
| High | 0 |
| Medium | 5 |
| Low | 9 |

**Suggested extractions (indicative):** `hooks/useConvexUserId` (or similar), `lib/validation` / `lib/urls` / `lib/routes`, `convex/lib` for URL helpers + `deleteBoardCascades`, `convex/email` template helper, `MeetingBoardPanel`, `Modal`, `getPlatformLabel`, shared Convex validators, `logDebug` or removal of ingest calls.

/* ═══════════════════════════════════════════
   DRY / PATTERNS AUDIT — repo — 2026-04-23T09:44 (report batch AUDIT-2026-04-23-0944)
   High: 0  Medium: 5  Low: 9
   Suggested extractions: hooks/useConvexUser, lib/urls, convex/lib/boardDelete, convex/email template, components/Modal, MeetingBoardPanel, agents logging helper
   ═══════════════════════════════════════════ */
