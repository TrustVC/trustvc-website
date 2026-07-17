import { ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import type { Partner } from '../../../types/partner'

const VERTICAL_TAG_STYLES: Record<string, { light: string; dark: string }> = {
  TradeTrust: {
    light: 'bg-[#B3ECFF] text-[#0B384F]',
    dark: 'bg-[#0B384F] text-[#B3ECFF]',
  },
  OpenCerts: {
    light: 'bg-[#EEF2FF] text-primary-40',
    dark: 'bg-primary-30/30 text-primary-90',
  },
}

const DEFAULT_VERTICAL_STYLE = {
  light: 'bg-neutral-60/60 text-neutral-20',
  dark: 'bg-neutral-20/40 text-neutral-50',
}

interface PartnerCardProps {
  partner: Partner
  isDarkMode: boolean
}

const PartnerCard = ({ partner, isDarkMode }: PartnerCardProps) => {
  const verticalStyle = partner.verticalType
    ? (VERTICAL_TAG_STYLES[partner.verticalType] ?? DEFAULT_VERTICAL_STYLE)
    : null

  return (
    <div
      className={clsx(
        'flex flex-col rounded-xl border p-5',
        isDarkMode
          ? 'bg-[#2A2D35] border-neutral-10'
          : 'bg-white border-neutral-60'
      )}
    >
      {/* Logo */}
      <div className="h-20 flex items-center mb-4">
        <img
          src={partner.logo}
          srcSet={
            partner.logo2x
              ? `${encodeURI(partner.logo)} 1x, ${encodeURI(partner.logo2x)} 2x`
              : undefined
          }
          alt={partner.name}
          className="w-auto max-w-[200px] object-contain"
          style={{ height: '80px' }}
          loading="lazy"
        />
      </div>

      {/* Tags */}
      {(partner.verticalType || partner.category) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {partner.verticalType && verticalStyle && (
            <span
              className={clsx(
                'text-xs font-avenir font-bold px-2.5 py-0.5 rounded-full',
                isDarkMode ? verticalStyle.dark : verticalStyle.light
              )}
            >
              {partner.verticalType}
            </span>
          )}
          {partner.category && (
            <span
              className={clsx(
                'text-xs font-avenir font-bold px-2.5 py-0.5 rounded-full',
                isDarkMode
                  ? 'bg-neutral-20/40 text-neutral-50'
                  : 'bg-neutral-60/60 text-neutral-20'
              )}
            >
              {partner.category}
            </span>
          )}
        </div>
      )}

      {/* Company name */}
      <h3
        className={clsx(
          'font-urbanist font-bold text-base leading-snug',
          isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
        )}
      >
        {partner.name}
      </h3>

      {/* Description */}
      {partner.description && (
        <p
          className={clsx(
            'text-sm font-avenir leading-relaxed mt-2',
            isDarkMode ? 'text-neutral-50' : 'text-neutral-30'
          )}
        >
          {partner.description}
        </p>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Visit Site */}
      {partner.website && (
        <a
          href={partner.website}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            'mt-6 inline-flex items-center gap-1 text-sm font-avenir font-bold transition-colors',
            isDarkMode
              ? 'text-primary-90 hover:text-primary-60'
              : 'text-primary-50 hover:text-primary-40'
          )}
        >
          Visit Site
          <ChevronRight size={14} />
        </a>
      )}
    </div>
  )
}

export default PartnerCard
