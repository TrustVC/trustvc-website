import { useState } from 'react'
import clsx from 'clsx'
import partners from '../../data/partners'
import PartnerCard from '../../components/common/PartnerCard'

const CATEGORIES = [
  'All',
  'Issuance & Attestation',
  'Verification & Validation',
  'Solution Partners',
  'Infrastructure',
]

interface PartnersProps {
  isDarkMode: boolean
}

const Partners = ({ isDarkMode }: PartnersProps) => {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered =
    activeCategory === 'All'
      ? partners
      : partners.filter(p => p.category === activeCategory)

  return (
    <div
      className={clsx(
        'w-full min-h-screen',
        isDarkMode ? 'bg-[#1E2026]' : 'bg-white'
      )}
    >
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
              Our{' '}
            </span>
            <span style={{ color: '#686AD2' }}>Partners</span>
          </h1>
          <p
            className={clsx(
              'mt-3 text-base font-avenir',
              isDarkMode ? 'text-neutral-50' : 'text-neutral-30'
            )}
          >
            Building a foundation of trust for every industry.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                'px-4 py-2 rounded-lg font-bold text-sm font-avenir transition-colors',
                activeCategory === cat
                  ? 'bg-primary-60 text-white'
                  : isDarkMode
                    ? 'bg-neutral-20/40 text-neutral-50 hover:text-neutral-60'
                    : 'bg-neutral-60/60 text-[#30333B] hover:text-neutral-10'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map(partner => (
            <PartnerCard
              key={partner.name}
              partner={partner}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Partners
