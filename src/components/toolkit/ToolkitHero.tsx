import clsx from 'clsx'

type ToolkitHeroProps = {
  isDarkMode: boolean
}

const ToolkitHero = ({ isDarkMode }: ToolkitHeroProps) => (
  <section className="text-center pt-6 pb-4">
    <h1 className="font-urbanist font-bold not-italic text-[4rem] max-sm:text-[2.5rem] leading-[112%] text-center px-2">
      <span
        className={clsx(
          'font-urbanist',
          isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
        )}
      >
        The TrustVC
      </span>{' '}
      <span className="toolkit-gradient-text">Toolkit</span>
    </h1>
    <p
      className={clsx(
        'mt-2 mx-auto max-w-[704px] px-2 font-avenir font-medium not-italic text-[1.125rem] leading-[136%] text-center',
        isDarkMode ? 'text-neutral-50' : 'text-neutral-20'
      )}
    >
      OpenAttestation was archived in October 2025. To keep OA document
      workflows running without interruption, these four tools have moved here
      and are now maintained under TrustVC, which shares the same document
      lineage as TradeTrust and OpenAttestation. Please note that these tools
      support legacy OA document workflows only.
    </p>
  </section>
)

export default ToolkitHero
