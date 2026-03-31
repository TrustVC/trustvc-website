import groq from 'groq'
import type { NewsArticle } from '../../types/news'
import { isSanityConfigured, sanityClient } from './client'

const NEWS_LIST_QUERY = groq`*[_type == "post"] | order(featured desc, publishedAt desc)[0...20]{
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

const NEWS_DETAIL_QUERY = groq`*[_type == "post" && slug.current == $slug][0]{
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

const isFeaturedPost = (article: NewsArticle) =>
  Boolean(article.featured) ||
  Boolean(
    article.categories?.some(
      category => category.title?.toLowerCase().trim() === 'featured'
    )
  )

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
