import { useState } from 'react'
import clsx from 'clsx'
import type { ToolkitTool } from '@/utils/toolkit/types'
import ToolkitIcon from './ToolkitIcon'
import { TOOLKIT_ASSETS } from './assets'
import ToolkitHero from './ToolkitHero'
import ToolkitTabs from './ToolkitTabs'
import WrapUnwrapTool from './WrapUnwrapTool'
import DnsResolverTool from './DnsResolverTool'
import EncryptDecryptTool from './EncryptDecryptTool'
import RevokeDocumentTool from './RevokeDocumentTool'

const TOOL_COPY: Record<
  ToolkitTool,
  { title: string; description: string; icon: string }
> = {
  wrap: {
    title: 'Wrap / Unwrap',
    description:
      'Wrap raw JSON into an OpenAttestation / TradeTrust wrapped document, or unwrap one back to plain JSON for inspection. Wrapping produces the legacy OA format.',
    icon: TOOLKIT_ASSETS.wrapIcon,
  },
  dns: {
    title: 'DNS Resolver',
    description:
      "Enter a domain to fetch its TXT records — the same lookup verifiers use to confirm a document store address or DID is legitimately linked to the issuer's domain via a DNS-TXT identity proof.",
    icon: TOOLKIT_ASSETS.dnsTab,
  },
  encrypt: {
    title: 'Encrypt / Decrypt',
    description:
      "Paste a document's JSON payload and a key to encrypt it before sharing with a restricted party — or paste an encrypted payload with the matching key to decrypt it back to plain JSON.",
    icon: TOOLKIT_ASSETS.lockIcon,
  },
  revoke: {
    title: 'Revoke Document',
    description:
      "Submit a document's hash to its document store smart contract to permanently revoke it on-chain.",
    icon: TOOLKIT_ASSETS.warningTriangle,
  },
}

type ToolkitSectionProps = {
  active: ToolkitTool
  onChange: (tool: ToolkitTool) => void
  isDarkMode: boolean
}

const ToolkitSection = ({
  active,
  onChange,
  isDarkMode,
}: ToolkitSectionProps) => {
  const copy = TOOL_COPY[active]
  const [encryptSampleTick, setEncryptSampleTick] = useState(0)

  return (
    <div className="w-full min-w-0">
      <ToolkitHero isDarkMode={isDarkMode} />
      <div className="flex flex-col items-center gap-4 mt-8 mb-6 text-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#dfe1ff] px-2 py-0.5">
          <ToolkitIcon src={TOOLKIT_ASSETS.shield} alt="" size={16} />
          <span className="font-urbanist font-bold text-xs text-primary-30">
            Built For Developers
          </span>
        </span>
        <h2 className="font-urbanist font-extrabold text-[28px] sm:text-[32px] lg:text-[38px] leading-tight lg:leading-[60px] px-2">
          <span
            className={clsx(isDarkMode ? 'text-neutral-60' : 'text-neutral-10')}
          >
            Interactive Developer{' '}
          </span>
          <span className="text-primary-60">Toolkit</span>
        </h2>
        <p
          className={clsx(
            'max-w-[520px] font-avenir text-lg leading-[25.6px]',
            isDarkMode ? 'text-neutral-50' : 'text-neutral-20'
          )}
        >
          Four essential tools for working with OpenAttestation documents.
        </p>
      </div>
      <div className="w-full min-w-0">
        <ToolkitTabs
          active={active}
          onChange={onChange}
          isDarkMode={isDarkMode}
        />
        <div
          className={clsx(
            'rounded-b-2xl border border-t-0 shadow-[0px_4px_48px_0px_rgba(104,106,210,0.08),0px_1px_4px_0px_rgba(0,0,0,0.04)] overflow-hidden -mt-px',
            isDarkMode
              ? 'bg-neutral-10/70 border-white/10'
              : 'bg-white border-neutral-50/33'
          )}
        >
          <div
            className={clsx(
              'flex items-center gap-3 px-4 sm:px-6 py-4 border-b',
              isDarkMode ? 'border-white/10' : 'border-[#f3f4f6]'
            )}
          >
            <div className="w-10 h-10 sm:w-[53px] sm:h-[53px] rounded-[10px] bg-[#dfe1ff] flex items-center justify-center shrink-0">
              <ToolkitIcon src={copy.icon} alt="" size={24} />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <h3
                className={clsx(
                  'font-urbanist font-bold not-italic text-[1.125rem] leading-[1.21875rem] text-left',
                  isDarkMode ? 'text-neutral-60' : 'text-[#1E2026]'
                )}
              >
                {copy.title}
              </h3>
              <p
                className="font-avenir font-normal not-italic text-[0.875rem] leading-[1.125rem] mt-1 text-left"
                style={{
                  color: isDarkMode ? '#A9B2BB' : '#5B6571',
                  WebkitTextFillColor: isDarkMode ? '#A9B2BB' : '#5B6571',
                  background: 'none',
                  backgroundClip: 'initial',
                  WebkitBackgroundClip: 'initial',
                  textAlign: 'left',
                }}
              >
                {copy.description}
              </p>
            </div>
            {active === 'encrypt' && (
              <button
                type="button"
                onClick={() => setEncryptSampleTick(tick => tick + 1)}
                className={clsx(
                  'shrink-0 inline-flex items-center gap-1.5 font-urbanist font-bold text-sm self-start sm:self-center',
                  isDarkMode ? 'text-primary-90' : 'text-primary-50'
                )}
              >
                <ToolkitIcon src={TOOLKIT_ASSETS.download} alt="" size={18} />
                Load sample document
              </button>
            )}
          </div>
          {active === 'wrap' && <WrapUnwrapTool isDarkMode={isDarkMode} />}
          {active === 'dns' && <DnsResolverTool isDarkMode={isDarkMode} />}
          {active === 'encrypt' && (
            <EncryptDecryptTool
              isDarkMode={isDarkMode}
              sampleTick={encryptSampleTick}
            />
          )}
          {active === 'revoke' && (
            <RevokeDocumentTool isDarkMode={isDarkMode} />
          )}
        </div>
      </div>
    </div>
  )
}

export default ToolkitSection
