# Sentry Setup — TrustVC Website

Application monitoring and error tracking for the TrustVC frontend (`trustvc.io` / `dev.trustvc.io`).

**Decision:** **Sentry** was selected over Datadog for this rollout, following the same approach used on [ref.tradetrust.io](https://ref.tradetrust.io).

**Sponsored account:** Request an open-source sponsored Sentry organisation at [sentry.io/for/open-source](https://sentry.io/for/open-source) using **TrustVC@dextech.ai**.

---

## What is instrumented

| Area | What Sentry captures | Tag `error.source` |
|------|----------------------|--------------------|
| React app | Unhandled exceptions via `Sentry.ErrorBoundary` + global handler | `app` |
| Document verification | Thrown errors (`processFile`, network confirm, URL load) | `verification` |
| Failed verification (invalid) | Warning event with fragment summary — **no credential payload** | `verification` |
| Support API | HTTP failures from `fetchClientSupport` | `support-api` |
| Sanity CMS | News fetch failures — distinguish CMS outages from app bugs | `sanity-cms` |

Breadcrumbs are added for verification start/complete.

**Not in this repo:** The Support API backend is a separate service. Instrument that service separately if server-side monitoring is required.

**Session Replay is disabled** — the verify UI may display credential content.

---

## PII / credential scrubbing

Before any event is sent, `beforeSend` / `beforeBreadcrumb` scrub:

- `proof`, `proofValue`, `credential`, `merkleRoot`, `signature`, `attachments`, etc.
- Long strings that look like signed credential JSON
- Email, tokens, secrets

Only safe metadata is sent: file **name** (not contents), schema label, error type, fragment names/statuses, chain ID, HTTP path/status.

Implementation: `src/lib/sentry/scrub.ts`

---

## Environment variables

| Variable | Dev deploy | Prod deploy | Local / CI |
|----------|------------|-------------|------------|
| `VITE_SENTRY_DSN` | `VITE_SENTRY_DSN_DEVELOPMENT` secret | `VITE_SENTRY_DSN_PRODUCTION` secret | empty (disabled) |
| `VITE_SENTRY_ENVIRONMENT` | `dev` (workflow) | `production` (workflow) | `local` |
| `VITE_SENTRY_RELEASE` | git SHA (workflow) | git SHA (workflow) | empty |

**Build-time only** (source map upload — not in browser bundle):

| Secret | Purpose |
|--------|---------|
| `SENTRY_AUTH_TOKEN` | Upload source maps during deploy build |
| `SENTRY_ORG` | Sentry organisation slug |
| `SENTRY_PROJECT_TRUSTVC_WEB_DEV` | Dev project slug |
| `SENTRY_PROJECT_TRUSTVC_WEB_PROD` | Prod project slug |

---

## GitHub secrets checklist

```
VITE_SENTRY_DSN_DEVELOPMENT=https://...@....ingest.sentry.io/...
VITE_SENTRY_DSN_PRODUCTION=https://...@....ingest.sentry.io/...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=your-org-slug
SENTRY_PROJECT_TRUSTVC_WEB_DEV=trustvc-web-dev
SENTRY_PROJECT_TRUSTVC_WEB_PROD=trustvc-web-prod
```

Deploy workflows (`.github/workflows/deploy-dev.yml`, `deploy-prod.yml`) inject Sentry env vars and upload source maps when the build secrets are present.

---

## Sentry project setup (UI)

Create **two projects** in Sentry (recommended):

| Project | Environment | Site |
|---------|-------------|------|
| `trustvc-web-dev` | `dev` | `dev.trustvc.io` |
| `trustvc-web-prod` | `production` | `trustvc.io` |

### Alerting → Slack

1. Sentry → **Settings → Integrations → Slack** → Install
2. **Alerts → Create Alert** → Issues
3. Condition: e.g. "Number of events in an issue is greater than 10 in 1 hour" OR "A new issue is created"
4. Action: Send Slack notification to the maintaining team channel
5. Repeat per project (dev + prod)

### Team access (IMDA / DEX)

1. Sentry → **Settings → Members** → Invite `TrustVC@dextech.ai` and team members
2. Create team **TrustVC Maintainers** with access to both projects
3. Role: **Member** (view issues, resolve) or **Manager** (configure alerts)

---

## Verify in non-prod (acceptance test)

1. Deploy to dev with `VITE_SENTRY_DSN_DEVELOPMENT` set
2. Open `https://dev.trustvc.io`
3. DevTools console:

```javascript
window.__trustvcSentryTest()
```

4. Sentry → **Issues** → confirm error: `TrustVC Sentry test error — safe to ignore`
5. Stack trace should show original source file names (if source maps uploaded)

### Other checks

| Action | Expected in Sentry |
|--------|-------------------|
| Submit invalid JSON file | `verification` issue, stage `processFile` |
| Verify invalid document | Warning: "Document verification failed", tag `verification.result=invalid` |
| Sanity outage / bad token | Issue tagged `error.source=sanity-cms` |
| Support form API 500 | Issue tagged `error.source=support-api` |

Filter by tag **`error.source`** to tell CMS vs app vs API:

- `sanity-cms` → Sanity / CMS problem
- `support-api` → Support backend problem
- `verification` → Document verification flow
- `app` → General frontend error

---

## Local development

```bash
# .env — monitoring disabled by default
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=local
```

To test locally against dev Sentry project:

```bash
VITE_SENTRY_DSN=https://...@....ingest.sentry.io/...
VITE_SENTRY_ENVIRONMENT=dev
npm run dev
```

---

## Code reference

| File | Role |
|------|------|
| `src/lib/sentry/init.ts` | `Sentry.init()`, scrub hooks |
| `src/lib/sentry/scrub.ts` | PII scrubbing |
| `src/lib/sentry/capture.ts` | Domain capture helpers |
| `src/lib/sentry/SentryErrorBoundary.tsx` | React error boundary |
| `src/main.tsx` | Bootstrap |
| `src/utils/fetchClient.ts` | Support API errors |
| `src/components/home/VerifySection/useVerify.ts` | Verification errors |
| `src/lib/sanity/news.ts` | CMS errors |

---

## Acceptance criteria mapping

| AC | Status |
|----|--------|
| Tool selected (Sentry) | Documented above |
| Frontend integration | `src/lib/sentry/*`, `main.tsx`, `useVerify.ts` |
| Frontend functions (Support API client) | `fetchClient.ts` |
| Slack alerting | Configure in Sentry UI (steps above) |
| PII scrubbing | `scrub.ts` |
| Non-prod E2E test | `window.__trustvcSentryTest()` on dev |
| Production deploy | GitHub secrets + `deploy-prod.yml` |
| Dashboard access | Invite team in Sentry Members |
