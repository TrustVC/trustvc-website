import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NewsArticle } from '../../types/news'

// Mutable state the mock reads from — changed per test
const mockState = vi.hoisted(() => ({
  isSanityConfigured: false,
  sanityClient: null as { fetch: ReturnType<typeof vi.fn> } | null,
}))

vi.mock('./client', () => ({
  get isSanityConfigured() {
    return mockState.isSanityConfigured
  },
  get sanityClient() {
    return mockState.sanityClient
  },
  getSanityImageUrl: vi.fn(),
}))

vi.mock('groq', () => ({
  default: (strings: TemplateStringsArray) => strings.join(''),
}))

import { fetchNewsArticleBySlug, fetchNewsArticles, getBodyText } from './news'

// ─── Fixtures ───────────────────────────────────────────────────────────────

const makeArticle = (overrides: Partial<NewsArticle> = {}): NewsArticle => ({
  _id: 'article-1',
  title: 'Test Article',
  subtitle: 'A short subtitle',
  featured: false,
  slug: { current: 'test-article' },
  publishedAt: '2025-01-15T00:00:00Z',
  categories: [],
  ...overrides,
})

// ─── getBodyText ─────────────────────────────────────────────────────────────

describe('getBodyText', () => {
  it('returns empty string for undefined body', () => {
    expect(getBodyText(undefined)).toBe('')
  })

  it('returns empty string for empty array', () => {
    expect(getBodyText([])).toBe('')
  })

  it('returns text from a single block with one span', () => {
    const body = [{ children: [{ text: 'Hello world' }] }]
    expect(getBodyText(body)).toBe('Hello world')
  })

  it('joins multiple spans within a block with spaces', () => {
    const body = [{ children: [{ text: 'Hello' }, { text: 'world' }] }]
    expect(getBodyText(body)).toBe('Hello world')
  })

  it('joins multiple blocks with double newlines', () => {
    const body = [
      { children: [{ text: 'First block' }] },
      { children: [{ text: 'Second block' }] },
    ]
    expect(getBodyText(body)).toBe('First block\n\nSecond block')
  })

  it('handles blocks with no children (returns empty string for that block)', () => {
    const body = [
      { children: undefined },
      { children: [{ text: 'Content' }] },
    ]
    expect(getBodyText(body)).toBe('Content')
  })

  it('handles spans with undefined text (empty string, trimmed from output)', () => {
    // undefined || '' → '', joined with 'Hello' → ' Hello', then trim() → 'Hello'
    const body = [{ children: [{ text: undefined as unknown as string }, { text: 'Hello' }] }]
    expect(getBodyText(body)).toBe('Hello')
  })

  it('trims leading and trailing whitespace from the result', () => {
    const body = [{ children: [{ text: '  spaced content  ' }] }]
    expect(getBodyText(body)).toBe('spaced content')
  })

  it('handles a block with an empty children array', () => {
    const body = [{ children: [] }, { children: [{ text: 'Only block' }] }]
    expect(getBodyText(body)).toBe('Only block')
  })

  it('handles all blocks having no text (returns empty string)', () => {
    const body = [{ children: undefined }, { children: [] }]
    expect(getBodyText(body)).toBe('')
  })
})

// ─── fetchNewsArticles ────────────────────────────────────────────────────────

