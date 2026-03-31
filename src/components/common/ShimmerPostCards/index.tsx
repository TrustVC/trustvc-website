interface ShimmerPostCardsProps {
  count?: number
  isDarkMode: boolean
}

const ShimmerPostCards = ({ count = 4, isDarkMode }: ShimmerPostCardsProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`shimmer-post-card-${index}`}
          className={`rounded-2xl overflow-hidden border animate-pulse ${
            isDarkMode ? 'bg-[#1E2026]/80 border-[#3D444D]' : 'bg-white/80 border-[#DEE4E9]'
          }`}
        >
          <div className={isDarkMode ? 'bg-[#2A313B] h-[210px]' : 'bg-[#E6EBFF] h-[210px]'} />
          <div className="p-4">
            <div className="flex gap-3 mb-3">
              <div
                className={`h-3 w-24 rounded ${isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'}`}
              />
              <div
                className={`h-3 w-20 rounded ${isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'}`}
              />
            </div>
            <div
              className={`h-5 w-4/5 rounded mb-3 ${isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'}`}
            />
            <div
              className={`h-4 w-full rounded mb-2 ${isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'}`}
            />
            <div
              className={`h-4 w-3/4 rounded ${isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'}`}
            />
          </div>
        </div>
      ))}
    </>
  )
}

export default ShimmerPostCards
