# Sanity News — Test Coverage (`news.test.ts`)

Tests for `src/lib/sanity/news.ts`, which contains the GROQ queries, data-fetching functions, and pure utility logic for the News & Updates feature.

---

## Test Groups

### `getBodyText`
Pure function that converts a Portable Text body array into a plain string.

| Test | What it checks |
|------|----------------|
| `undefined` body | Returns `''` |
| Empty array | Returns `''` |
| Single block, single span | Returns the span's text |
| Single block, multiple spans | Joins spans with a space |
| Multiple blocks | Joins blocks with `\n\n` |
| Block with no `children` | Skips the block gracefully |
| Span with `undefined` text | Treated as empty string; trimmed from final output |
| Leading/trailing whitespace | Final result is trimmed |
| Block with empty `children` array | Skips the block gracefully |
| All blocks with no content | Returns `''` |

---

### `fetchNewsArticles`
Fetches all articles from Sanity, normalizes featured state, and sorts them.

**Guard conditions**

| Test | What it checks |
|------|----------------|
| Sanity not configured | Returns `[]` without calling fetch |
| `sanityClient` is null (even if `isSanityConfigured` is true) | Returns `[]` |
| `fetch` resolves to `null` | Returns `[]` |
| `fetch` resolves to `[]` | Returns `[]` |
| `fetch` called exactly once | No duplicate requests |

**Featured normalization**

| Test | What it checks |
|------|----------------|
| `article.featured = true` | Stays `true` |
| `article.featured = false`, no matching category | Stays `false` |
| Category title is `"featured"` (lowercase) | Sets `featured = true` |
| Category title is `"Featured"` (title case) | Sets `featured = true` (case-insensitive) |
| Category title has surrounding whitespace (`"  FEATURED  "`) | Sets `featured = true` (trimmed) |
| `article.featured = false` but category matches | Overrides to `true` |

**Sorting**

| Test | What it checks |
|------|----------------|
| Featured before non-featured | Featured articles appear first regardless of date |
| Newer date before older within same group | Descending `publishedAt` order |
| Articles with no `publishedAt` | Sorted after dated articles in the same group |
| Featured + newer vs featured + older | Newer featured wins |
| Original array not mutated | Source data is not modified |

**Error handling**

| Test | What it checks |
|------|----------------|
| `fetch` throws | Returns `[]` and logs `[Sanity] fetchNewsArticles failed` |

---

### `fetchNewsArticleBySlug`
Fetches a single article by slug, normalizes it, and returns `null` if not found.

**Guard conditions**

| Test | What it checks |
|------|----------------|
| Sanity not configured | Returns `null` |
| `sanityClient` is null (even if configured) | Returns `null` |
| `fetch` resolves to `null` (not found) | Returns `null` |
| `fetch` called exactly once | No duplicate requests |

**Slug forwarding**

| Test | What it checks |
|------|----------------|
| Slug passed as `{ slug }` param | Correct GROQ parameter forwarded to SDK |

**Successful fetch**

| Test | What it checks |
|------|----------------|
| Returns normalized article | Non-null result with correct `_id` |
| Article fields preserved | `title`, `subtitle`, `source`, `body` all present |
| `featured = true` via `article.featured` flag | Normalization applied |
| `featured = true` via `"Featured"` category | Normalization applied |
| `featured = false` when neither condition matches | Stays `false` |

**Error handling**

| Test | What it checks |
|------|----------------|
| `fetch` throws | Returns `null` and logs `[Sanity] fetchNewsArticleBySlug failed` |

---

## Notes

- `./client` is mocked via a mutable `mockState` object so `isSanityConfigured` and `sanityClient` can be changed per-test without module reloading.
- `groq` template tag is mocked as a pass-through so GROQ query strings don't cause parse errors in the test environment.
- No real Sanity API calls are made.
