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
  <div className="flex w-full justify-center">
    <div
      className="flex w-fit max-w-full flex-wrap sm:flex-nowrap items-end justify-center gap-1"
      role="tablist"
    >
      {TABS.map(tab => {
        const selected = tab.id === active
        let tabText = 'text-neutral-30'
        if (selected) {
          tabText = isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
        }
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-label={tab.label}
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex min-w-[9.5rem] sm:min-w-[13.5rem] shrink-0 cursor-pointer items-center justify-center gap-2 px-4 sm:px-6 py-3 font-urbanist font-bold not-italic text-[1.125rem] leading-[136%] rounded-t-xl border border-neutral-50/33',
              selected && 'relative z-10 border-b-transparent bg-base-66-l1',
              !selected && 'bg-white/33',
              tabText
            )}
          >
            <ToolkitIcon src={tab.icon} alt="" size={24} />
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  </div>
)

export default ToolkitTabs
