import { useState } from 'react'
import clsx from 'clsx'
import { DNS_SAMPLE_DOMAINS } from '@/utils/toolkit/types'
import {
  lookupDnsRecords,
  totalDnsRecords,
  type DnsLookupResult,
  type DnsLookupStatus,
} from '@/utils/toolkit/dns'
import ToolkitIcon from './ToolkitIcon'
import { TOOLKIT_ASSETS } from './assets'
import StatusNote from './StatusNote'

type DnsResolverToolProps = {
  isDarkMode: boolean
}

const DnsResolverTool = ({ isDarkMode }: DnsResolverToolProps) => {
  const [domain, setDomain] = useState('')
  const [status, setStatus] = useState<DnsLookupStatus>('idle')
  const [result, setResult] = useState<DnsLookupResult | null>(null)
  const [error, setError] = useState('')

  const resolve = async (value = domain) => {
    setError('')
    setStatus('loading')
    try {
      const records = await lookupDnsRecords(value)
      setResult(records)
      setStatus(totalDnsRecords(records) === 0 ? 'empty' : 'found')
    } catch (err) {
      setResult(null)
      setStatus('failed')
      setError(err instanceof Error ? err.message : 'Get records failed')
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <div
        className={clsx(
          'rounded-xl border p-4 sm:p-5',
          isDarkMode ? 'border-white/10' : 'border-neutral-50/33'
        )}
      >
        <label
          htmlFor="toolkit-dns-domain"
          className={clsx(
            'block font-urbanist font-bold text-base sm:text-lg mb-2',
            isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
          )}
        >
          Domain:
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="toolkit-dns-domain"
            value={domain}
            onChange={event => {
              setDomain(event.target.value)
              setStatus('idle')
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') void resolve()
            }}
            placeholder="Enter a domain, e.g. demo.openattestation.com"
            className={clsx(
              'flex-1 min-w-0 h-11 px-3 rounded-lg border text-sm font-avenir outline-none',
              isDarkMode
                ? 'bg-transparent border-white/20 text-neutral-60 placeholder:text-neutral-30'
                : 'bg-white border-neutral-50 text-neutral-10 placeholder:text-neutral-30'
            )}
          />
          <button
            type="button"
            onClick={() => void resolve()}
            disabled={status === 'loading'}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg text-white font-urbanist font-bold bg-gradient-to-r from-primary-60 to-secondary-60 disabled:opacity-50 w-full sm:w-auto shrink-0"
          >
            <ToolkitIcon src={TOOLKIT_ASSETS.search} alt="" size={22} />
            {status === 'loading' ? 'Resolving…' : 'Resolve TXT'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span
            className={clsx(
              'text-sm font-urbanist font-bold',
              isDarkMode ? 'text-neutral-50' : 'text-neutral-30'
            )}
          >
            TRY:
          </span>
          {DNS_SAMPLE_DOMAINS.map(sample => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setDomain(sample)
                void resolve(sample)
              }}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs sm:text-sm font-avenir border break-all',
                isDarkMode
                  ? 'border-white/10 text-neutral-60 hover:bg-white/5'
                  : 'border-neutral-50/33 text-neutral-20 hover:bg-black/5'
              )}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {status === 'empty' && (
        <DnsEmptyState
          domain={domain}
          isDarkMode={isDarkMode}
          onRefresh={() => void resolve()}
        />
      )}
      {status === 'failed' && (
        <StatusNote
          kind="error"
          isDarkMode={isDarkMode}
          message={error || 'Get records failed'}
        />
      )}
      {status === 'found' && result && (
        <DnsResultsTable
          domain={domain}
          result={result}
          isDarkMode={isDarkMode}
          onRefresh={() => void resolve()}
        />
      )}
    </div>
  )
}