describe('fetchNewsArticles', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockState.isSanityConfigured = false
    mockState.sanityClient = null
    mockFetch.mockReset()
  })

  it('returns empty array when sanity is not configured', async () => {
    expect(await fetchNewsArticles()).toEqual([])
  })

  it('returns empty array when sanityClient is null even if isSanityConfigured is true', async () => {
    mockState.isSanityConfigured = true
    mockState.sanityClient = null
    expect(await fetchNewsArticles()).toEqual([])
  })

  it('calls sanityClient.fetch once', async () => {
    mockFetch.mockResolvedValue([])
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    await fetchNewsArticles()
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('returns empty array when fetch resolves to null', async () => {
    mockFetch.mockResolvedValue(null)
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    expect(await fetchNewsArticles()).toEqual([])
  })

  it('returns empty array when fetch resolves to empty array', async () => {
    mockFetch.mockResolvedValue([])
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    expect(await fetchNewsArticles()).toEqual([])
  })

  it('returns articles when fetch succeeds', async () => {
    const article = makeArticle()
    mockFetch.mockResolvedValue([article])
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const result = await fetchNewsArticles()
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe('article-1')
  })

  it('returns empty array and logs error when fetch throws', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockRejectedValue(new Error('Network error'))
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    expect(await fetchNewsArticles()).toEqual([])
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Sanity] fetchNewsArticles failed',
      expect.any(Error)
    )
    consoleSpy.mockRestore()
  })

  // ── featured normalization ──

  it('keeps featured=true when article.featured is true', async () => {
    mockFetch.mockResolvedValue([makeArticle({ featured: true })])
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const [result] = await fetchNewsArticles()
    expect(result.featured).toBe(true)
  })

  it('keeps featured=false when article.featured is false and no featured category', async () => {
    mockFetch.mockResolvedValue([makeArticle({ featured: false, categories: [{ title: 'General' }] })])
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const [result] = await fetchNewsArticles()
    expect(result.featured).toBe(false)
  })

  it('sets featured=true when categories contain "featured" (lowercase)', async () => {
    mockFetch.mockResolvedValue([
      makeArticle({ featured: false, categories: [{ title: 'featured' }] }),
    ])
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const [result] = await fetchNewsArticles()
    expect(result.featured).toBe(true)
  })

  it('sets featured=true when categories contain "Featured" (title case)', async () => {
    mockFetch.mockResolvedValue([
      makeArticle({ featured: false, categories: [{ title: 'Featured' }] }),
    ])
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const [result] = await fetchNewsArticles()
    expect(result.featured).toBe(true)
  })

  it('sets featured=true when category title has surrounding whitespace', async () => {
    mockFetch.mockResolvedValue([
      makeArticle({ featured: false, categories: [{ title: '  FEATURED  ' }] }),
    ])
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const [result] = await fetchNewsArticles()
    expect(result.featured).toBe(true)
  })

  it('sets featured=true when article.featured is false but category matches', async () => {
    mockFetch.mockResolvedValue([
      makeArticle({ featured: false, categories: [{ title: 'featured' }] }),
    ])
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const [result] = await fetchNewsArticles()
    expect(result.featured).toBe(true)
  })

  // ── sorting ──

  it('places featured articles before non-featured ones', async () => {
    const nonFeatured = makeArticle({ _id: 'b', featured: false, publishedAt: '2025-06-01T00:00:00Z' })
    const featured = makeArticle({ _id: 'a', featured: true, publishedAt: '2025-01-01T00:00:00Z' })
    mockFetch.mockResolvedValue([nonFeatured, featured])
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const result = await fetchNewsArticles()
    expect(result[0]._id).toBe('a')
    expect(result[1]._id).toBe('b')
  })

  it('sorts by publishedAt descending within the same featured group', async () => {
    const older = makeArticle({ _id: 'old', publishedAt: '2025-01-01T00:00:00Z' })
    const newer = makeArticle({ _id: 'new', publishedAt: '2025-06-01T00:00:00Z' })
    mockFetch.mockResolvedValue([older, newer])
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const result = await fetchNewsArticles()
    expect(result[0]._id).toBe('new')
    expect(result[1]._id).toBe('old')
  })

  it('puts articles with no publishedAt after dated articles in the same group', async () => {
    const withDate = makeArticle({ _id: 'dated', publishedAt: '2025-01-01T00:00:00Z' })
    const noDate = makeArticle({ _id: 'nodated', publishedAt: undefined })
    mockFetch.mockResolvedValue([noDate, withDate])
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const result = await fetchNewsArticles()
    expect(result[0]._id).toBe('dated')
    expect(result[1]._id).toBe('nodated')
  })

  it('featured + newer date beats featured + older date', async () => {
    const featuredOld = makeArticle({ _id: 'f-old', featured: true, publishedAt: '2024-01-01T00:00:00Z' })
    const featuredNew = makeArticle({ _id: 'f-new', featured: true, publishedAt: '2025-06-01T00:00:00Z' })
    mockFetch.mockResolvedValue([featuredOld, featuredNew])
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const result = await fetchNewsArticles()
    expect(result[0]._id).toBe('f-new')
    expect(result[1]._id).toBe('f-old')
  })

  it('does not mutate the original array returned by fetch', async () => {
    const articles = [
      makeArticle({ _id: 'b', featured: false }),
      makeArticle({ _id: 'a', featured: true }),
    ]
    mockFetch.mockResolvedValue(articles)
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    await fetchNewsArticles()
    expect(articles[0]._id).toBe('b')
  })
})

