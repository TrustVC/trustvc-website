import type React from 'react'
import { Link, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { getBodyText } from '../../lib/sanity/news'
import { getSanityImageUrl } from '../../lib/sanity/client'
import type {
  NewsDetailHookResult,
  PortableTextBlock,
  PortableTextSpan,
} from '../../types/news'
import { useNewsDetail } from '../../hooks/useNewsDetail'

interface NewsDetailProps {
  isDarkMode: boolean
}

const NewsDetail = ({ isDarkMode }: NewsDetailProps) => {
  const { slug } = useParams<{ slug: string }>()
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

  const panelTextClass = isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'
  const titleClass = clsx(
    'mt-3 text-3xl md:text-5xl font-bold leading-tight',
    isDarkMode ? 'text-[#DEE4E9]' : 'text-[#1E2026]'
  )
  const subtitleClass = clsx(
    'mt-3 text-base md:text-lg',
    isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
  )
  const articleBodyClass = clsx(
    'mt-8 max-w-3xl mx-auto space-y-6 text-[15px] leading-7',
    isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
  )
  const footerMetaClass = clsx(
    'mt-8 max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm',
    isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'
  )

  const renderPortableTextSpan = (
    span: PortableTextSpan,
    block: PortableTextBlock,
    index: number
  ) => {
    const text = span.text || ''
    const marks = span.marks || []
    const key = span._key || `span-${index}`

    const linkMarkKey = marks.find(mark =>
      block.markDefs?.some(def => def._key === mark && def._type === 'link')
    )
    const linkDef = linkMarkKey
      ? block.markDefs?.find(
          def => def._key === linkMarkKey && def._type === 'link'
        )
      : null

    let content: React.ReactNode = text
    if (marks.includes('strong')) content = <strong>{content}</strong>
    if (marks.includes('em')) content = <em>{content}</em>
    if (marks.includes('code'))
      content = (
        <code className={`rounded px-1 font-mono text-sm ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
          {content}
        </code>
      )

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

  const renderPortableTextBlock = (
    block: PortableTextBlock,
    blockIndex: number
  ) => {
    const key = block._key || `block-${blockIndex}`
    const spans = (block.children || []).map((span, i) =>
      renderPortableTextSpan(span, block, i)
    )

    if (block._type === 'image') {
      const imageBlock = block as unknown as { asset?: { _ref?: string }; alt?: string }
      const src = getSanityImageUrl({ asset: imageBlock.asset })?.width(900).url()
      if (!src) return null
      return (
        <img
          key={key}
          src={src}
          alt={imageBlock.alt || ''}
          className="w-full rounded-xl"
        />
      )
    }

    if (block.listItem) {
      // Individual list items are grouped by renderBlocks below; render the <li> here
      return <li key={key}>{spans}</li>
    }

    switch (block.style) {
      case 'h2':
        return (
          <h2
            key={key}
            className={clsx(
              'text-2xl font-bold mt-6',
              isDarkMode ? 'text-[#DEE4E9]' : 'text-[#1E2026]'
            )}
          >
            {spans}
          </h2>
        )
      case 'h3':
        return (
          <h3
            key={key}
            className={clsx(
              'text-xl font-bold mt-5',
              isDarkMode ? 'text-[#DEE4E9]' : 'text-[#1E2026]'
            )}
          >
            {spans}
          </h3>
        )
      case 'blockquote':
        return (
          <blockquote
            key={key}
            className={clsx(
              'border-l-4 border-[#686AD2] pl-4 italic',
              isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
            )}
          >
            {spans}
          </blockquote>
        )
      default:
        return <p key={key}>{spans}</p>
    }
  }

  // Groups consecutive list items into <ul>/<ol> wrappers
  const renderBlocks = (blocks: PortableTextBlock[]) => {
    const output: React.ReactNode[] = []
    let i = 0
    while (i < blocks.length) {
      const block = blocks[i]
      if (block.listItem) {
        const listType = block.listItem
        const groupKey = block._key || `list-${i}`
        const items: React.ReactNode[] = []
        while (i < blocks.length && blocks[i].listItem === listType) {
          items.push(renderPortableTextBlock(blocks[i], i))
          i++
        }
        const Tag = listType === 'number' ? 'ol' : 'ul'
        output.push(
          <Tag key={groupKey} className="list-disc list-inside space-y-1">
            {items}
          </Tag>
        )
      } else {
        output.push(renderPortableTextBlock(block, i))
        i++
      }
    }
    return output
  }

  if (loading) {
    const lineBg = isDarkMode ? 'bg-[#3D444D]' : 'bg-[#DEE4E9]'
    const imgBg = isDarkMode ? 'bg-[#2A313B]' : 'bg-[#E6EBFF]'

    return (
      <section
        className={clsx(
          'news-detail-page w-full px-4 pt-[120px] pb-16 flex justify-center bg-transparent',
          isDarkMode ? 'news-detail-page--dark' : 'news-detail-page--light'
        )}
      >
        <div className="w-full max-w-[1100px] animate-pulse">
          {/* Breadcrumb */}
          <div className={`h-3 w-64 rounded mb-6 ${lineBg}`} />

          {/* Title + subtitle */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-8">
            <div className={`h-10 w-3/4 mx-auto rounded ${lineBg}`} />
            <div className={`h-10 w-1/2 mx-auto rounded ${lineBg}`} />
            <div className={`h-5 w-full mx-auto rounded ${lineBg}`} />
            <div className={`h-5 w-5/6 mx-auto rounded ${lineBg}`} />
          </div>

          {/* Image + meta panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Image */}
            <div
              className={`lg:col-span-8 w-full rounded-2xl h-[240px] sm:h-[340px] lg:h-[420px] ${imgBg}`}
            />
            {/* Meta panel */}
            <div className="lg:col-span-4 space-y-4 p-1">
              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex-shrink-0 ${imgBg}`}
                />
                <div className={`h-5 w-32 rounded ${lineBg}`} />
              </div>
              {/* Clock row */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex-shrink-0 ${lineBg}`}
                />
                <div className={`h-4 w-24 rounded ${lineBg}`} />
              </div>
              {/* Calendar row */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex-shrink-0 ${lineBg}`}
                />
                <div className={`h-4 w-32 rounded ${lineBg}`} />
              </div>
              {/* Category chips */}
              <div className="flex gap-2">
                <div className={`h-6 w-20 rounded-full ${lineBg}`} />
                <div className={`h-6 w-24 rounded-full ${lineBg}`} />
              </div>
            </div>
          </div>

          {/* Body text */}
          <div className="mt-8 max-w-3xl mx-auto space-y-3">
            {[100, 96, 98, 88, 100, 92, 72].map((w, i) => (
              <div
                key={i}
                style={{ width: `${w}%` }}
                className={`h-3.5 rounded ${lineBg}`}
              />
            ))}
            <div className="pt-2" />
            {[100, 94, 96, 80].map((w, i) => (
              <div
                key={`b2-${i}`}
                style={{ width: `${w}%` }}
                className={`h-3.5 rounded ${lineBg}`}
              />
            ))}
          </div>

          {/* Next article section */}
          <div
            className={clsx(
              'news-next-container mt-12 w-full rounded-2xl p-5 sm:p-7 border border-[#A9B2BB54]'
            )}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-4 lg:col-span-3">
                <div className={`h-8 w-36 rounded ${lineBg}`} />
              </div>
              <div className="md:col-span-8 lg:col-span-9">
                <div
                  className={clsx(
                    'rounded-2xl overflow-hidden border border-[#A9B2BB54]',
                    isDarkMode ? 'bg-[#1E2026]/80' : 'bg-white/80'
                  )}
                >
                  <div className={`w-full h-[190px] sm:h-[220px] ${imgBg}`} />
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex gap-4">
                      <div className={`h-3 w-28 rounded ${lineBg}`} />
                      <div className={`h-3 w-20 rounded ${lineBg}`} />
                    </div>
                    <div className={`h-6 w-full rounded ${lineBg}`} />
                    <div className={`h-6 w-4/5 rounded ${lineBg}`} />
                    <div className={`h-4 w-full rounded ${lineBg}`} />
                    <div className={`h-4 w-3/4 rounded ${lineBg}`} />
                    <div className={`h-4 w-20 rounded ${lineBg}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
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
          <aside
            className={clsx(
              'p-1 h-fit',
              articleImageUrl ? 'lg:col-span-4' : 'lg:col-span-12',
              panelTextClass
            )}
          >
            <div className="inline-flex items-center gap-3">
              <img
                src={authorImageUrl || '/icons/profile-default.svg'}
                alt={article.author?.name || 'Author'}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div
                className={clsx(
                  'font-bold text-lg',
                  isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'
                )}
              >
                {article.author?.name || 'Author Name'}
              </div>
            </div>
            <div
              className={clsx(
                'mt-4 text-sm flex items-center gap-2 whitespace-nowrap',
                isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'
              )}
            >
              <img
                src="/images/networks/clock.svg"
                alt=""
                aria-hidden="true"
                className="w-[18px] h-[18px]"
              />
              {articleReadTime}
            </div>
            <div
              className={clsx(
                'mt-3 text-sm flex items-center gap-2',
                isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'
              )}
            >
              <img
                src="/images/networks/calendar.svg"
                alt=""
                aria-hidden="true"
                className="w-[18px] h-[18px]"
              />
              {publishedDateLabel}
              {showUpdatedDate ? ` (Updated ${updatedDateLabel})` : ''}
            </div>
            {!!article.categories?.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {article.categories.map(cat => (
                  <span
                    key={cat.title}
                    className={clsx(
                      'inline-flex items-center gap-1 rounded-[9999px] px-[12px] py-[4px] text-xs font-semibold',
                      isDarkMode
                        ? 'bg-[#353157] text-[#C2C5F0]'
                        : 'bg-[#DFE1FF] text-[#3D444D]'
                    )}
                  >
                    {cat.title}
                  </span>
                ))}
              </div>
            )}
          </aside>
        </div>

        <div className={articleBodyClass}>
          {article.body?.length ? (
            renderBlocks(article.body)
          ) : (
            <p>No content available yet.</p>
          )}
        </div>

        <div className={footerMetaClass}>
          {article.source && (
            <div>
              <span className="font-semibold">Source: </span>
              {article.source}
            </div>
          )}
        </div>

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
                        {nextArticle.categories?.[0]?.title && (
                          <div
                            className={clsx(
                              'absolute top-3 right-3 inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold border-[#A9B2BB54]',
                              isDarkMode
                                ? 'bg-[#1F1B45] text-[#A9B2BB]'
                                : 'bg-[#DFE1FF] text-[#3D444D]'
                            )}
                          >
                            {nextArticle.categories[0].title}
                          </div>
                        )}
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
      </article>
    </section>
  )
}

export default NewsDetail
