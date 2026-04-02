# Sanity Client — Test Coverage (`client.test.ts`)

Tests for `src/lib/sanity/client.ts`, which creates the Sanity CMS client and the image URL builder used across the app.

---

## Test Groups

### Unconfigured — no env vars set
Covers behaviour when `VITE_SANITY_PROJECT_ID` and `VITE_SANITY_DATASET` are both empty.

| Test | What it checks |
|------|----------------|
| `isSanityConfigured` is false | Export is `false` when neither env var is set |
| `sanityClient` is null | No client instance is created |
| `createClient` not called | `@sanity/client` factory is never invoked |
| `getSanityImageUrl` returns null (with source) | Image builder is not initialised, so any source returns `null` |
| `getSanityImageUrl` returns null (undefined source) | Correct null-guard when source is `undefined` |
| `getSanityImageUrl` returns null (empty object) | Correct null-guard when source has no asset ref |

---

### Configured — both env vars set
Covers the happy path when `VITE_SANITY_PROJECT_ID` and `VITE_SANITY_DATASET` are present.

| Test | What it checks |
|------|----------------|
| `isSanityConfigured` is true | Export is `true` |
| `sanityClient` is not null | A client instance is created |
| `createClient` called with `projectId` and `dataset` | Correct values forwarded to SDK |
| `createClient` called with `useCdn: true` | CDN is always enabled |
| Default `apiVersion` is `2025-01-01` | Fallback version used when env var is absent |
| Custom `apiVersion` from `VITE_SANITY_API_VERSION` | Env var override is respected |
| Token passed when `VITE_SANITY_READ_TOKEN` is set | Read token forwarded to SDK |
| Token is `undefined` when `VITE_SANITY_READ_TOKEN` is absent | No token sent to SDK |
| `getSanityImageUrl` returns non-null for valid source | Builder produces a result |
| `getSanityImageUrl` returns null for `undefined` source | Null-guard still applies even when configured |
| `getSanityImageUrl` calls `imageBuilder.image(source)` | Correct source passed to builder |
| `getSanityImageUrl` calls `.auto('format')` | Format auto-selection is applied |

---

### Partially configured — only one env var set

| Test | What it checks |
|------|----------------|
| Only `projectId` set → `isSanityConfigured` is false | Both vars required |
| Only `dataset` set → `isSanityConfigured` is false | Both vars required |
| Only `projectId` set → `sanityClient` is null | No client when partial config |

---

## Notes

- Each group stubs/resets `import.meta.env` values and calls `vi.resetModules()` so the module is re-evaluated with the new env state — this is necessary because the client is created at module load time.
- `@sanity/client` and `@sanity/image-url` are fully mocked; no real network calls are made.
