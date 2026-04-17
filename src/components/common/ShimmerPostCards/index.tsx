interface ShimmerPostCardsProps {
  count?: number
  isDarkMode: boolean
}

const ShimmerPostCards = ({ count = 4, isDarkMode }: ShimmerPostCardsProps) => {
  const imgBg = isDarkMode ? 'bg-[#2A313B]' : 'bg-[#E6EBFF]'
  const lineBg = isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'
  const cardBg = isDarkMode
    ? 'bg-[#1E2026]/80 border-[#3D444D]'
    : 'bg-white/80 border-[#DEE4E9]'

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`shimmer-post-card-${index}`}
          className={`rounded-2xl overflow-hidden border animate-pulse ${cardBg}`}
        >
          {/* Image with category chip overlay */}
          <div className={`relative h-[210px] ${imgBg}`}>
            <div className="absolute top-3 right-3 flex gap-2">
              <div className={`h-5 w-20 rounded-full ${lineBg}`} />
            </div>
          </div>

          {/* Card body */}
          <div className="p-4">
            {/* Date + read time row */}
            <div className="flex items-center gap-4 mb-3">
              <div className={`h-3 w-28 rounded ${lineBg}`} />
              <div className={`h-3 w-20 rounded ${lineBg}`} />
            </div>
            {/* Title */}
            <div className={`h-5 w-full rounded mb-2 ${lineBg}`} />
            <div className={`h-5 w-4/5 rounded mb-3 ${lineBg}`} />
            {/* Excerpt */}
            <div className={`h-3.5 w-full rounded mb-2 ${lineBg}`} />
            <div className={`h-3.5 w-3/4 rounded mb-4 ${lineBg}`} />
            {/* Read More */}
            <div className={`h-3.5 w-24 rounded ${lineBg}`} />
          </div>
        </div>
      ))}
    </>
  )
}

export default ShimmerPostCards
