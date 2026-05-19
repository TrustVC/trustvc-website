import clsx from 'clsx'
import { type Capability } from '../../../data/capabilities'

const TAG_STYLES: Record<string, { background: string; color: string }> = {
  'Transferable Record': { background: '#dfe1ff', color: '#312d62' },
  'Verifiable Document': { background: '#b3ecff', color: '#0b384f' },
}

interface CapabilityCardProps {
  cap: Capability
  isDarkMode: boolean
}

const CapabilityCard = ({ cap, isDarkMode }: CapabilityCardProps) => (
  <div
    className={clsx(
      'rounded-2xl p-6 flex flex-col gap-4 border',
      isDarkMode
        ? 'bg-neutral-20/30 border-neutral-20/60'
        : 'bg-white border-neutral-60/60'
    )}
  >
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
              ...TAG_STYLES[tag],
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>

    <h3
      className={clsx(
        'font-gilroy font-bold',
        isDarkMode ? 'text-neutral-60' : 'text-[#1E2026]'
      )}
      style={{ fontSize: '18px', lineHeight: '136%' }}
    >
      {cap.title}
    </h3>

    <p
      className="font-avenir"
      style={{
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: '155%',
        textAlign: 'left',
        color: isDarkMode ? '#8B929A' : '#3D444D',
        WebkitTextFillColor: isDarkMode ? '#8B929A' : '#3D444D',
      }}
    >
      {cap.description}
    </p>
  </div>
)

export default CapabilityCard
