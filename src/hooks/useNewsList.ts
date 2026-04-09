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

const normalizeId = (id?: string) => (id ? id.replace(/^drafts\./, '') : '')

export const useNewsList = (): NewsListHookResult => {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [featuredArticle, setFeaturedArticle] = useState<NewsArticle | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [fetchedCount, setFetchedCount] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const isLoadingMoreRef = useRef(false)
  const loadMoreAnchorRef = useRef<HTMLDivElement | null>(null)
  const featuredId = featuredArticle?._id
  const featuredSlug = featuredArticle?.slug?.current

  const loadNextPage = useCallback(
    async (offset: number) => {
      const nextBatchRaw = await fetchNewsArticlesPage(offset, NEWS_PAGE_SIZE)
      setFetchedCount(prev => prev + nextBatchRaw.length)
      const normalizedFeaturedId = normalizeId(featuredId)
      const nextBatch = nextBatchRaw.filter(
        article =>
          hasSlug(article) &&
          normalizeId(article._id) !== normalizedFeaturedId &&
          article.slug?.current !== featuredSlug
      )
      setArticles(prev => {
        const existingIds = new Set(prev.map(article => article._id))
        const deduped = nextBatch.filter(
          article => !existingIds.has(article._id)
        )
        return [...prev, ...deduped]
      })
    },
    [featuredId, featuredSlug]
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

        const [count, firstPage] = await Promise.all([
          fetchNewsArticleCount(),
          fetchNewsArticlesPage(0, NEWS_PAGE_SIZE),
        ])
        if (!isActive) return
        setTotalCount(count)
        setFetchedCount(firstPage.length)
        const featuredSlugFromLatest = latestFeatured?.slug?.current
        setArticles(
          firstPage.filter(
            article =>
              hasSlug(article) &&
              article.slug?.current !== featuredSlugFromLatest
          )
        )
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
  const hasMoreArticles = fetchedCount < totalCount

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
          loadNextPage(fetchedCount).finally(() => {
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
  }, [fetchedCount, hasMoreArticles, loadNextPage])

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
