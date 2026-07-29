import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Repeat, Globe, Lock, AlertTriangle, Shield } from 'react-feather'
import { TOOLKIT_TABS, ToolkitTabId, isToolkitTabId } from './tabs'
import WrapUnwrap from '@/components/toolkit/WrapUnwrap'
import DnsResolver from '@/components/toolkit/DnsResolver'
import EncryptDecrypt from '@/components/toolkit/EncryptDecrypt'
import RevokeDocument from '@/components/toolkit/RevokeDocument'

const TAB_ICONS: Record<ToolkitTabId, React.JSX.Element> = {
  wrap: <Repeat size={18} />,
  'dns-resolver': <Globe size={18} />,
  'encrypt-decrypt': <Lock size={18} />,
  revoke: <AlertTriangle size={18} />,
}

const PANELS: Record<ToolkitTabId, React.JSX.Element> = {
  wrap: <WrapUnwrap />,
  'dns-resolver': <DnsResolver />,
  'encrypt-decrypt': <EncryptDecrypt />,
  revoke: <RevokeDocument />,
}

const Toolkit = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: ToolkitTabId = isToolkitTabId(tabParam) ? tabParam : 'wrap'

  const selectTab = (id: ToolkitTabId) => {
    setSearchParams({ tab: id })
  }

  return (
    <main className="w-full min-h-screen bg-[#EDEDFA] pt-[88px]">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pt-8 pb-4 text-center xs:px-6 sm:pt-16 sm:pb-10">
        <h1 className="text-3xl font-extrabold text-neutral-10 xs:text-5xl">
          The TrustVC<span className="text-primary-60"> Toolkit</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-neutral-30 sm:mt-6">
          OpenAttestation was archived in October 2025. To keep OA document
          workflows running without interruption, these four tools have moved
          here and are now maintained under TrustVC, which shares the same
          document lineage as TradeTrust and OpenAttestation. Please note that
          these tools support legacy OA document workflows only.
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-primary-100 bg-primary-100/30 px-4 py-1 text-xs font-semibold text-primary-30 sm:mt-8">
          <Shield size={14} />
          Built For Developers
        </span>
        <h2 className="mt-3 text-3xl font-extrabold text-neutral-10 sm:mt-4">
          Interactive Developer <span className="text-primary-60">Toolkit</span>
        </h2>
        <p className="mt-2 text-sm text-neutral-30 sm:mt-3">
          Four essential tools for working with OpenAttestation documents — no
          server calls, everything runs in your browser.
        </p>
      </section>

      {/* Tabs + active panel */}
      <section className="mx-auto max-w-6xl px-4 pb-24 xs:px-6">
        <div
          role="tablist"
          className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden"
        >
          {TOOLKIT_TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={tab.id === activeTab}
              onClick={() => selectTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-semibold sm:px-5 sm:py-3 ${
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

      <Link
        to="/#verify"
        className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-1.5 sm:bottom-6 sm:right-6 sm:gap-2"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-60 to-secondary-60 text-white shadow-lg transition-opacity hover:opacity-90 sm:h-14 sm:w-14">
          <Shield size={20} />
        </span>
        <span className="whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-10 shadow-md sm:px-4 sm:py-2 sm:text-sm">
          Verify Document
        </span>
      </Link>
    </main>
  )
}

export default Toolkit
