import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  fetchNewsArticleBySlug,
  fetchNewsArticles,
  getBodyText,
} from '../lib/sanity/news'
import { getSanityImageUrl } from '../lib/sanity/client'
import type { NewsArticle, NewsDetailHookResult } from '../types/news'

const getReadTimeText = (body?: NewsArticle['body']) => {
  const words = getBodyText(body).split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}


export const useNewsDetail = (slug?: string): NewsDetailHookResult => {
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [nextArticle, setNextArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      if (!slug) {
        if (isActive) {
          setArticle(null)
          setNextArticle(null)
          setLoading(false)
        }
        return
      }

      if (isActive) {
        setLoading(true)
      }

      try {
        const [data, list] = await Promise.all([
          fetchNewsArticleBySlug(slug),
          fetchNewsArticles(),
        ])

        if (!isActive) return

        setArticle(data)

        if (data?.slug?.current && Array.isArray(list) && list.length) {
          const idx = list.findIndex(a => a.slug?.current === data.slug?.current)
          if (idx >= 0 && idx < list.length - 1) {
            setNextArticle(list[idx + 1])
          } else {
            setNextArticle(null)
          }
        } else {
          setNextArticle(null)
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      isActive = false
    }
  }, [slug])

  const subtitleText: string = useMemo(
    () => article?.subtitle || '',
    [article]
  )

  const articleImageUrl: string | null = useMemo(
    () =>
      article
        ? getSanityImageUrl(article.mainImage)?.width(1300).height(700).url() ?? null
        : null,
    [article]
  )
  const nextArticleImageUrl: string | null = useMemo(
    () =>
      nextArticle
        ? getSanityImageUrl(nextArticle.mainImage)?.width(600).height(320).url() ?? null
        : null,
    [nextArticle]
  )
  const authorImageUrl: string | null = useMemo(
    () =>
      article?.author?.image
        ? getSanityImageUrl(article.author.image)?.width(96).height(96).url() ?? null
        : null,
    [article]
  )
  const publishedDateLabel: string = useMemo(
    () =>
      article?.publishedAt ? format(new Date(article.publishedAt), 'MMMM d, yyyy') : 'Recent',
    [article?.publishedAt]
  )
  const updatedDateLabel: string | null = useMemo(
    () => (article?.updatedAt ? format(new Date(article.updatedAt), 'MMMM d, yyyy') : null),
    [article?.updatedAt]
  )
  const showUpdatedDate = Boolean(
    updatedDateLabel &&
      article?.publishedAt &&
      updatedDateLabel !== publishedDateLabel
  )
  const articleReadTime: string = useMemo(
    () => (article ? getReadTimeText(article.body) : '1 min read'),
    [article]
  )
  const nextArticleReadTime: string = useMemo(
    () => (nextArticle ? getReadTimeText(nextArticle.body) : '1 min read'),
    [nextArticle]
  )

  return {
    article,
    nextArticle,
    loading,
    subtitleText,
    articleImageUrl,
    nextArticleImageUrl,
    authorImageUrl,
    publishedDateLabel,
    updatedDateLabel,
    showUpdatedDate,
    articleReadTime,
    nextArticleReadTime,
  }
}
