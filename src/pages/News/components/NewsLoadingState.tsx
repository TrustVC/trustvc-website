import ShimmerPostCards from '../../../components/common/ShimmerPostCards'

interface NewsLoadingStateProps {
  isDarkMode: boolean
}

const NewsLoadingState = ({ isDarkMode }: NewsLoadingStateProps) => {
  return (
    <div className="space-y-4 animate-pulse">
      <div
        className={`rounded-2xl overflow-hidden border grid grid-cols-1 lg:grid-cols-2 lg:items-stretch shadow-[0_8px_32px_rgba(104,106,210,0.15)] ${
          isDarkMode
            ? 'bg-[#1E2026]/80 border-[#3D444D]'
            : 'bg-white/80 border-[#DEE4E9]'
        }`}
      >
        <div
          className={`min-h-[280px] md:min-h-[340px] ${
            isDarkMode ? 'bg-[#2A313B]' : 'bg-[#E6EBFF]'
          }`}
        />
        <div className="p-5 md:p-8 flex flex-col justify-center gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-5 w-24 rounded-full ${
                isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'
              }`}
            />
            <div
              className={`h-4 w-20 rounded ${
                isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'
              }`}
            />
            <div
              className={`h-4 w-24 rounded ${
                isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'
              }`}
            />
          </div>
          <div
            className={`h-7 w-full rounded ${
              isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'
            }`}
          />
          <div
            className={`h-7 w-4/5 rounded ${
              isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'
            }`}
          />
          <div
            className={`h-4 w-full rounded ${
              isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'
            }`}
          />
          <div
            className={`h-4 w-full rounded ${
              isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'
            }`}
          />
          <div
            className={`h-4 w-3/5 rounded ${
              isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'
            }`}
          />
          <div
            className={`mt-2 h-9 w-40 rounded-lg ${
              isDarkMode ? 'bg-[#36404D]' : 'bg-[#DCE3EA]'
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ShimmerPostCards count={4} isDarkMode={isDarkMode} />
      </div>
    </div>
  )
}

export default NewsLoadingState
