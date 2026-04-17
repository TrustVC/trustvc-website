import clsx from 'clsx'

/** Shown while lazy news route chunks load — matches page shell spacing. */
const NewsRouteFallback = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const bar = isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'
  return (
    <section
      className="news-page w-full px-4 pt-[120px] pb-16 flex justify-center bg-transparent"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="w-full max-w-[1280px] animate-pulse space-y-6">
        <div className={clsx('h-10 w-48 mx-auto rounded-lg', bar)} />
        <div className={clsx('h-64 max-w-3xl mx-auto rounded-2xl', bar)} />
        <div className={clsx('h-40 rounded-2xl', bar)} />
      </div>
    </section>
  )
}

export default NewsRouteFallback
