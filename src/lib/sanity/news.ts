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
  author->{name},
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
  author->{name},
  categories[]->{title}
}`

export const fetchNewsArticles = async () => {
  if (!isSanityConfigured || !sanityClient) return []

  try {
    const data = await sanityClient.fetch<NewsArticle[]>(NEWS_LIST_QUERY)
    return data ?? []
  } catch (err) {
    console.error('[Sanity] fetchNewsArticles failed', err)
    return []
  }
}

export const fetchNewsArticleBySlug = async (slug: string) => {
  if (!isSanityConfigured || !sanityClient) return null

  try {
    const data = await sanityClient.fetch<NewsArticle | null>(NEWS_DETAIL_QUERY, {
      slug,
    })
    return data
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
