import { lazy, Suspense, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import clsx from 'clsx'
import type { NewsDetailHookResult } from '../../types/news'
import { useNewsDetail } from '../../hooks/useNewsDetail'
import NewsDetailSidebar from './components/NewsDetailSidebar'
import NewsDetailLoadingState from './components/NewsDetailLoadingState'

const NewsDetailBody = lazy(() => import('./components/NewsDetailBody'))
const NewsNextArticleSection = lazy(
  () => import('./components/NewsNextArticleSection')
)

interface NewsDetailProps {
  isDarkMode: boolean
}

const ArticleBodyFallback = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div
    className={`mt-8 max-w-3xl mx-auto space-y-4 animate-pulse min-h-[200px] ${
      isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
    }`}
    aria-busy="true"
    aria-label="Loading article"
  >
    <div
      className={`h-4 rounded w-full ${isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'}`}
    />
    <div
      className={`h-4 rounded w-11/12 ${isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'}`}
    />
    <div
      className={`h-4 rounded w-full ${isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'}`}
    />
    <div
      className={`h-32 rounded-xl mt-6 ${isDarkMode ? 'bg-[#2A313B]' : 'bg-[#E6EBFF]'}`}
    />
  </div>
)

const NextArticleFallback = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div
    className={`news-next-container mt-12 w-full rounded-2xl p-5 sm:p-7 border border-[#A9B2BB54] animate-pulse min-h-[160px] ${
      isDarkMode ? 'bg-[#1E2026]/40' : 'bg-white/40'
    }`}
    aria-hidden="true"
  />
)

const NewsDetail = ({ isDarkMode }: NewsDetailProps) => {
  const { slug } = useParams<{ slug: string }>()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [slug])

  const {
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
    nextPublishedDateLabel,
  }: NewsDetailHookResult = useNewsDetail(slug)

  const titleClass = clsx(
    'mt-3 text-3xl md:text-5xl font-bold leading-tight',
    isDarkMode ? 'text-[#DEE4E9]' : 'text-[#1E2026]'
  )
  const subtitleClass = clsx(
    'mt-3 text-base md:text-lg',
    isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
  )
  const footerMetaClass = clsx(
    'mt-8 max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm',
    isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'
  )

  if (loading) {
    return <NewsDetailLoadingState isDarkMode={isDarkMode} />
  }

  if (!article) {
    return (
      <section className="w-full px-4 pt-[120px] pb-16 flex justify-center">
        <div className="w-full max-w-[1100px] text-center">
          <h1
            className={clsx(
              'text-3xl font-bold',
              isDarkMode ? 'text-[#DEE4E9]' : 'text-[#1E2026]'
            )}
          >
            Article not found
          </h1>
          <Link
            to="/news-updates"
            className="inline-flex mt-6 px-5 py-2.5 rounded-full bg-[#5B5BB3] text-white font-bold"
          >
            Back to News &amp; Updates
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section
      className={clsx(
        'news-detail-page w-full px-4 pt-[120px] pb-16 flex justify-center bg-transparent',
        isDarkMode ? 'news-detail-page--dark' : 'news-detail-page--light'
      )}
    >
      <article className="w-full max-w-[1100px]">
        <nav
          className={clsx(
            'text-xs mb-6',
            isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'
          )}
          aria-label="Breadcrumb"
        >
          <Link to="/" className="hover:text-[#5B5BB3]">
            Home
          </Link>{' '}
          /{' '}
          <Link to="/news-updates" className="hover:text-[#5B5BB3]">
            News &amp; Updates
          </Link>{' '}
          / <span>{article.title}</span>
        </nav>

        <header className="text-center max-w-3xl mx-auto">
          {article.featured && (
            <div className="news-featured-badge inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-bold">
              Featured
            </div>
          )}
          <h1 className={titleClass}>{article.title}</h1>
          {subtitleText && <p className={subtitleClass}>{subtitleText}</p>}
        </header>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {articleImageUrl && (
            <img
              src={articleImageUrl}
              alt={article.title}
              className="lg:col-span-8 w-full rounded-2xl object-cover h-[240px] sm:h-[340px] lg:h-[420px]"
            />
          )}
          {!articleImageUrl && (
            <div className="hidden lg:block lg:col-span-8" aria-hidden="true" />
          )}
          <NewsDetailSidebar
            isDarkMode={isDarkMode}
            authorName={article.author?.name}
            authorImageUrl={authorImageUrl}
            articleReadTime={articleReadTime}
            publishedDateLabel={publishedDateLabel}
            updatedDateLabel={updatedDateLabel}
            showUpdatedDate={showUpdatedDate}
            categories={article.categories}
          />
        </div>

        <Suspense fallback={<ArticleBodyFallback isDarkMode={isDarkMode} />}>
          <NewsDetailBody isDarkMode={isDarkMode} blocks={article.body} />
        </Suspense>

        <div className={footerMetaClass}>
          {article.source && (
            <div>
              <span className="font-semibold">Source: </span>
              {article.source}
            </div>
          )}
        </div>

        <Suspense fallback={<NextArticleFallback isDarkMode={isDarkMode} />}>
          <NewsNextArticleSection
            isDarkMode={isDarkMode}
            nextArticle={nextArticle}
            nextArticleImageUrl={nextArticleImageUrl}
            nextPublishedDateLabel={nextPublishedDateLabel}
            nextArticleReadTime={nextArticleReadTime}
          />
        </Suspense>
      </article>
    </section>
  )
}

export default NewsDetail
