import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import partners from '../../../data/partners'

interface PartnersSectionProps {
  isDarkMode: boolean
}

const bannerPartners = partners.filter(p => p.bannerLogo)
const marqueeItems = [...bannerPartners, ...bannerPartners]

const PartnersSection = ({ isDarkMode }: PartnersSectionProps) => {
  const navigate = useNavigate()

  return (
    <div className="w-full py-12">
      <div className="text-center mb-10">
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

      {/* Centered carousel wrapper */}
      <div
        className="max-w-4xl mx-auto overflow-hidden"
        style={{
          WebkitMaskImage:
            'linear-gradient(to right, rgba(0,0,0,0) 0%, black 18%, black 82%, rgba(0,0,0,0) 100%)',
          maskImage:
            'linear-gradient(to right, rgba(0,0,0,0) 0%, black 18%, black 82%, rgba(0,0,0,0) 100%)',
        }}
      >
        {/* Animated track */}
        <div className="flex animate-marquee w-max">
          {marqueeItems.map((partner, idx) => (
            <div
              key={`${partner.name}-${idx}`}
              className="flex-shrink-0 flex items-center justify-center mx-5"
              style={{ height: '100px' }}
            >
              <img
                src={partner.bannerLogo}
                srcSet={
                  partner.bannerLogo2x
                    ? `${encodeURI(partner.bannerLogo!)} 1x, ${encodeURI(partner.bannerLogo2x)} 2x`
                    : undefined
                }
                alt={partner.name}
                className="h-20 w-auto object-contain"
                loading="eager"
              />
            </div>
          ))}
        </div>
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
    </div>
  )
}

export default PartnersSection
