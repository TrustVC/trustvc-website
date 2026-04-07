import type { RefObject } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import clsx from 'clsx'
import ShimmerPostCards from '../../../components/common/ShimmerPostCards'
import { getBodyText } from '../../../lib/sanity/news'
import { getSanityImageUrl } from '../../../lib/sanity/client'
import type { NewsArticle } from '../../../types/news'

interface NewsArticlesContentProps {
  isDarkMode: boolean
  featuredArticle: NewsArticle | null
  featuredImageUrl: string | null
  visibleArticles: NewsArticle[]
  articleGrid: NewsArticle[]
  isLoadingMore: boolean
  hasMoreArticles: boolean
  loadMoreAnchorRef: RefObject<HTMLDivElement>
  getReadTimeText: (body?: NewsArticle['body']) => string
}

const NewsArticlesContent = ({
  isDarkMode,
  featuredArticle,
  featuredImageUrl,
  visibleArticles,
  articleGrid,
  isLoadingMore,
  hasMoreArticles,
  loadMoreAnchorRef,
  getReadTimeText,
}: NewsArticlesContentProps) => {
  const shellSurfaceClass = clsx(
    'rounded-2xl overflow-hidden border',
    isDarkMode
      ? 'bg-[#1E2026]/80 border-[#3D444D]'
      : 'bg-white/80 border-[#DEE4E9]'
  )
  const titleTextClass = clsx(
    'text-[24px] font-bold leading-[133%]',
    isDarkMode ? 'text-[#E6EBFF]' : 'text-[#1E2026]'
  )
  const excerptTextClass = clsx(
    'mt-3 text-[18px] leading-[136%] font-medium line-clamp-3',
    isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
  )
  const cardTitleTextClass = clsx(
    'text-xl font-bold leading-tight',
    isDarkMode ? 'text-[#E6EBFF]' : 'text-[#1E2026]'
  )
  const cardExcerptTextClass = clsx(
    'mt-2 text-sm line-clamp-2',
    isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
  )

  return (
    <div className="space-y-4">
      {featuredArticle && (
        <article
          className={clsx(
            'grid grid-cols-1 lg:items-stretch shadow-[0_8px_32px_rgba(104,106,210,0.15)]',
            featuredImageUrl ? 'lg:grid-cols-2' : 'lg:grid-cols-1',
            shellSurfaceClass
          )}
        >
          {featuredImageUrl && (
            <div className="relative h-full">
              <img
                src={featuredImageUrl}
                alt={featuredArticle.title}
                className="w-full h-full min-h-[280px] md:min-h-[340px] object-cover"
              />
              {featuredArticle.featured && (
                <span className="news-featured-badge absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-bold">
                  Featured
                </span>
              )}
            </div>
          )}
          <div className="p-5 md:p-8 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
              {featuredArticle.categories?.[0]?.title && (
                <span
                  className={clsx(
                    'news-category-chip inline-flex items-center gap-1 px-[12px] py-[4px] rounded-full',
                    isDarkMode
                      ? 'bg-[#353157] text-[#C2C5F0]'
                      : 'bg-[#DFE1FF] text-[#3D444D]'
                  )}
                >
                  {featuredArticle.categories[0].title}
                </span>
              )}
              <span className="news-meta-text inline-flex items-center gap-1">
                <img
                  src="/images/networks/clock.svg"
                  alt=""
                  aria-hidden="true"
                  className="news-meta-icon"
                />
                {getReadTimeText(featuredArticle.body)}
              </span>
              <span className="news-meta-text inline-flex items-center gap-1">
                <img
                  src="/images/networks/calendar.svg"
                  alt=""
                  aria-hidden="true"
                  className="news-meta-icon"
                />
                {(() => {
                  if (!featuredArticle.publishedAt) return 'Recent'
                  const date = new Date(featuredArticle.publishedAt)
                  return isNaN(date.getTime())
                    ? 'Recent'
                    : format(date, 'MMMM d, yyyy')
                })()}
              </span>
            </div>
            <h2 className={titleTextClass}>{featuredArticle.title}</h2>
            <p className={clsx(excerptTextClass, 'news-excerpt-font')}>
              {featuredArticle.subtitle || getBodyText(featuredArticle.body)}
            </p>
            {featuredArticle.slug?.current && (
              <Link
                to={`/news-updates/${featuredArticle.slug.current}`}
                className="news-read-full-btn mt-6 inline-flex w-fit items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                <span>Read Full Article</span>
                <img
                  src="/images/networks/forward-white.svg"
                  alt=""
                  aria-hidden="true"
                  className="h-5"
                />
              </Link>
            )}
          </div>
        </article>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleArticles.map(article => {
          const imageUrl = getSanityImageUrl(article.mainImage)
            ?.width(900)
            ?.height(420)
            ?.url()
          const slug = article.slug?.current
          const cardClassName = clsx(
            'shadow-[0_8px_24px_rgba(104,106,210,0.15)] transition-transform hover:-translate-y-0.5',
            shellSurfaceClass
          )

          const cardBody = (
            <>
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
                            className={clsx(
                              'news-category-chip inline-flex items-center gap-1 px-[12px] py-[4px] rounded-full',
                              isDarkMode
                                ? 'bg-[#1E2026] text-[#C2C9D0]'
                                : 'bg-[#DEE4E9] text-[#30333B]'
                            )}
                          >
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
                      className="news-meta-icon"
                    />
                    {article.publishedAt
                      ? format(new Date(article.publishedAt), 'MMMM d, yyyy')
                      : 'Recent'}
                  </span>
                  <span className="news-meta-text inline-flex items-center gap-1">
                    <img
                      src="/images/networks/clock.svg"
                      alt=""
                      aria-hidden="true"
                      className="news-meta-icon"
                    />
                    {getReadTimeText(article.body)}
                  </span>
                </div>
                <h3 className={cardTitleTextClass}>{article.title}</h3>
                <p className={cardExcerptTextClass}>
                  {article.subtitle || getBodyText(article.body)}
                </p>
                {slug && (
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#5B5BB3]">
                    Read More
                    <img
                      src="/images/networks/forward.svg"
                      alt=""
                      aria-hidden="true"
                      className="w-4 h-4"
                    />
                  </span>
                )}
              </div>
            </>
          )

          return slug ? (
            <Link
              key={article._id}
              to={`/news-updates/${slug}`}
              className={cardClassName}
            >
              {cardBody}
            </Link>
          ) : (
            <div key={article._id} className={cardClassName}>
              {cardBody}
            </div>
          )
        })}

        {isLoadingMore && (
          <ShimmerPostCards
            count={Math.min(
              2,
              Math.max(0, articleGrid.length - visibleArticles.length)
            )}
            isDarkMode={isDarkMode}
          />
        )}
      </div>

      {hasMoreArticles && (
        <div ref={loadMoreAnchorRef} className="h-8 w-full" />
      )}
    </div>
  )
}

export default NewsArticlesContent
