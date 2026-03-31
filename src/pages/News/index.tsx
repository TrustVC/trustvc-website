import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fetchNewsArticles, getBodyText } from '../../lib/sanity/news'
import { getSanityImageUrl } from '../../lib/sanity/client'
import type { NewsArticle } from '../../types/news'

interface NewsProps {
  isDarkMode: boolean
}

const ShimmerPostCards = lazy(
  () => import('../../components/common/ShimmerPostCards')
)

const GRID_CARD_ESTIMATED_HEIGHT = 350

const getReadTimeText = (body?: NewsArticle['body']) => {
  const words = getBodyText(body).split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}

const News = ({ isDarkMode }: NewsProps) => {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreAnchorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const load = async () => {
      const data = await fetchNewsArticles()
      setArticles(data)
      setLoading(false)
    }

    load()
  }, [])

  const featuredArticle = useMemo(() => articles[0], [articles])
  const articleGrid = useMemo(() => articles.slice(1), [articles])
  const visibleArticles = useMemo(
    () => articleGrid.slice(0, visibleCount),
    [articleGrid, visibleCount]
  )
  const hasMoreArticles = visibleCount < articleGrid.length
  const featuredImageUrl = featuredArticle
    ? getSanityImageUrl(featuredArticle.mainImage)
        ?.width(1200)
        .height(650)
        .url()
    : null

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
    const initialCount = Math.min(
      articleGrid.length,
      rowsToFillViewport * columns
    )
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
          setVisibleCount(prev =>
            Math.min(prev + batchSize, articleGrid.length)
          )
          setIsLoadingMore(false)
        }, 350)
      },
      { rootMargin: '200px 0px' }
    )

    observer.observe(loadMoreAnchorRef.current)
    return () => observer.disconnect()
  }, [articleGrid.length, hasMoreArticles, isLoadingMore])

  return (
    <section
      className={`news-page w-full px-4 pt-[120px] pb-16 flex justify-center bg-transparent ${
        isDarkMode ? 'news-page--dark' : 'news-page--light'
      }`}
    >
      <div className="w-full max-w-[1280px]">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold">
            <span
              style={{
                color: isDarkMode
                  ? '#FFFFFF'
                  : 'var(--Neutral-100-10, #1E2026)',
              }}
            >
              News &amp;{' '}
            </span>
            <span style={{ color: 'var(--Primary-100-60, #686AD2)' }}>
              Updates
            </span>
          </h1>
          <p
            className={`mt-3 text-base sm:text-lg max-w-3xl mx-auto ${
              isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
            }`}
          >
            Stay up to date with the latest TrustVC developments, partnerships,
            and industry insights in the verifiable credentials space.
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Suspense fallback={null}>
              <ShimmerPostCards count={4} isDarkMode={isDarkMode} />
            </Suspense>
          </div>
        ) : articles.length === 0 ? (
          <div
            className={`rounded-2xl p-10 text-center border ${
              isDarkMode
                ? 'bg-[#1E2026]/70 border-[#3D444D] text-[#A9B2BB]'
                : 'bg-white/80 border-[#DEE4E9] text-[#5B6571]'
            }`}
          >
            No posts published yet.
          </div>
        ) : (
          <div className="space-y-4">
            {featuredArticle && (
              <article
                className={`grid grid-cols-1 lg:grid-cols-2 lg:items-stretch rounded-2xl overflow-hidden border shadow-[0_8px_32px_rgba(104,106,210,0.15)] ${
                  isDarkMode
                    ? 'bg-[#1E2026]/80 border-[#3D444D]'
                    : 'bg-white/80 border-[#DEE4E9]'
                }`}
              >
                {featuredImageUrl && (
                  <div className="relative h-full">
                    <img
                      src={featuredImageUrl}
                      alt={featuredArticle.title}
                      className="w-full h-full min-h-[280px] md:min-h-[340px] object-cover"
                    />
                    {featuredArticle.featured && (
                      <span
                        className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-bold"
                        style={{
                          background:
                            'linear-gradient(105.36deg, #3C83F6 0%, #6467F2 100%)',
                        }}
                      >
                        Featured
                      </span>
                    )}
                  </div>
                )}
                <div className="p-5 md:p-8 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
                    {featuredArticle.categories?.[0]?.title && (
                      <span className="news-category-chip inline-flex items-center gap-1 px-2 py-1 rounded-full border border-[#A9B2BB54]">
                        <img
                          src={
                            isDarkMode
                              ? '/icons/category-dark.svg'
                              : '/icons/category-light.svg'
                          }
                          alt=""
                          aria-hidden="true"
                          className="w-3 h-3"
                        />
                        {featuredArticle.categories[0].title}
                      </span>
                    )}
                    <span className="news-meta-text inline-flex items-center gap-1">
                      <img
                        src="/images/networks/clock.svg"
                        alt=""
                        aria-hidden="true"
                        className="w-3.5 h-3.5"
                      />
                      {getReadTimeText(featuredArticle.body)}
                    </span>
                    <span className="news-meta-text inline-flex items-center gap-1">
                      <img
                        src="/images/networks/calendar.svg"
                        alt=""
                        aria-hidden="true"
                        className="w-3.5 h-3.5"
                      />
                      {featuredArticle.publishedAt
                        ? format(
                            new Date(featuredArticle.publishedAt),
                            'MMMM d, yyyy'
                          )
                        : 'Recent'}
                    </span>
                  </div>
                  <h2
                    className={`text-[24px] font-bold leading-[133%] ${
                      isDarkMode ? 'text-[#E6EBFF]' : 'text-[#1E2026]'
                    }`}
                  >
                    {featuredArticle.title}
                  </h2>
                  <p
                    className={`mt-3 text-[18px] leading-[136%] font-medium line-clamp-3 ${
                      isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
                    }`}
                    style={{ fontFamily: 'Avenir, Gilroy, sans-serif' }}
                  >
                    {featuredArticle.subtitle ||
                      getBodyText(featuredArticle.body)}
                  </p>
                  <Link
                    to={`/news-updates/${featuredArticle.slug?.current || ''}`}
                    className="mt-6 inline-flex w-fit items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                    style={{ background: 'var(--Primary-100-50, #5B5BB3)' }}
                  >
                    <span>Read Full Article</span>
                    <img
                      src="/images/networks/forward-white.svg"
                      alt=""
                      aria-hidden="true"
                      className="h-5"
                    />
                  </Link>
                </div>
              </article>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleArticles.map(article => {
                const imageUrl = getSanityImageUrl(article.mainImage)
                  ?.width(900)
                  .height(420)
                  .url()

                return (
                  <Link
                    key={article._id}
                    to={`/news-updates/${article.slug?.current || ''}`}
                    className={`rounded-2xl overflow-hidden border shadow-[0_8px_24px_rgba(104,106,210,0.15)] transition-transform hover:-translate-y-0.5 ${
                      isDarkMode
                        ? 'bg-[#1E2026]/80 border-[#3D444D]'
                        : 'bg-white/80 border-[#DEE4E9]'
                    }`}
                  >
                    {imageUrl && (
                      <div className="relative">
                        <img
                          src={imageUrl}
                          alt={article.title}
                          className="w-full h-[210px] object-cover"
                        />
                        {!!article.categories?.length && (
                          <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-2 max-w-[85%]">
                            {article.categories
                              .filter(category => !!category?.title)
                              .map((category, index) => (
                                <div
                                  key={`${article._id}-${category.title}-${index}`}
                                  className="news-category-chip inline-flex items-center gap-1 px-3 py-1 rounded-full border bg-white/95 border-transparent"
                                >
                                  <img
                                    src={
                                      isDarkMode
                                        ? '/icons/category-dark.svg'
                                        : '/icons/category-light.svg'
                                    }
                                    alt=""
                                    aria-hidden="true"
                                    className="w-3 h-3"
                                  />
                                  {category.title}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-4 mb-2">
                        <span className="news-meta-text inline-flex items-center gap-1">
                          <img
                            src="/images/networks/calendar.svg"
                            alt=""
                            aria-hidden="true"
                            className="w-3.5 h-3.5"
                          />
                          {article.publishedAt
                            ? format(
                                new Date(article.publishedAt),
                                'MMMM d, yyyy'
                              )
                            : 'Recent'}
                        </span>
                        <span className="news-meta-text inline-flex items-center gap-1">
                          <img
                            src="/images/networks/clock.svg"
                            alt=""
                            aria-hidden="true"
                            className="w-3.5 h-3.5"
                          />
                          {getReadTimeText(article.body)}
                        </span>
                      </div>
                      <h3
                        className={`text-xl font-bold leading-tight ${
                          isDarkMode ? 'text-[#E6EBFF]' : 'text-[#1E2026]'
                        }`}
                      >
                        {article.title}
                      </h3>
                      <p
                        className={`mt-2 text-sm line-clamp-2 ${
                          isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
                        }`}
                      >
                        {article.subtitle || getBodyText(article.body)}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#5B5BB3]">
                        Read More
                        <img
                          src="/images/networks/forward.svg"
                          alt=""
                          aria-hidden="true"
                          className="w-4 h-4"
                        />
                      </span>
                    </div>
                  </Link>
                )
              })}

              {isLoadingMore && (
                <Suspense fallback={null}>
                  <ShimmerPostCards
                    count={Math.min(
                      2,
                      articleGrid.length - visibleArticles.length
                    )}
                    isDarkMode={isDarkMode}
                  />
                </Suspense>
              )}
            </div>

            {hasMoreArticles && (
              <div ref={loadMoreAnchorRef} className="h-8 w-full" />
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default News
