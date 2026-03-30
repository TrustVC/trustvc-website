import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fetchNewsArticles, getBodyText } from '../../lib/sanity/news'
import { getSanityImageUrl } from '../../lib/sanity/client'
import type { NewsArticle } from '../../types/news'

interface NewsProps {
  isDarkMode: boolean
}

const getReadTimeText = (body?: NewsArticle['body']) => {
  const words = getBodyText(body).split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}

const News = ({ isDarkMode }: NewsProps) => {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

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
  const featuredImageUrl = featuredArticle
    ? getSanityImageUrl(featuredArticle.mainImage)?.width(1200).height(650).url()
    : null

  return (
    <section
      className={`w-full px-4 pt-[120px] pb-16 flex justify-center bg-transparent ${
        isDarkMode ? 'dark-mode' : ''
      }`}
    >
      <div className="w-full max-w-[1280px]">
        <header className="text-center mb-8">
          <h1
            className={`text-4xl sm:text-5xl font-bold ${
              isDarkMode ? 'text-[#E6EBFF]' : 'text-[#1E2026]'
            }`}
          >
            News &amp; Updates
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
          <div
            className={`rounded-2xl p-10 text-center border ${
              isDarkMode
                ? 'bg-[#1E2026]/70 border-[#3D444D] text-[#A9B2BB]'
                : 'bg-white/80 border-[#DEE4E9] text-[#5B6571]'
            }`}
          >
            Loading articles...
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
                className={`grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden border shadow-[0_8px_32px_rgba(104,106,210,0.15)] ${
                  isDarkMode
                    ? 'bg-[#1E2026]/80 border-[#3D444D]'
                    : 'bg-white/80 border-[#DEE4E9]'
                }`}
              >
                {featuredImageUrl && (
                  <img
                    src={featuredImageUrl}
                    alt={featuredArticle.title}
                    className="w-full h-[280px] md:h-[340px] object-cover"
                  />
                )}
                <div className="p-5 md:p-8 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
                    {featuredArticle.featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#5B5BB3] text-white">
                        Featured
                      </span>
                    )}
                    {featuredArticle.categories?.[0]?.title && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-[#A9B2BB54] text-[#5B6571]">
                        <img
                          src="/images/networks/label.svg"
                          alt=""
                          aria-hidden="true"
                          className="w-3 h-3"
                        />
                        {featuredArticle.categories[0].title}
                      </span>
                    )}
                    <span
                      className={isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'}
                    >
                      {getReadTimeText(featuredArticle.body)}
                    </span>
                    <span
                      className={isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'}
                    >
                      {featuredArticle.publishedAt
                        ? format(new Date(featuredArticle.publishedAt), 'MMMM d, yyyy')
                        : 'Recent'}
                    </span>
                  </div>
                  <h2
                    className={`text-2xl md:text-3xl font-bold leading-tight ${
                      isDarkMode ? 'text-[#E6EBFF]' : 'text-[#1E2026]'
                    }`}
                  >
                    {featuredArticle.title}
                  </h2>
                  <p
                    className={`mt-3 text-sm md:text-base line-clamp-3 ${
                      isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
                    }`}
                  >
                    {featuredArticle.subtitle || getBodyText(featuredArticle.body)}
                  </p>
                  <Link
                    to={`/news-updates/${featuredArticle.slug?.current || ''}`}
                    className="mt-6 inline-flex w-fit items-center rounded-lg bg-[#5B5BB3] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                  >
                    Read Full Article
                    <img
                      src="/images/networks/forward.svg"
                      alt=""
                      aria-hidden="true"
                      className="w-4 h-4"
                    />
                  </Link>
                </div>
              </article>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articleGrid.map(article => {
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
                      <img
                        src={imageUrl}
                        alt={article.title}
                        className="w-full h-[210px] object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div
                        className={`text-xs mb-2 ${
                          isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'
                        }`}
                      >
                        {article.publishedAt
                          ? format(new Date(article.publishedAt), 'MMMM d, yyyy')
                          : 'Recent'}{' '}
                        • {getReadTimeText(article.body)}
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
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default News
