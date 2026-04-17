import clsx from 'clsx'

interface NewsHeaderProps {
  isDarkMode: boolean
}

const NewsHeader = ({ isDarkMode }: NewsHeaderProps) => {
  const subTextClass = clsx(
    'mt-3 text-base sm:text-lg max-w-3xl mx-auto',
    isDarkMode ? 'text-[#A9B2BB]' : 'text-[#3D444D]'
  )

  return (
    <header className="text-center mb-8">
      <h1 className="text-4xl sm:text-5xl font-bold">
        <span className={isDarkMode ? 'text-white' : 'text-[#1E2026]'}>
          News &amp;{' '}
        </span>
        <span className="text-[#686AD2]">Updates</span>
      </h1>
      <p className={subTextClass}>
        Stay up to date with the latest TrustVC developments, partnerships, and
        industry insights in the verifiable credentials space.
      </p>
    </header>
  )
}

export default NewsHeader
