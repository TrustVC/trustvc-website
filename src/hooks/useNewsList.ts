import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchNewsArticles, getBodyText } from '../lib/sanity/news'
import { getSanityImageUrl } from '../lib/sanity/client'
import type { NewsArticle, NewsListHookResult } from '../types/news'

const GRID_CARD_ESTIMATED_HEIGHT = 350

const getReadTimeText = (body?: NewsArticle['body']) => {
  const words = getBodyText(body).split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}

export const useNewsList = (): NewsListHookResult => {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreAnchorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      try {
        const data = await fetchNewsArticles()
        if (!isActive) return
        setArticles(data)
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

  const featuredArticle = useMemo(() => articles[0], [articles])
  const articleGrid = useMemo(() => articles.slice(1), [articles])
  const visibleArticles = useMemo(
    () => articleGrid.slice(0, visibleCount),
    [articleGrid, visibleCount]
  )
  const hasMoreArticles = visibleCount < articleGrid.length

  const featuredImageUrl: string | null = useMemo(
    () =>
      featuredArticle
        ? getSanityImageUrl(featuredArticle.mainImage)
            ?.width(1200)
            .height(650)
            .url() ?? null
        : null,
    [featuredArticle]
  )

  useEffect(() => {
    if (!articleGrid.length) {
      setVisibleCount(0)
      return
    }

    const columns = window.innerWidth >= 768 ? 2 : 1
    const rowsToFillViewport = Math.max(
      1,
      Math.ceil(window.innerHeight / GRID_CARD_ESTIMATED_HEIGHT)
    )
    const initialCount = Math.min(articleGrid.length, rowsToFillViewport * columns)
    setVisibleCount(initialCount)
  }, [articleGrid])

  useEffect(() => {
    if (!hasMoreArticles || isLoadingMore || !loadMoreAnchorRef.current) return

    const columns = window.innerWidth >= 768 ? 2 : 1
    const batchSize = Math.max(columns, columns * 2)

    const observer = new IntersectionObserver(
      entries => {
        const firstEntry = entries[0]
        if (!firstEntry?.isIntersecting) return

        setIsLoadingMore(true)
        window.setTimeout(() => {
          setVisibleCount(prev => Math.min(prev + batchSize, articleGrid.length))
          setIsLoadingMore(false)
        }, 350)
      },
      { rootMargin: '200px 0px' }
    )

    observer.observe(loadMoreAnchorRef.current)
    return () => observer.disconnect()
  }, [articleGrid.length, hasMoreArticles, isLoadingMore])

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
