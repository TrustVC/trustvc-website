import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Repeat, Globe, Lock, AlertTriangle } from 'react-feather'
import { TOOLKIT_TABS, ToolkitTabId, isToolkitTabId } from './tabs'
import WrapUnwrap from '@/components/toolkit/WrapUnwrap'
import DnsResolver from '@/components/toolkit/DnsResolver'

const TAB_ICONS: Record<ToolkitTabId, React.JSX.Element> = {
  wrap: <Repeat size={18} />,
  'dns-resolver': <Globe size={18} />,
  'encrypt-decrypt': <Lock size={18} />,
  revoke: <AlertTriangle size={18} />,
}

// Placeholder panels — replaced by real tools in Tasks 5–8
const PANELS: Record<ToolkitTabId, React.JSX.Element> = {
  wrap: <WrapUnwrap />,
  'dns-resolver': <DnsResolver />,
  'encrypt-decrypt': <div data-testid="panel-encrypt-decrypt" />,
  revoke: <div data-testid="panel-revoke" />,
}

const Toolkit = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: ToolkitTabId = isToolkitTabId(tabParam) ? tabParam : 'wrap'

  const selectTab = (id: ToolkitTabId) => {
    setSearchParams({ tab: id })
  }

  return (
    <main className="min-h-screen bg-[#EDEDFA]">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pt-16 pb-10 text-center xs:px-6">
        <h1 className="text-4xl font-extrabold text-neutral-10 xs:text-5xl">
          The TrustVC<span className="text-primary-60"> Toolkit</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-neutral-30">
          OpenAttestation was archived in October 2025. To keep OA document
          workflows running without interruption, these four tools have moved
          here and are now maintained under TrustVC, which shares the same
          document lineage as TradeTrust and OpenAttestation. Please note that
          these tools support legacy OA document workflows only.
        </p>
        <span className="mt-8 inline-block rounded-full border border-primary-100 bg-white px-4 py-1 text-xs font-semibold text-primary-40">
          Built For Developers
        </span>
        <h2 className="mt-4 text-3xl font-extrabold text-neutral-10">
          Interactive Developer <span className="text-primary-60">Toolkit</span>
        </h2>
        <p className="mt-3 text-sm text-neutral-30">
          Four essential tools for working with OpenAttestation documents — no
          server calls, everything runs in your browser.
        </p>
      </section>

      {/* Tabs + active panel */}
      <section className="mx-auto max-w-6xl px-4 pb-24 xs:px-6">
        <div role="tablist" className="flex flex-wrap gap-1">
          {TOOLKIT_TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={tab.id === activeTab}
              onClick={() => selectTab(tab.id)}
              className={`flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-semibold ${
                tab.id === activeTab
                  ? 'bg-white text-neutral-10'
                  : 'bg-white/50 text-neutral-30 hover:bg-white/80'
              }`}
            >
              {TAB_ICONS[tab.id]}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="rounded-b-2xl rounded-tr-2xl">{PANELS[activeTab]}</div>
      </section>
    </main>
  )
}

export default Toolkit
