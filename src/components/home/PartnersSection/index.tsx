import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const HOME_PARTNERS = [
  {
    name: 'Institute of Technical Education',
    logo: '/images/partners/Institute%20of%20Technical%20Education.svg',
  },
  { name: 'Jed', logo: '/images/partners/jed.svg' },
  { name: 'JSLA', logo: '/images/partners/JSLA.svg' },
  { name: 'JUPYTON', logo: '/images/partners/JUPYTON.svg' },
  { name: 'LaSalle | UAS', logo: '/images/partners/lasalle-uas.svg' },
]

interface PartnersSectionProps {
  isDarkMode: boolean
}

const PartnersSection = ({ isDarkMode }: PartnersSectionProps) => {
  const navigate = useNavigate()

  return (
    <section className="w-full py-16">
      <div className="max-w-[1440px] mx-auto px-8 sm:px-16 lg:px-20 text-center mb-10">
        <h2
          className="font-gilroy font-bold"
          style={{ fontSize: '36px', lineHeight: '122%', letterSpacing: '0%' }}
        >
          <span
            className={clsx(isDarkMode ? 'text-neutral-60' : 'text-[#1E2026]')}
          >
            Our{' '}
          </span>
          <span style={{ color: '#686AD2' }}>Partners</span>
        </h2>
        <p
          className={clsx(
            'mt-3 font-avenir',
            isDarkMode ? 'text-neutral-50' : 'text-[#3D444D]'
          )}
        >
          Building a foundation of trust for every industry.
        </p>
      </div>

      {/* Partner logos — centered row */}
      <div className="max-w-[1440px] mx-auto px-8 sm:px-16 lg:px-20 flex items-center justify-center gap-8 sm:gap-12 lg:gap-20">
        {HOME_PARTNERS.map((partner, idx) => (
          <div
            key={partner.name}
            className={clsx(
              'flex items-center justify-center',
              idx >= 2 ? 'hidden sm:flex' : ''
            )}
            style={{ minHeight: '40px' }}
          >
            <img
              src={partner.logo}
              alt={partner.name}
              className="w-auto object-contain"
              style={{ height: '55px' }}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
        <button
          type="button"
          onClick={() => navigate('/partners')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-gilroy font-bold text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#5B5BB3' }}
        >
          View All Partners
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  )
}

export default PartnersSection
