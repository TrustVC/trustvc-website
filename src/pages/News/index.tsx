import clsx from 'clsx'
import { useNewsList } from '../../hooks/useNewsList'
import type { NewsListHookResult } from '../../types/news'
import NewsHeader from './components/NewsHeader'
import NewsLoadingState from './components/NewsLoadingState'
import NewsArticlesContent from './components/NewsArticlesContent'

interface NewsProps {
  isDarkMode: boolean
}

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
          <NewsLoadingState isDarkMode={isDarkMode} />
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
        )}
      </div>
    </section>
  )
}

export default News
