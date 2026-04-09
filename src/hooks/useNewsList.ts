import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchLatestFeaturedNewsArticle,
  fetchNewsArticleCount,
  fetchNewsArticlesPage,
  getBodyText,
} from '../lib/sanity/news'
import { getSanityImageUrl } from '../lib/sanity/client'
import type { NewsArticle, NewsListHookResult } from '../types/news'

const NEWS_PAGE_SIZE = 5

const getReadTimeText = (body?: NewsArticle['body']) => {
  const words = getBodyText(body).split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}

const hasSlug = (
  article: NewsArticle
): article is NewsArticle & { slug: { current: string } } =>
  Boolean(article.slug?.current)

export const useNewsList = (): NewsListHookResult => {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [featuredArticle, setFeaturedArticle] = useState<NewsArticle | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const isLoadingMoreRef = useRef(false)
  const loadMoreAnchorRef = useRef<HTMLDivElement | null>(null)

  const loadNextPage = useCallback(
    async (offset: number) => {
      const nextBatch = (
        await fetchNewsArticlesPage(
          offset,
          NEWS_PAGE_SIZE,
          featuredArticle?._id
        )
      ).filter(hasSlug)
      setArticles(prev => {
        const existingIds = new Set(prev.map(article => article._id))
        const deduped = nextBatch.filter(
          article => !existingIds.has(article._id)
        )
        return [...prev, ...deduped]
      })
    },
    [featuredArticle?._id]
  )

  useEffect(() => {
    let isActive = true

    const load = async () => {
      try {
        const latestFeatured = await fetchLatestFeaturedNewsArticle()
        if (!isActive) return
        setFeaturedArticle(
          latestFeatured && hasSlug(latestFeatured) ? latestFeatured : null
        )

        const featuredId = latestFeatured?._id
        const [count, firstPage] = await Promise.all([
          fetchNewsArticleCount(featuredId),
          fetchNewsArticlesPage(0, NEWS_PAGE_SIZE, featuredId),
        ])
        if (!isActive) return
        setTotalCount(count)
        setArticles(firstPage.filter(hasSlug))
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
  }, [])

  const articleGrid = useMemo(() => articles, [articles])
  const visibleArticles = articleGrid
  const hasMoreArticles = articles.length < totalCount

  const featuredImageUrl: string | null = useMemo(
    () =>
      featuredArticle
        ? (getSanityImageUrl(featuredArticle.mainImage)
            ?.width(1200)
            .height(650)
            .url() ?? null)
        : null,
    [featuredArticle]
  )

  useEffect(() => {
    if (!hasMoreArticles || !loadMoreAnchorRef.current) return

    let timeoutId: number | null = null

    const observer = new IntersectionObserver(
      entries => {
        const firstEntry = entries[0]
        if (!firstEntry?.isIntersecting || isLoadingMoreRef.current) return

        isLoadingMoreRef.current = true
        setIsLoadingMore(true)
        timeoutId = window.setTimeout(() => {
          loadNextPage(articles.length).finally(() => {
            isLoadingMoreRef.current = false
            setIsLoadingMore(false)
          })
        }, 350)
      },
      { rootMargin: '200px 0px' }
    )

    observer.observe(loadMoreAnchorRef.current)
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
      observer.disconnect()
    }
  }, [articles.length, hasMoreArticles, loadNextPage])

  return {
    articles,
    loading,
    isLoadingMore,
    featuredArticle,
    featuredImageUrl,
    articleGrid,
    visibleArticles,
    hasMoreArticles,
    loadMoreAnchorRef,
    getReadTimeText,
  }
}
