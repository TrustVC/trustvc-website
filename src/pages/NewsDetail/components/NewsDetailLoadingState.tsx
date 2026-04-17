import clsx from 'clsx'

interface NewsDetailLoadingStateProps {
  isDarkMode: boolean
}

const NewsDetailLoadingState = ({
  isDarkMode,
}: NewsDetailLoadingStateProps) => {
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
        <div className={`h-3 w-64 rounded mb-6 ${lineBg}`} />

        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8">
          <div className={`h-10 w-3/4 mx-auto rounded ${lineBg}`} />
          <div className={`h-10 w-1/2 mx-auto rounded ${lineBg}`} />
          <div className={`h-5 w-full mx-auto rounded ${lineBg}`} />
          <div className={`h-5 w-5/6 mx-auto rounded ${lineBg}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div
            className={`lg:col-span-8 w-full rounded-2xl h-[240px] sm:h-[340px] lg:h-[420px] ${imgBg}`}
          />
          <div className="lg:col-span-4 space-y-4 p-1">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex-shrink-0 ${imgBg}`}
              />
              <div className={`h-5 w-32 rounded ${lineBg}`} />
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex-shrink-0 ${lineBg}`} />
              <div className={`h-4 w-24 rounded ${lineBg}`} />
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex-shrink-0 ${lineBg}`} />
              <div className={`h-4 w-32 rounded ${lineBg}`} />
            </div>
            <div className="flex gap-2">
              <div className={`h-6 w-20 rounded-full ${lineBg}`} />
              <div className={`h-6 w-24 rounded-full ${lineBg}`} />
            </div>
          </div>
        </div>

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

        <div className="news-next-container mt-12 w-full rounded-2xl p-5 sm:p-7 border border-[#A9B2BB54]">
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

export default NewsDetailLoadingState
