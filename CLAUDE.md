# CLAUDE.md

Guidance for working in this repo — for human developers and for Claude Code.

> **Keep this file alive.** It's only useful if it stays true. Treat it as part of the code: when
> a change makes something here wrong or incomplete, update it _in the same commit/PR_. See
> [Maintaining this file](#maintaining-this-file).

## What this repo is

`trustvc-website` is the **public TrustVC site and document verifier** — a Vite + React +
TypeScript SPA. It owns no cryptography and no chain logic: verification is
`@trustvc/trustvc`'s `verifyDocument`, and this repo turns the fragments it returns into a
verdict, a message and a rendered document. When a signature, proof or status is wrong, the bug
is almost always upstream in `trustvc` (or `@trustvc/w3c-vc` below it), not here. What _is_ ours
is **which failure the user is told about, and in what words** — that is where the bugs live.

```text
src/main.tsx                       entry; src/routes.tsx defines routes
src/pages/Toolkit/                 developer utilities at /toolkit (wrap, DNS, encrypt, revoke)
src/components/toolkit/            Toolkit page UI
src/utils/toolkit/                 wrap/unwrap, DNS, encrypt, OA doc-store revoke helpers
src/components/home/VerifySection/ the verifier — drop zone, hook, results, error copy
src/components/AssetManagementPanel/ title-escrow / transferable-record actions
src/gasless/                       gasless transaction hooks
src/utils/helper.ts                document shape helpers (presentations, labels, expiry)
src/hooks/                         contract hooks (token registry, title escrow, obligation)
src/lib/sentry/                    verification breadcrumbs and exceptions (src/lib/sanity/ too)
src/__tests__/__fixtures__/        real signed documents to verify against
trustvc-cms/                       Sanity studio (separate deploy)
e2e/                               Playwright + Synpress (MetaMask) + Hardhat
```

## Commands

CI runs **Node 22.x and 24.x**. There is no `.nvmrc`; use `nvm use 22`.

```bash
npm run dev              # vite --mode development --open
npm run build            # production build (also build:dev / build:prod)
npm test                 # vitest run
npm run lint             # eslint, --max-warnings 0
npm run format:check     # prettier, the set CI checks
npm run test:coverage    # what CI actually runs

npx vitest --run src/__tests__/verifiablePresentation.integration.test.ts   # one file
npx vitest --run <file> -t "credential_expired"                            # one test
```

**Before "done": `npm run lint` AND `npm run format:check`.** CI (`.github/workflows/ci.yml`) runs
lint → format:check → test:coverage on both Node versions, and `lint` is `--max-warnings 0`, so a
single warning is a red build. The husky `pre-commit` hook runs `lint` **and** `format:check`, so
a commit fails locally before CI sees it — including on files you did not touch.

**`format:check` covers JSON, CSS and Markdown**, not just source:
`"src/**/*.{js,jsx,ts,tsx,json,css,md}"`. Adding a **fixture** therefore means running
`npx prettier --write` on it or the build goes red — generated JSON is never prettier-shaped by
accident. Note prettier here is `semi: false`, `printWidth: 80`, `arrowParens: avoid` — different
from most TrustVC repos, so don't hand-format.

## Testing

`vite.config.js` sets `environment: 'jsdom'` with `setupFiles: './src/setupTests.ts'` (jest-dom
matchers, Swiper CSS mocks, a localStorage mock, `cleanup()` after each test). `e2e/` is excluded.

**Real crypto does NOT work under jsdom.** Anything that signs, derives or verifies a W3C
document must opt into the node environment with a first-line docblock:

```ts
// @vitest-environment node
```

Without it, `deriveW3C` fails with `The proof does not include a valid "proofValue" property` and
ECDSA holder proofs fail to verify — so every assertion silently becomes meaningless rather than
erroring. `verifiablePresentation.integration.test.ts` documents this at the top and is the model
to copy. **A test that "proves" a verification bug under jsdom has proved nothing** — reproduce it
in plain Node before believing it.

**Vite also shims node builtins in tests.** `import fs from 'node:fs'` is `null` under this
config, docblock or not, so a test cannot read fixtures off disk. Import the JSON instead (Vite
resolves it), or precompute data into a `.ts` module.

## The verification pipeline

```text
drop file → loadDocument (useVerify.ts)
          → verifyDocument()                       @trustvc/trustvc
          → VerificationFragment[]                 three types: DOCUMENT_INTEGRITY,
                                                   DOCUMENT_STATUS, ISSUER_IDENTITY
          → computeGroupStatus per type            drives the three check rows
          → getErrorTypeFromFragments()            → VerifyErrorType (REVOKED, HASH, IDENTITY…)
          → getErrorMessageFromFragments()         → the sentence the user reads
```

`errorMessages.TYPES` and `errorMessages.MESSAGES` come from **trustvc**, not this repo. A type's
own `failureMessage` is used unless a rule supplies an override, so **only write copy where no
existing message conveys the cause** — there is no EXPIRED type, for instance.

### `PRESENTATION_FAILURES` — order is behaviour, not style

trustvc's `errorMessageHandling` was written for OpenAttestation: it maps any invalid
DOCUMENT_INTEGRITY to HASH, so every presentation failure came out as "Document has been tampered
with". This repo matches on the verifier's **reason text** instead, in an ordered list where the
first match wins. Three orderings are load-bearing:

- **Embedded-credential failures before presentation-level ones.** `Presentation has expired
(validUntil …)` and `Embedded credential at index 0 has expired (validUntil …)` both contain
  "has expired". A single `/has expired/` rule catches the credential case and tells the user to
  ask the holder to present again — advice that **can never work**, because only the issuer can
  reissue a credential. An expired presentation is the holder's to fix; an expired credential is
  the issuer's. Opposite remedies, so they must never share copy.
- **Issuer resolution before tampering.** Verifying an embedded credential's signature needs its
  issuer's public key, so an unpublished did:web _also_ fails integrity — with a raw TypeError,
  `Cannot read properties of null (reading 'verificationMethod')`. Matched the other way round, a
  perfectly intact document is reported as tampered with. Root cause beats symptom.
- **Revocation before tampering**, for the same reason: it is the more actionable answer, and the
  realistic case (revoked upstream after signing) leaves the proof intact anyway.

### Naming the credential at fault

Copy that blames an embedded credential uses `credentialsAtFault()`, which produces
`Credential 2 ("BILL OF LADING")` — **position and label together**. Each alone is wrong:

- Position alone names nothing on screen: real documents label their tabs by template or type
  ("CHAFTA COO", "BILL OF LADING") and only fall back to `Credential N` when a credential has
  neither. The verifier's own zero-based `index 1` is worse.
- Label alone is ambiguous: `CredentialTabs` renders the label with no disambiguation, so two
  bills of lading in one presentation give two identical tabs.

Reasons carry indices in several shapes (`at index 0`, `index 0 (did:web:…)`, `at index 0, 2`) and
sometimes several at once, so every `\bindex (\d+)` is collected. `getErrorMessageFromFragments`
takes the document as an optional second argument purely so the label can be looked up; without
it the copy degrades to the position rather than naming the wrong thing.

**Never let raw verifier wording reach the user** — no `validUntil`, no `did:key:…`, no
`Cannot read properties`. The integration test asserts this for every fixture.

## Fixtures

`src/__tests__/__fixtures__/w3c/presentations/{valid,invalid}/` — one file per outcome, mirroring
the trustvc CLI's own set. The path states the expectation: anything under `invalid/` must fail,
and the filename says how.

```text
valid/    single_credential · two_credentials · mixed_suites · didweb_issuer · with_attachments
invalid/  presentation_expired · credential_expired · credential_revoked
          holder_mismatch · tampered_credential · unresolvable_issuer · unsigned
```

These are **signed artifacts**: they cannot be hand-edited, because any edit invalidates the
proof. Regenerate them with the CLI's `tests/fixtures/vp/generate.cjs` and copy them across.
Expiry windows are either in the past or 2999, so nothing rots.

`credential_revoked` and `unresolvable_issuer` need **network** (a status-list fetch, a DID
resolution attempt); so do the `didweb_issuer` cases. Label such tests, as the existing ones do.

**Assert fixtures through `verifyDocument`, not hand-built fragments.** Hand-built fragment sets
pin the copy mapping but not the verifier wording it depends on — trustvc can reword a reason and
those tests keep passing while production silently regresses. The integration test does both, and
the real-document half is what actually guards the bug.

## Gotchas (hard-won — add to this list)

- **`@trustvc/trustvc` is pinned EXACTLY** (`"2.16.0-beta.6"`, no caret). `npm install` adds a
  caret by default; remove it. A caret on a prerelease would drift to `2.16.0` final and beyond.
- **The 2.16 beta line lagged the fix that matters here.** `2.15.2` moved the embedded-credential
  temporal check into DOCUMENT_STATUS; `2.16.0-beta.3` predates it and reports the same failure as
  DOCUMENT_INTEGRITY, which is what made an expired credential look like tampering.
  `2.16.0-beta.6` has it. **Re-check this when changing the version** — the fragment a failure
  lands on is version-specific, and so is the copy that keys off it.
- **Restart the dev server after any dependency change.** Vite pre-bundles dependencies, so a
  server started before `npm install` keeps serving the old copy — a version bump appears to do
  nothing. `npx vite --mode development --port 5174 --force`, or delete `node_modules/.vite`.
- **`DOCUMENT_INTEGRITY` INVALID does not always mean tampering.** It also fails when a
  credential's issuer cannot be resolved (its key is needed to check the signature) and, before
  2.15.2, when an embedded credential had expired. The check row labelled "Document has not been
  tampered with" still shows failed in those cases even when the headline copy correctly blames
  the issuer — the library conflates "unverifiable" with "invalid", one layer below our copy.
- **`getOpenAttestationData` used to throw on a presentation**, which took `getIsExpired` and the
  whole verification run down with it. `src/utils/helper.ts` treats a presentation as its own
  document data; the integration test pins that.
- **The strict library predicates reject shapes the verifier accepts.** A presentation with an
  empty `verifiableCredential` array, or no `@context`, fails `vc.isRawPresentation` and
  `vc.isSignedPresentation` but is still routed into the VP fragments. `isVerifiablePresentation`
  keeps a shape fallback for exactly this; without it those documents fall through to the
  credential path and report a generic failure instead of the verifier's finding.
- **`useVerify.test.ts` mocks `@trustvc/trustvc` wholesale**, so a library helper that throws on a
  presentation goes unnoticed there. `useVerify.presentation.test.tsx` drives the hook against a
  real presentation with the library unmocked, and exists for that reason.
- **Toolkit wrap goes through TrustVC only (`wrapOADocument` / `getDataV2`).** That helper wraps OA v2; OA v3 throws the SDK deprecation (`Please switch over to W3C VC.`); OA v4 and other shapes throw `Unsupported document version`. Do not add `@tradetrust-tt/tradetrust` or `@govtechsg/open-attestation` as direct deps for wrap. Encryption, DNS, and revoke already use `@trustvc/trustvc`.

## Conventions

- Copy lives with the mapping in `useVerify.ts`, not in components. Components render whatever
  `errorType` / `errorMessage` they are handed.
- New verification behaviour needs a fixture **and** an assertion through `verifyDocument`.
- Analytics and Sentry calls go through `src/utils/analytics.ts` and `src/lib/sentry/`.

## Maintaining this file

**Documentation-as-code. Keep it in sync in the same change that makes it stale — not "later".**
Update this file when your change touches:

- **What the user is told for a given failure** — the ordering rules and copy above are the whole
  point of this document.
- **The `@trustvc/trustvc` version**, when the fragment a failure lands on moves.
- **The fixture set or its layout.**
- **Tooling, CI gates, or the Node versions** — keep the Commands section runnable.
- **A gotcha you just spent time on** — new gotchas are the highest-value additions.

Small-and-true beats big-and-stale; delete guidance that no longer holds. Keep it repo-specific:
anything true of every Vite + React app doesn't belong here.

**For Claude Code specifically:** at the end of a task that changed any of the above, check
whether this file is now inaccurate and propose the edit as part of the same work — don't wait to
be asked.
