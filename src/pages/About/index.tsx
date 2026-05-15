import clsx from 'clsx'
import capabilities from '../../data/capabilities'

const TAG_STYLES: Record<string, { background: string; color: string }> = {
  'Transferable Record': { background: '#dfe1ff', color: '#312d62' },
  'Verifiable Document': { background: '#b3ecff', color: '#0b384f' },
}

interface AboutProps {
  isDarkMode: boolean
}

const About = ({ isDarkMode }: AboutProps) => {
  return (
    <div className="w-full">
      <div className="max-w-[1440px] mx-auto px-8 sm:px-16 lg:px-20 pt-[112px] pb-16">
        {/* Heading */}
        <div className="text-center mb-10">
          <h1
            className="font-gilroy font-bold"
            style={{ fontSize: '36px', lineHeight: '122%' }}
          >
            <span
              className={clsx(
                isDarkMode ? 'text-neutral-60' : 'text-[#1E2026]'
              )}
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

        {/* Center Image Card */}
        <div className="max-w-[874px] mx-auto rounded-2xl overflow-hidden mb-16">
          <div className="about-ecosystem-card-content">
            <div className="about-ecosystem-card">
              <div className="relative z-10">
                <h2
                  className="font-gilroy font-bold text-center text-white"
                  style={{
                    fontSize: '24px',
                    lineHeight: '133%',
                    letterSpacing: '0%',
                  }}
                >
                  How TrustVC Powers Multiple Ecosystems
                </h2>
                <p
                  className="font-avenir text-center mt-1"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '155%',
                    letterSpacing: '0%',
                    color: '#FFFFFF',
                  }}
                >
                  One foundational platform, unlimited verification
                  possibilities.
                </p>
                <img
                  src="/images/about/center-image.svg"
                  alt="How TrustVC Powers Multiple Ecosystems"
                  className="w-full block mt-4"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Core Capabilities */}
        <div className="max-w-[874px] mx-auto">
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
              <div
                key={cap.title}
                className={clsx(
                  'rounded-2xl p-6 flex flex-col gap-4 border',
                  isDarkMode
                    ? 'bg-neutral-20/30 border-neutral-20/60'
                    : 'bg-white border-neutral-60/60'
                )}
              >
                {/* Icon + Tags row */}
                <div className="flex items-start gap-4">
                  <div
                    className={clsx(
                      'w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center',
                      isDarkMode ? 'bg-neutral-20/60' : 'bg-[#F5F6F7]'
                    )}
                  >
                    <img src={cap.icon} alt={cap.title} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {cap.tags.map(tag => (
                      <span
                        key={tag}
                        className="font-gilroy font-bold rounded-full inline-flex items-center justify-center"
                        style={{
                          width: '128px',
                          height: '24px',
                          fontSize: '11px',
                          ...(TAG_STYLES[tag] ?? {
                            background: '#dfe1ff',
                            color: '#312d62',
                          }),
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <h3
                  className={clsx(
                    'font-gilroy font-bold',
                    isDarkMode ? 'text-neutral-60' : 'text-[#1E2026]'
                  )}
                  style={{
                    fontSize: '18px',
                    lineHeight: '136%',
                    letterSpacing: '0%',
                  }}
                >
                  {cap.title}
                </h3>

                {/* Description */}
                <p
                  className="font-avenir capability-desc"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '155%',
                    letterSpacing: '0%',
                    textAlign: 'left',
                    color: isDarkMode ? '#8B929A' : '#3D444D',
                    WebkitTextFillColor: isDarkMode ? '#8B929A' : '#3D444D',
                  }}
                >
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
