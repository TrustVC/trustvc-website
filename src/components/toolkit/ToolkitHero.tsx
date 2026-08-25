import clsx from 'clsx'

type ToolkitHeroProps = {
  isDarkMode: boolean
}

const ToolkitHero = ({ isDarkMode }: ToolkitHeroProps) => (
  <section className="text-center pt-6 pb-4">
    <h1 className="font-urbanist font-bold text-[28px] sm:text-[40px] lg:text-[48px] leading-[130%] sm:leading-[150%] px-2">
      <span
        className={clsx(isDarkMode ? 'text-neutral-60' : 'text-neutral-10')}
      >
        The TrustVC
      </span>{' '}
      <span className="text-primary-60">Toolkit</span>
    </h1>
    <p
      className={clsx(
        'mt-2 mx-auto max-w-[704px] px-2 font-avenir text-sm sm:text-base leading-[155%]',
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
