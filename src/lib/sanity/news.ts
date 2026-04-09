import type { NewsArticle } from '../../types/news'
import { isSanityConfigured, sanityClient } from './client'

const NEWS_LIST_QUERY = `*[_type == "post"] | order(publishedAt desc){
  _id,
  title,
  subtitle,
  "featured": coalesce(featured, false),
  slug,
  mainImage,
  publishedAt,
  "updatedAt": _updatedAt,
  source,
  body,
  author->{name, image},
  categories[]->{title}
}`

const NEWS_LIST_PAGED_QUERY = `*[_type == "post" && (!defined($excludeId) || _id != $excludeId)] | order(publishedAt desc)[$offset...$end]{
  _id,
  title,
  subtitle,
  "featured": coalesce(featured, false),
  slug,
  mainImage,
  publishedAt,
  "updatedAt": _updatedAt,
  source,
  body,
  author->{name, image},
  categories[]->{title}
}`

const NEWS_COUNT_QUERY = `count(*[_type == "post" && (!defined($excludeId) || _id != $excludeId)])`

const LATEST_FEATURED_POST_QUERY = `*[_type == "post" && featured == true && defined(publishedAt)] | order(publishedAt desc, _updatedAt desc)[0]{
  _id,
  title,
  subtitle,
  "featured": coalesce(featured, false),
  slug,
  mainImage,
  publishedAt,
  "updatedAt": _updatedAt,
  source,
  body,
  author->{name, image},
  categories[]->{title}
}`

const NEWS_DETAIL_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  subtitle,
  "featured": coalesce(featured, false),
  slug,
  mainImage,
  publishedAt,
  "updatedAt": _updatedAt,
  source,
  body,
  author->{name, image},
  categories[]->{title}
}`

const isFeaturedPost = (article: NewsArticle) => Boolean(article.featured)

const normalizeFeatured = (article: NewsArticle): NewsArticle => ({
  ...article,
  featured: isFeaturedPost(article),
})

const sortFeaturedFirst = (articles: NewsArticle[]) =>
  [...articles].sort((a, b) => {
    if (Boolean(b.featured) !== Boolean(a.featured)) {
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
    }

    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return bTime - aTime
  })

export const fetchNewsArticles = async () => {
  if (!isSanityConfigured || !sanityClient) return []

  try {
    const data = await sanityClient.fetch<NewsArticle[]>(NEWS_LIST_QUERY)
    const normalized = (data ?? []).map(normalizeFeatured)
    return sortFeaturedFirst(normalized)
  } catch (err) {
    console.error('[Sanity] fetchNewsArticles failed', err)
    return []
  }
}

export const fetchLatestFeaturedNewsArticle = async () => {
  if (!isSanityConfigured || !sanityClient) return null

  try {
    const data = await sanityClient.fetch<NewsArticle | null>(
      LATEST_FEATURED_POST_QUERY
    )
    return data ? normalizeFeatured(data) : null
  } catch (err) {
    console.error('[Sanity] fetchLatestFeaturedNewsArticle failed', err)
    return null
  }
}

export const fetchNewsArticleCount = async (excludeId?: string) => {
  if (!isSanityConfigured || !sanityClient) return 0

  try {
    const count = await sanityClient.fetch<number>(NEWS_COUNT_QUERY, {
      excludeId,
    })
    return typeof count === 'number' ? count : 0
  } catch (err) {
    console.error('[Sanity] fetchNewsArticleCount failed', err)
    return 0
  }
}

export const fetchNewsArticlesPage = async (
  offset: number,
  limit: number,
  excludeId?: string
) => {
  if (!isSanityConfigured || !sanityClient) return []

  const safeOffset = Math.max(0, offset)
  const safeLimit = Math.max(1, limit)

  try {
    const data = await sanityClient.fetch<NewsArticle[]>(
      NEWS_LIST_PAGED_QUERY,
      {
        offset: safeOffset,
        end: safeOffset + safeLimit,
        excludeId,
      }
    )
    return (data ?? []).map(normalizeFeatured)
  } catch (err) {
    console.error('[Sanity] fetchNewsArticlesPage failed', err)
    return []
  }
}

export const fetchNewsArticleBySlug = async (slug: string) => {
  if (!isSanityConfigured || !sanityClient) return null

  try {
    const data = await sanityClient.fetch<NewsArticle | null>(
      NEWS_DETAIL_QUERY,
      {
        slug,
      }
    )
    return data ? normalizeFeatured(data) : null
  } catch (err) {
    console.error('[Sanity] fetchNewsArticleBySlug failed', err)
    return null
  }
}

export const getBodyText = (body?: NewsArticle['body']) => {
  if (!body?.length) return ''

  return body
    .map(block => block.children?.map(span => span.text || '').join(' ') || '')
    .join('\n\n')
    .trim()
}