// ─── fetchNewsArticleBySlug ───────────────────────────────────────────────────

describe('fetchNewsArticleBySlug', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockState.isSanityConfigured = false
    mockState.sanityClient = null
    mockFetch.mockReset()
  })

  it('returns null when sanity is not configured', async () => {
    expect(await fetchNewsArticleBySlug('any-slug')).toBeNull()
  })

  it('returns null when sanityClient is null even if isSanityConfigured is true', async () => {
    mockState.isSanityConfigured = true
    mockState.sanityClient = null
    expect(await fetchNewsArticleBySlug('any-slug')).toBeNull()
  })

  it('passes the slug as a parameter to sanityClient.fetch', async () => {
    mockFetch.mockResolvedValue(null)
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    await fetchNewsArticleBySlug('my-article')
    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), { slug: 'my-article' })
  })

  it('returns null when fetch resolves to null (article not found)', async () => {
    mockFetch.mockResolvedValue(null)
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    expect(await fetchNewsArticleBySlug('missing')).toBeNull()
  })

  it('returns the normalized article when found', async () => {
    const article = makeArticle({ slug: { current: 'test-article' } })
    mockFetch.mockResolvedValue(article)
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const result = await fetchNewsArticleBySlug('test-article')
    expect(result).not.toBeNull()
    expect(result!._id).toBe('article-1')
  })

  it('preserves all article fields on the returned result', async () => {
    const article = makeArticle({
      title: 'My Title',
      subtitle: 'My Subtitle',
      source: 'Reuters',
      body: [{ children: [{ text: 'Body text' }] }],
    })
    mockFetch.mockResolvedValue(article)
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const result = await fetchNewsArticleBySlug('test-article')
    expect(result!.title).toBe('My Title')
    expect(result!.subtitle).toBe('My Subtitle')
    expect(result!.source).toBe('Reuters')
  })

  it('normalizes featured=true from article.featured flag', async () => {
    mockFetch.mockResolvedValue(makeArticle({ featured: true }))
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const result = await fetchNewsArticleBySlug('test-article')
    expect(result!.featured).toBe(true)
  })

  it('normalizes featured=true from "featured" category', async () => {
    mockFetch.mockResolvedValue(
      makeArticle({ featured: false, categories: [{ title: 'Featured' }] })
    )
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const result = await fetchNewsArticleBySlug('test-article')
    expect(result!.featured).toBe(true)
  })

  it('keeps featured=false when neither flag nor category triggers it', async () => {
    mockFetch.mockResolvedValue(
      makeArticle({ featured: false, categories: [{ title: 'General' }] })
    )
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    const result = await fetchNewsArticleBySlug('test-article')
    expect(result!.featured).toBe(false)
  })

  it('returns null and logs error when fetch throws', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockRejectedValue(new Error('Timeout'))
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    expect(await fetchNewsArticleBySlug('test-article')).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Sanity] fetchNewsArticleBySlug failed',
      expect.any(Error)
    )
    consoleSpy.mockRestore()
  })

  it('calls fetch exactly once per invocation', async () => {
    mockFetch.mockResolvedValue(null)
    mockState.isSanityConfigured = true
    mockState.sanityClient = { fetch: mockFetch }
    await fetchNewsArticleBySlug('slug-a')
    expect(mockFetch).toHaveBeenCalledOnce()
  })
})
