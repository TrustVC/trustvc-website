import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { getBodyText } from '../../../lib/sanity/news'
import type { NewsArticle } from '../../../types/news'

interface NewsNextArticleSectionProps {
  isDarkMode: boolean
  nextArticle: NewsArticle | null
  nextArticleImageUrl: string | null
  nextPublishedDateLabel: string
  nextArticleReadTime: string
}

const NewsNextArticleSection = ({
  isDarkMode,
  nextArticle,
  nextArticleImageUrl,
  nextPublishedDateLabel,
  nextArticleReadTime,
}: NewsNextArticleSectionProps) => {
  return (
    <div className="news-next-container mt-12 w-full rounded-2xl p-5 sm:p-7 border border-[#A9B2BB54] bg-cover bg-center">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-4 lg:col-span-3">
          <div className="text-white text-3xl font-bold">Next Article:</div>
        </div>

        <div className="md:col-span-8 lg:col-span-9">
          {nextArticle?.slug?.current ? (
            <Link
              to={`/news-updates/${nextArticle.slug.current}`}
              className="news-next-card block rounded-2xl overflow-hidden border border-[#A9B2BB54]"
            >
              <div className="flex flex-col">
                {nextArticleImageUrl && (
                  <div className="relative">
                    <img
                      src={nextArticleImageUrl}
                      alt={nextArticle.title}
                      className="w-full h-[190px] sm:h-[220px] object-cover"
                    />
                    <div className="flex flex-wrap gap-2 w-[85%] justify-end absolute top-3 right-3">
                      {nextArticle.categories?.map(cat => (
                        <div
                          key={cat.title}
                          className={clsx(
                            'inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold border-[#A9B2BB54]',
                            isDarkMode
                              ? 'bg-[#1F1B45] text-[#A9B2BB]'
                              : 'bg-[#DFE1FF] text-[#3D444D]'
                          )}
                        >
                          {cat.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-4 sm:p-5">
                  <div
                    className={clsx(
                      'flex flex-wrap items-center gap-4 text-xs font-semibold',
                      isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      <img
                        src="/images/networks/calendar.svg"
                        alt=""
                        aria-hidden="true"
                        className="w-[18px] h-[18px]"
                      />
                      {nextPublishedDateLabel}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <img
                        src="/images/networks/clock.svg"
                        alt=""
                        aria-hidden="true"
                        className="w-[18px] h-[18px]"
                      />
                      {nextArticleReadTime}
                    </span>
                  </div>
                  <div
                    className={clsx(
                      'mt-2 text-2xl font-bold leading-tight',
                      isDarkMode ? 'text-[#DEE4E9]' : 'text-[#1E2026]'
                    )}
                  >
                    {nextArticle.title}
                  </div>
                  <div
                    className={clsx(
                      'mt-2 text-base line-clamp-2',
                      isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
                    )}
                  >
                    {nextArticle.subtitle || getBodyText(nextArticle.body)}
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#5B5BB3]">
                    Read More
                    <img
                      src="/images/networks/forward.svg"
                      alt=""
                      aria-hidden="true"
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <Link
              to="/news-updates"
              className="inline-flex rounded-full bg-white text-[#5B5BB3] px-5 py-2.5 text-sm font-bold"
            >
              Back to all articles
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewsNextArticleSection
