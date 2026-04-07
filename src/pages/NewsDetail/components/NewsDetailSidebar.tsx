import clsx from 'clsx'
import type { SanityCategory } from '../../../types/news'

interface NewsDetailSidebarProps {
  isDarkMode: boolean
  authorName?: string
  authorImageUrl: string | null
  articleReadTime: string
  publishedDateLabel: string
  updatedDateLabel: string | null
  showUpdatedDate: boolean
  categories?: SanityCategory[]
}

const NewsDetailSidebar = ({
  isDarkMode,
  authorName,
  authorImageUrl,
  articleReadTime,
  publishedDateLabel,
  updatedDateLabel,
  showUpdatedDate,
  categories,
}: NewsDetailSidebarProps) => {
  const panelTextClass = isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'

  return (
    <aside className={clsx('p-1 h-fit lg:col-span-4', panelTextClass)}>
      <div className="inline-flex items-center gap-3">
        <img
          src={authorImageUrl || '/icons/profile-default.svg'}
          alt={authorName || 'Author'}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div
          className={clsx(
            'font-bold text-lg',
            isDarkMode ? 'text-[#A9B2BB]' : 'text-[#5B6571]'
          )}
        >
          {authorName || 'Author Name'}
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
      {!!categories?.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map(cat => (
            <span
              key={cat.title}
              className={clsx(
                'inline-flex items-center gap-1 rounded-[9999px] px-[12px] py-[4px] text-xs font-semibold',
                isDarkMode
                  ? 'bg-[#1F1B45] text-[#C2C5F0]'
                  : 'bg-[#DFE1FF] text-[#312D62]'
              )}
            >
              {cat.title}
            </span>
          ))}
        </div>
      )}
    </aside>
  )
}

export default NewsDetailSidebar
