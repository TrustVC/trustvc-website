import clsx from 'clsx'
import type { ToolkitTool } from '@/utils/toolkit/types'
import ToolkitIcon from './ToolkitIcon'
import { TOOLKIT_ASSETS } from './assets'

const TABS: {
  id: ToolkitTool
  label: string
  shortLabel: string
  icon: string
}[] = [
  {
    id: 'wrap',
    label: 'Wrap / Unwrap',
    shortLabel: 'Wrap',
    icon: TOOLKIT_ASSETS.wrapTab,
  },
  {
    id: 'dns',
    label: 'DNS Resolver',
    shortLabel: 'DNS',
    icon: TOOLKIT_ASSETS.dnsTab,
  },
  {
    id: 'encrypt',
    label: 'Encrypt / Decrypt',
    shortLabel: 'Encrypt',
    icon: TOOLKIT_ASSETS.encryptTab,
  },
  {
    id: 'revoke',
    label: 'Revoke Document',
    shortLabel: 'Revoke',
    icon: TOOLKIT_ASSETS.revokeTab,
  },
]

type ToolkitTabsProps = {
  active: ToolkitTool
  onChange: (tool: ToolkitTool) => void
  isDarkMode: boolean
}

const ToolkitTabs = ({ active, onChange, isDarkMode }: ToolkitTabsProps) => (
  <div
    className="grid w-full min-w-0 grid-cols-2 sm:grid-cols-4"
    role="tablist"
  >
    {TABS.map((tab, index) => {
      const selected = tab.id === active
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-label={tab.label}
          aria-selected={selected}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'flex w-full min-w-0 items-center justify-center gap-2 px-3 sm:px-4 py-3 border font-urbanist font-bold text-sm sm:text-base',
            index === 0 && 'rounded-tl-2xl',
            index === 1 && 'rounded-tr-2xl sm:rounded-tr-none',
            index === TABS.length - 1 && 'sm:rounded-tr-2xl',
            selected
              ? isDarkMode
                ? 'bg-neutral-10/80 border-white/10 border-b-transparent'
                : 'bg-white border-neutral-50/33 border-b-white'
              : isDarkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-white/40 border-neutral-50/33',
            isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
          )}
        >
          <ToolkitIcon src={tab.icon} alt="" size={24} />
          <span className="truncate sm:hidden">{tab.shortLabel}</span>
          <span className="hidden sm:inline truncate">{tab.label}</span>
        </button>
      )
    })}
  </div>
)

export default ToolkitTabs
