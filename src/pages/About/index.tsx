import clsx from 'clsx'
import capabilities from '../../data/capabilities'
import CapabilityCard from '../../components/about/CapabilityCard'
import EcosystemCard from '../../components/about/EcosystemCard'

interface AboutProps {
  isDarkMode: boolean
}

const About = ({ isDarkMode }: AboutProps) => (
  <div className="w-full">
    <div className="max-w-[1440px] mx-auto px-8 sm:px-16 lg:px-20 pt-[112px] pb-16">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1
          className="font-gilroy font-bold"
          style={{ fontSize: '36px', lineHeight: '122%' }}
        >
          <span
            className={clsx(isDarkMode ? 'text-neutral-60' : 'text-[#1E2026]')}
          >
            The Foundation of{' '}
          </span>
          <span style={{ color: '#686AD2' }}>Digital Trust</span>
        </h1>
        <p
          className={clsx(
            'mt-3 font-avenir max-w-[560px] mx-auto',
            isDarkMode ? 'text-neutral-50' : 'text-neutral-20'
          )}
          style={{ fontSize: '16px', fontWeight: 500, lineHeight: '155%' }}
        >
          TrustVC serve as a core infrastructure layer enabling secure,
          verifiable digital credentials across multiple industries and use
          cases.
        </p>
      </div>

      <div className="max-w-[874px] mx-auto">
        <div className="-mx-8 sm:mx-0">
          <EcosystemCard />
        </div>

        {/* Core Capabilities */}
        <div className="mb-8 text-center">
          <h2
            className={clsx(
              'font-gilroy font-bold',
              isDarkMode ? 'text-neutral-60' : 'text-[#1E2026]'
            )}
            style={{ fontSize: '28px', lineHeight: '130%' }}
          >
            Core Capabilities
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map(cap => (
            <CapabilityCard key={cap.title} cap={cap} isDarkMode={isDarkMode} />
          ))}
        </div>
      </div>
    </div>
  </div>
)

export default About
