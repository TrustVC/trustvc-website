# TrustVC Sanity Studio

This Studio powers the `News & Updates` experience in the website.

## Studio Environment Variables

`sanity.config.ts` and `sanity.cli.ts` both read three variables at build / dev
time. Create a `trustvc-cms/.env` file (already in `.gitignore`) or export them
in your shell before running any Studio command:

```bash
export SANITY_STUDIO_PROJECT_ID=tgb3bn8j
export SANITY_STUDIO_DATASET=production
```

| Variable | Used in | Purpose |
|---|---|---|
| `SANITY_STUDIO_PROJECT_ID` | `sanity.config.ts`, `sanity.cli.ts` | Sanity project to connect to |
| `SANITY_STUDIO_DATASET` | `sanity.config.ts`, `sanity.cli.ts` | Dataset (e.g. `production`) |

### Deploy token (`SANITY_AUTH_TOKEN`)

Interactive deploys use `npx sanity login`. In CI or any non-interactive shell, the CLI needs a token in **`SANITY_AUTH_TOKEN`** ([authorizing Studio deployments](https://www.sanity.io/docs/studio/deployment#h88071dd868bf)).

1. Open [Sanity Manage](https://www.sanity.io/manage) → your project → **API** → **Tokens**.
2. Add a token with a role that can deploy the hosted Studio (e.g. **Developer** or an equivalent custom role).
3. Set `SANITY_AUTH_TOKEN` locally in `trustvc-cms/.env` (see `.env.example`) or as a secret in your pipeline.

For this repo’s GitHub Action (`.github/workflows/deploy-sanity-studio.yml`), add a repository secret named **`SANITY_AUTH_TOKEN`** with that token, alongside `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`.

After setting them, validate the schema before running or deploying:

```bash
npx sanity schema validate
```

---

## Run the Studio

```bash
cd trustvc-cms
npm run dev
```

## Build and Preview

```bash
cd trustvc-cms
npm run build
npm run start
```

## Deployment Commands

Run these from `trustvc-cms`:

```bash
# Login once (if not already authenticated)
npx sanity login

# Validate local schema
npx sanity schema validate

# Deploy schema changes to the configured project/dataset
npx sanity schema deploy

# Deploy the hosted Studio
npx sanity deploy
```

## Important Before Deploying

- Confirm project mapping in:
  - `trustvc-cms/sanity.config.ts`
  - `trustvc-cms/sanity.cli.ts`
- Ensure the target dataset is correct (for example: `production`).
- Run `npx sanity schema validate` before every deploy.
- Publish content changes in Studio; drafts are not visible on public APIs.
- For frontend fetches, ensure environment variables are set in the website app:
  - `VITE_SANITY_PROJECT_ID`
  - `VITE_SANITY_DATASET`
  - `VITE_SANITY_API_VERSION`

## Schema Overview

Registered schema types:

- `author` (document)
- `category` (document)
- `post` (document)
- `blockContent` (reusable rich text type)

---

## `author` schema

Used as the post author profile and metadata source for article detail pages.

Fields:

- `name` (`string`, required, min 2, max 80)
- `slug` (`slug`, required, source: `name`, maxLength: 96)
- `image` (`image`, optional, hotspot enabled)
- `bio` (`array` of `block`, optional)

Preview:

- Title: `name`
- Media: `image`

---

## `category` schema

Used for post categorization and category chips shown in list/detail UI.

Fields:

- `title` (`string`, required, min 2, max 25)
- `description` (`text`, optional, 3 rows in Studio)

Validation notes:

- Category name is intentionally capped at 25 chars to fit UI pills.

---

## `post` schema

Primary content type powering list and detail pages.

Fields:

- `title` (`string`, required, min 10, max 120)
- `subtitle` (`text`, optional, min 20, max 220 when provided)
- `slug` (`slug`, required, source: `title`, maxLength: 96)
- `author` (`reference` -> `author`, required)
- `mainImage` (`image`, required, hotspot enabled)
- `categories` (`array` of references -> `category`, required, min 1, max 4)
- `publishedAt` (`datetime`, required)
- `featured` (`boolean`, optional, default `false`)
- `body` (`blockContent`, required)
- `source` (`string`, optional, max 120)

Ordering options:

- `publishedAtDesc`: newest first
- `featuredThenPublishedAtDesc`: featured first, then newest

Preview:

- Title: `title`
- Subtitle: `publishedAt • subtitle`
- Media: `mainImage`

Validation notes:

- Categories are capped to 4 max to match card and detail UI constraints.
- Featured posts are prioritized in frontend sorting/display.

---

## `blockContent` schema

Reusable rich text type for post bodies.

Supports:

- Block styles: `normal`, `h2`, `h3`, `blockquote`
- Lists: `bullet`
- Decorators: `strong`, `em`
- Link annotation (`link.href`) with allowed schemes:
  - `http`
  - `https`
  - `mailto`
  - `tel`
- Inline images (`image` with hotspot)

---

## Content Authoring Flow

1. Create and publish one or more `author` documents.
2. Create and publish relevant `category` documents.
3. Create a `post` and fill required fields.
4. Optionally mark important posts as `featured`.
5. Publish the post.

## Frontend Consumption Notes

- List page route: `/news-updates`
- Detail page route: `/news-updates/:slug`
- Frontend reads:
  - author name + image
  - categories
  - featured flag
  - body rich text (supports headings, blockquotes, bold, emphasis, links, lists, and images in detail view)