const DnsEmptyState = ({
  domain,
  isDarkMode,
  onRefresh,
}: {
  domain: string
  isDarkMode: boolean
  onRefresh: () => void
}) => (
  <div
    className={clsx(
      'rounded-xl border overflow-hidden',
      isDarkMode ? 'border-white/10' : 'border-neutral-50/33'
    )}
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-6 py-4 min-w-0">
      <p
        className={clsx(
          'font-urbanist font-bold text-base sm:text-lg break-words text-left',
          isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
        )}
        style={{
          background: 'none',
          backgroundClip: 'initial',
          WebkitBackgroundClip: 'initial',
          WebkitTextFillColor: 'currentColor',
          textAlign: 'left',
        }}
      >
        TXT Record for <span className="font-extrabold">{domain}</span>
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={clsx(
            'text-sm font-avenir',
            isDarkMode ? 'text-neutral-50' : 'text-neutral-30'
          )}
        >
          0 Records found
        </span>
        <button type="button" onClick={onRefresh} aria-label="Refresh records">
          <ToolkitIcon src={TOOLKIT_ASSETS.refresh} alt="" size={24} />
        </button>
      </div>
    </div>
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 sm:py-20">
      <ToolkitIcon src={TOOLKIT_ASSETS.dnsTab} alt="" size={56} />
      <p
        className="font-avenir text-sm sm:text-base text-center max-w-md"
        style={{
          color: isDarkMode ? '#A9B2BB' : '#5B6571',
          WebkitTextFillColor: isDarkMode ? '#A9B2BB' : '#5B6571',
          background: 'none',
          backgroundClip: 'initial',
          WebkitBackgroundClip: 'initial',
        }}
      >
        No TXT records found for {domain}.
      </p>
    </div>
  </div>
)

type DnsRow = {
  kind: 'DID' | 'TXT'
  identity: string
  data: string
  extra?: string
}

const DnsResultsTable = ({
  domain,
  result,
  isDarkMode,
  onRefresh,
}: {
  domain: string
  result: DnsLookupResult
  isDarkMode: boolean
  onRefresh: () => void
}) => {
  const rows: DnsRow[] = [
    ...result.did.map(record => ({
      kind: 'DID' as const,
      identity: record.algorithm,
      data: record.publicKey,
      extra: record.version,
    })),
    ...result.txt.map(record => ({
      kind: 'TXT' as const,
      identity: `${record.net} / ${record.netId}`,
      data: record.addr,
      extra: record.type,
    })),
  ]

  return (
    <div
      className={clsx(
        'rounded-xl border overflow-hidden',
        isDarkMode ? 'border-white/10' : 'border-neutral-50/33'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-6 py-4 min-w-0">
        <p
          className={clsx(
            'font-urbanist font-bold text-base sm:text-lg break-words',
            isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
          )}
        >
          TXT records for <span className="font-extrabold">{domain}</span>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={clsx(
              'text-sm font-avenir',
              isDarkMode ? 'text-neutral-50' : 'text-neutral-30'
            )}
          >
            {rows.length} record{rows.length === 1 ? '' : 's'} found
          </span>
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh records"
          >
            <ToolkitIcon src={TOOLKIT_ASSETS.refresh} alt="" size={24} />
          </button>
        </div>
      </div>

      <div className="md:hidden flex flex-col gap-3 px-4 pb-4">
        {rows.map((row, index) => (
          <DnsResultCard
            key={`${row.kind}-${row.data}-${index}`}
            row={row}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className={clsx(
                'text-xs font-urbanist font-bold uppercase tracking-wide',
                isDarkMode ? 'text-neutral-50' : 'text-neutral-30'
              )}
            >
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Identity</th>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Meta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.kind}-${row.data}-${index}`}
                className={clsx(
                  'border-t text-sm font-avenir',
                  isDarkMode
                    ? 'border-white/10 text-neutral-60'
                    : 'border-neutral-50/33 text-neutral-20'
                )}
              >
                <td className="px-6 py-4">
                  <TypeBadge kind={row.kind} />
                </td>
                <td className="px-6 py-4">{row.identity}</td>
                <td className="px-6 py-4 break-all">{row.data}</td>
                <td className="px-6 py-4">{row.extra}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const TypeBadge = ({ kind }: { kind: 'DID' | 'TXT' }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#dfe1ff] text-[#312d62] text-xs font-urbanist font-bold">
    {kind}
  </span>
)

const DnsResultCard = ({
  row,
  isDarkMode,
}: {
  row: DnsRow
  isDarkMode: boolean
}) => (
  <div
    className={clsx(
      'rounded-lg border p-3 flex flex-col gap-2',
      isDarkMode ? 'border-white/10' : 'border-neutral-50/33'
    )}
  >
    <div className="flex items-center justify-between gap-2">
      <TypeBadge kind={row.kind} />
      {row.extra && (
        <span
          className={clsx(
            'text-xs font-avenir',
            isDarkMode ? 'text-neutral-50' : 'text-neutral-30'
          )}
        >
          {row.extra}
        </span>
      )}
    </div>
    <p
      className={clsx(
        'text-sm font-avenir break-all',
        isDarkMode ? 'text-neutral-60' : 'text-neutral-20'
      )}
    >
      {row.identity}
    </p>
    <p
      className={clsx(
        'text-sm font-mono break-all',
        isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
      )}
    >
      {row.data}
    </p>
  </div>
)

export default DnsResolverTool
