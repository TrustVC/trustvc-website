import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  fetchNewsArticleBySlug,
  fetchNewsArticles,
  getBodyText,
} from '../../lib/sanity/news'
import { getSanityImageUrl } from '../../lib/sanity/client'
import type {
  NewsArticle,
  PortableTextBlock,
  PortableTextSpan,
} from '../../types/news'

interface NewsDetailProps {
  isDarkMode: boolean
}

const NewsDetail = ({ isDarkMode }: NewsDetailProps) => {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [nextArticle, setNextArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!slug) {
        setLoading(false)
        return
      }

      setLoading(true)
      const [data, list] = await Promise.all([
        fetchNewsArticleBySlug(slug),
        fetchNewsArticles(),
      ])

      setArticle(data)

      if (data?.slug?.current && Array.isArray(list) && list.length) {
        const idx = list.findIndex(a => a.slug?.current === data.slug?.current)
        if (idx >= 0 && idx < list.length - 1) {
          setNextArticle(list[idx + 1])
        } else {
          setNextArticle(null)
        }
      } else {
        setNextArticle(null)
      }

      setLoading(false)
    }

    load()
  }, [slug])

  const subtitleText = article?.subtitle || ''
  const articleImageUrl = article
    ? getSanityImageUrl(article.mainImage)?.width(1300).height(700).url()
    : null

  const nextArticleImageUrl = nextArticle
    ? getSanityImageUrl(nextArticle.mainImage)?.width(600).height(320).url()
    : null
  const authorImageUrl = article?.author?.image
    ? getSanityImageUrl(article.author.image)?.width(96).height(96).url()
    : null
  const publishedDateLabel = article?.publishedAt
    ? format(new Date(article.publishedAt), 'MMMM d, yyyy')
    : 'Recent'
  const updatedDateLabel = article?.updatedAt
    ? format(new Date(article.updatedAt), 'MMMM d, yyyy')
    : null
  const showUpdatedDate = Boolean(
    updatedDateLabel &&
    article?.publishedAt &&
    updatedDateLabel !== publishedDateLabel
  )

  const getReadTimeText = (textOrBody: NewsArticle['body']) => {
    const text = getBodyText(textOrBody)
    const words = text.split(/\s+/).filter(Boolean).length
    const minutes = Math.max(1, Math.ceil(words / 200))
    return `${minutes} min read`
  }

  const renderPortableTextSpan = (
    span: PortableTextSpan,
    block: PortableTextBlock,
    index: number
  ) => {
    const text = span.text || ''
    const marks = span.marks || []
    const key = span._key || `span-${index}`

    const hasStrong = marks.includes('strong')
    const linkMarkKey = marks.find(mark =>
      block.markDefs?.some(def => def._key === mark && def._type === 'link')
    )
    const linkDef = linkMarkKey
      ? block.markDefs?.find(
          def => def._key === linkMarkKey && def._type === 'link'
        )
      : null

    const content = hasStrong ? <strong>{text}</strong> : text

    if (linkDef?.href) {
      const isExternal = /^https?:\/\//.test(linkDef.href)
      return (
        <a
          key={key}
          href={linkDef.href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="underline text-[#5B5BB3] hover:opacity-80"
        >
          {content}
        </a>
      )
    }

    return <span key={key}>{content}</span>
  }

  if (loading) {
    return (
      <section className="w-full px-4 pt-[120px] pb-16 flex justify-center">
        <div
          className={`w-full max-w-[1100px] rounded-2xl p-10 text-center border ${
            isDarkMode
              ? 'bg-[#1E2026]/70 border-[#3D444D] text-[#A9B2BB]'
              : 'bg-white/80 border-[#DEE4E9] text-[#5B6571]'
          }`}
        >
          Loading article...
        </div>
      </section>
    )
  }

  if (!article) {
    return (
      <section className="w-full px-4 pt-[120px] pb-16 flex justify-center">
        <div className="w-full max-w-[1100px] text-center">
          <h1
            className={`text-3xl font-bold ${
              isDarkMode ? 'text-[#E6EBFF]' : 'text-[#1E2026]'
            }`}
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
    <section className="w-full px-4 pt-[120px] pb-16 flex justify-center bg-transparent">
      <article className="w-full max-w-[1100px]">
        <nav
          className={`text-xs mb-6 ${
            isDarkMode ? 'text-[#808894]' : 'text-[#5B6571]'
          }`}
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
            <div
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-bold"
              style={{
                background:
                  'linear-gradient(105.36deg, #3C83F6 0%, #6467F2 100%)',
              }}
            >
              Featured
            </div>
          )}
          <h1
            className={`mt-3 text-3xl md:text-5xl font-bold leading-tight ${
              isDarkMode ? 'text-[#E6EBFF]' : 'text-[#1E2026]'
            }`}
          >
            {article.title}
          </h1>
          {subtitleText && (
            <p
              className={`mt-3 text-base md:text-lg ${
                isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
              }`}
            >
              {subtitleText}
            </p>
          )}
        </header>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {articleImageUrl && (
            <img
              src={articleImageUrl}
              alt={article.title}
              className="lg:col-span-8 w-full rounded-2xl object-cover h-[240px] sm:h-[340px] lg:h-[420px]"
            />
          )}
          <aside
            className={`lg:col-span-4 p-1 h-fit ${
              isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'
            }`}
          >
            <div className="inline-flex items-center gap-3">
              <img
                src={authorImageUrl || '/icons/profile-default.svg'}
                alt={article.author?.name || 'Author'}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div
                className="font-bold text-lg"
                style={{ color: 'var(--Neutral-100-50, #5B6571)' }}
              >
                {article.author?.name || 'Author Name'}
              </div>
            </div>
            <div
              className="mt-4 text-sm flex items-center gap-2 whitespace-nowrap"
              style={{ color: 'var(--Neutral-100-50, #5B6571)' }}
            >
              <img
                src="/images/networks/clock.svg"
                alt=""
                aria-hidden="true"
                className="w-3.5 h-3.5"
              />
              {`${Math.max(1, Math.ceil(getBodyText(article.body).split(/\s+/).length / 200))} min read`}
            </div>
            <div
              className="mt-3 text-sm flex items-center gap-2"
              style={{ color: 'var(--Neutral-100-50, #5B6571)' }}
            >
              <img
                src="/images/networks/calendar.svg"
                alt=""
                aria-hidden="true"
                className="w-3.5 h-3.5"
              />
              {publishedDateLabel}
              {showUpdatedDate ? ` (Updated ${updatedDateLabel})` : ''}
            </div>
            {!!article.categories?.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {article.categories.map(cat => (
                  <span
                    key={cat.title}
                    className={`inline-flex items-center gap-1 rounded-[9999px] border border-[#A9B2BB54] px-[10.56px] py-[2.56px] text-xs font-semibold ${
                      isDarkMode
                        ? 'bg-transparent text-[#5B6571]'
                        : 'bg-white text-[#3D444D]'
                    }`}
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
                    {cat.title}
                  </span>
                ))}
              </div>
            )}
          </aside>
        </div>

        <div
          className={`mt-8 max-w-3xl mx-auto space-y-6 text-[15px] leading-7 ${
            isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
          }`}
        >
          {article.body?.length ? (
            article.body
              .filter(block => block?._type === 'block')
              .map((block, blockIndex) => (
                <p key={block._key || `block-${blockIndex}`}>
                  {(block.children || []).map((span, spanIndex) =>
                    renderPortableTextSpan(span, block, spanIndex)
                  )}
                </p>
              ))
          ) : (
            <p>No content available yet.</p>
          )}
        </div>

        <div
          className={`mt-8 max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm ${
            isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'
          }`}
        >
          {article.source && (
            <div>
              <span className="font-semibold">Source: </span>
              {article.source}
            </div>
          )}
        </div>

        <div
          className="mt-12 w-full rounded-2xl p-5 sm:p-7 border border-[#A9B2BB54] bg-cover bg-center"
          style={{
            background: 'linear-gradient(97.83deg, #686AD2 10%, #167EB0 90%)',
            backgroundImage:
              "url('/images/carousel/next_article.svg'), linear-gradient(97.83deg, #686AD2 10%, #167EB0 90%)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-4 lg:col-span-3">
              <div className="text-white text-3xl font-bold">Next Article:</div>
            </div>

            <div className="md:col-span-8 lg:col-span-9">
              {nextArticle ? (
                <Link
                  to={`/news-updates/${nextArticle.slug?.current || ''}`}
                  className="block rounded-2xl overflow-hidden border border-[#A9B2BB54] bg-[#FFFFFFE5]"
                >
                  <div className="flex flex-col">
                    {nextArticleImageUrl && (
                      <div className="relative">
                        <img
                          src={nextArticleImageUrl}
                          alt={nextArticle.title}
                          className="w-full h-[190px] sm:h-[220px] object-cover"
                        />
                        {nextArticle.categories?.[0]?.title && (
                          <div
                            className={`absolute top-3 right-3 inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold ${
                              isDarkMode
                                ? 'bg-transparent border-[#A9B2BB54] text-[#5B6571]'
                                : 'bg-white/95 border-transparent text-[#3D444D]'
                            }`}
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
                            {nextArticle.categories[0].title}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#5B6571] font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <img
                            src="/images/networks/calendar.svg"
                            alt=""
                            aria-hidden="true"
                            className="w-3.5 h-3.5"
                          />
                          {nextArticle.publishedAt
                            ? format(
                                new Date(nextArticle.publishedAt),
                                'MMMM d, yyyy'
                              )
                            : 'Recent'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <img
                            src="/images/networks/clock.svg"
                            alt=""
                            aria-hidden="true"
                            className="w-3.5 h-3.5"
                          />
                          {getReadTimeText(nextArticle.body)}
                        </span>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-[#1E2026] leading-tight">
                        {nextArticle.title}
                      </div>
                      <div className="mt-2 text-base text-[#3D444D] line-clamp-2">
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
      </article>
    </section>
  )
}

export default NewsDetail
