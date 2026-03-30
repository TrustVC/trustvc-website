# TrustVC Sanity Studio

This studio powers the `News & Updates` pages in the main app.

## Run Studio

```bash
cd sanity-admin
npm run dev
```

## Content model

- `author`: article author profile
- `category`: article category label (e.g. Product Update)
- `post`: main article document
  - `title`
  - `subtitle` (used in list + detail header)
  - `slug`
  - `author`
  - `mainImage`
  - `categories`
  - `publishedAt`
  - `body`
  - `source` (optional)

## Publish flow

1. Create and publish at least one `author`.
2. Create and publish at least one `category`.
3. Create a `post`, fill all required fields, then publish.
4. Open app route `/news-updates` to verify latest-first list.
5. Click any card to open `/news-updates/:slug` detail page.
