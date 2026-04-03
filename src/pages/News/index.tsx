import { lazy, Suspense } from 'react'
import clsx from 'clsx'
import { useNewsList } from '../../hooks/useNewsList'
import type { NewsListHookResult } from '../../types/news'
import NewsHeader from './components/NewsHeader'

const NewsLoadingState = lazy(() => import('./components/NewsLoadingState'))
const NewsArticlesContent = lazy(
  () => import('./components/NewsArticlesContent')
)

interface NewsProps {
  isDarkMode: boolean
}

const NewsListFallback = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div
    className={`space-y-4 animate-pulse rounded-2xl p-6 border ${
      isDarkMode
        ? 'border-[#3D444D] bg-[#1E2026]/50'
        : 'border-[#DEE4E9] bg-white/50'
    }`}
    aria-busy="true"
    aria-label="Loading content"
  >
    <div
      className={`h-48 rounded-xl ${isDarkMode ? 'bg-[#2A313B]' : 'bg-[#E6EBFF]'}`}
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        className={`h-52 rounded-xl ${isDarkMode ? 'bg-[#2A313B]' : 'bg-[#E6EBFF]'}`}
      />
      <div
        className={`h-52 rounded-xl ${isDarkMode ? 'bg-[#2A313B]' : 'bg-[#E6EBFF]'}`}
      />
    </div>
  </div>
)

const News = ({ isDarkMode }: NewsProps) => {
  const {
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
  }: NewsListHookResult = useNewsList()

  return (
    <section
      className={`news-page w-full px-4 pt-[120px] pb-16 flex justify-center bg-transparent ${
        isDarkMode ? 'news-page--dark' : 'news-page--light'
      }`}
    >
      <div className="w-full max-w-[1280px]">
        <NewsHeader isDarkMode={isDarkMode} />

        {loading ? (
          <Suspense fallback={<NewsListFallback isDarkMode={isDarkMode} />}>
            <NewsLoadingState isDarkMode={isDarkMode} />
          </Suspense>
        ) : articles.length === 0 ? (
          <div
            className={clsx(
              'rounded-2xl p-10 text-center border',
              isDarkMode
                ? 'bg-[#1E2026]/70 border-[#3D444D] text-[#A9B2BB]'
                : 'bg-white/80 border-[#DEE4E9] text-[#5B6571]'
            )}
          >
            No posts published yet.
          </div>
        ) : (
          <Suspense fallback={<NewsListFallback isDarkMode={isDarkMode} />}>
            <NewsArticlesContent
              isDarkMode={isDarkMode}
              featuredArticle={featuredArticle}
              featuredImageUrl={featuredImageUrl}
              visibleArticles={visibleArticles}
              articleGrid={articleGrid}
              isLoadingMore={isLoadingMore}
              hasMoreArticles={hasMoreArticles}
              loadMoreAnchorRef={loadMoreAnchorRef}
              getReadTimeText={getReadTimeText}
            />
          </Suspense>
        )}
      </div>
    </section>
  )
}

export default News
