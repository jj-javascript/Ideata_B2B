# Security Audit Report

Scope: `.`
Role: Application Security Auditor
Date: 2026-04-23

## Findings

### 🔴 High — Missing server-side authorization checks on sensitive Convex functions (BOLA/IDOR)
- **OWASP:** A01 Broken Access Control
- **Evidence:** Multiple queries/mutations return or mutate records by raw IDs supplied by the client, with no identity/ownership check on the server.
  - `convex/boards.ts` (`get`, `save`, `updateTitle`, `remove`, `removeAllByOwner`, `generateShareLink`, `revokeShareLink`, `addShare`, `removeShare`, `getShares`, `updatePresence`, `getPresence`, `removePresence`)
  - `convex/meetings.ts` (`get`, `join`, `end`, `addParticipant`, `removeParticipant`)
  - `convex/meetingInvites.ts` (`invite`, `listByMeeting`, `removeInvite`)
  - `convex/users.ts` (`get`)
- **Risk:** Any authenticated user can tamper with IDs to read/modify/delete other users' boards, shares, meetings, invites, and profile data.
- **Fix:** Derive caller identity from server auth context and enforce per-record authorization (owner/participant/share checks) before every read/write.

### 🔴 High — Privileged actions trust caller-supplied identity fields
- **OWASP:** A01 Broken Access Control, A04 Insecure Design
- **Evidence:** Mutations accept user identity/ownership fields directly from client input and use them as authority.
  - `convex/boards.ts` `create` uses `ownerId` from args
  - `convex/meetings.ts` `schedule` uses `hostId`; `join` uses `userId`
  - `convex/users.ts` `getOrCreateByClerkId` uses `clerkId` from args
  - `components/MeetingScheduler.tsx` and `app/dashboard/page.tsx` pass these IDs from the client
- **Risk:** Attackers can impersonate other users by submitting another user ID/clerk ID and create or mutate resources under that identity.
- **Fix:** Ignore client-provided identity for authorization purposes; compute actor identity server-side from verified auth claims and constrain writes accordingly.

### 🟡 Medium — Email invitation links are built from untrusted `baseUrl` input (phishing vector)
- **OWASP:** A04 Insecure Design, A07 Authentication & Session Failures
- **Evidence:** `convex/meetingInvites.ts` `invite` accepts `baseUrl` from caller and embeds it directly into outbound email links:
  - `const meetingUrl = \`${args.baseUrl.replace(/\/$/, "")}/meeting/${args.meetingId}\`;`
- **Risk:** A caller can generate invitation emails that point to attacker-controlled domains while appearing to come from the app.
- **Fix:** Build URLs from a trusted server-side configuration value only (e.g., `APP_URL`) and reject caller-provided origins.

### 🟡 Medium — HTML injection risk in email templates from unsanitized meeting fields
- **OWASP:** A03 Injection
- **Evidence:** `convex/email.ts` interpolates user-controlled strings directly into HTML email templates:
  - `${args.meetingTitle}` and `${args.meetingUrl}` in `sendInviteEmail` / `sendMeetingStartedEmail`
- **Risk:** Malicious meeting titles/URLs can inject unexpected markup into emails and increase phishing/social-engineering impact.
- **Fix:** Escape/sanitize template variables before HTML interpolation and validate URLs against allowed schemes/domains.

### 🔵 Low — No explicit HTTP security headers configured in Next.js app
- **OWASP:** A05 Security Misconfiguration
- **Evidence:** `next.config.mjs` exports an empty config object; no CSP/HSTS/X-Frame-Options configured.
- **Risk:** Browser-side protections rely on defaults and may be insufficient for clickjacking/content-injection hardening.
- **Fix:** Add explicit security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, etc.) in Next.js configuration or middleware.

## Summary
- High: 2
- Medium: 2
- Low: 1

/* ═══════════════════════════════════════════
   SECURITY AUDIT — . 2026-04-23T09:44
   🔴 Critical: 2  🟡 Medium: 2  🔵 Hardening: 1
   ═══════════════════════════════════════════ */
