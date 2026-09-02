import { useRef, useState } from 'react'
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
  const requestIdRef = useRef(0)

  const resolve = async (value = domain) => {
    const requestId = ++requestIdRef.current
    setError('')
    setStatus('loading')
    try {
      const records = await lookupDnsRecords(value)
      if (requestId !== requestIdRef.current) return
      setResult(records)
      setStatus(totalDnsRecords(records) === 0 ? 'empty' : 'found')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setResult(null)
      setStatus('failed')
      const message = err instanceof Error ? err.message : ''
      setError(/enter a domain/i.test(message) ? message : 'Get records failed')
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 p-3 sm:p-6 lg:p-8">
      <div
        className={clsx(
          'min-w-0 rounded-xl border p-3 sm:p-5',
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
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row">
          <input
            id="toolkit-dns-domain"
            value={domain}
            onChange={event => {
              requestIdRef.current += 1
              setDomain(event.target.value)
              setStatus('idle')
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') void resolve()
            }}
            placeholder="Enter a domain, e.g. demo.openattestation.com"
            className={clsx(
              'block h-11 w-full max-w-full flex-none rounded-lg border px-3 font-avenir text-sm outline-none sm:min-w-0 sm:flex-1',
              isDarkMode
                ? 'bg-transparent border-white/20 text-neutral-60 placeholder:text-neutral-30'
                : 'bg-white border-neutral-50 text-neutral-10 placeholder:text-neutral-30'
            )}
          />
          <button
            type="button"
            onClick={() => void resolve()}
            disabled={status === 'loading'}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg text-white font-urbanist font-bold bg-gradient-to-r from-primary-50 to-secondary-60 disabled:opacity-50 w-full sm:w-auto shrink-0"
          >
            <ToolkitIcon src={TOOLKIT_ASSETS.search} alt="" size={22} />
            {status === 'loading' ? 'Resolving…' : 'Resolve TXT'}
          </button>
        </div>
        <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
                'w-full break-words rounded-[0.5rem] border px-3 py-1.5 text-center font-urbanist text-[0.875rem] font-bold not-italic leading-[155%] sm:w-auto',
                isDarkMode
                  ? 'border-white/10 text-neutral-60 hover:bg-white/5'
                  : 'border-transparent bg-neutral-60 text-[#30333B] hover:bg-neutral-50/40'
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
        <StatusNote kind="error" message={error || 'Get records failed'} />
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
      'min-w-0 overflow-hidden rounded-xl border',
      isDarkMode ? 'border-white/10' : 'border-neutral-50/33'
    )}
  >
    <div className="flex min-w-0 flex-col justify-between gap-3 px-3 py-4 sm:flex-row sm:items-center sm:px-6">
      <p
        className={clsx(
          'font-urbanist font-bold text-base sm:text-lg break-words text-left',
          isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
        )}
      >
        TXT Record for{' '}
        <span className="break-all font-extrabold">{domain}</span>
      </p>
      <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-start">
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
        className={clsx(
          'font-avenir text-sm sm:text-base text-center max-w-md',
          isDarkMode ? 'text-neutral-50' : 'text-neutral-30'
        )}
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
        'min-w-0 overflow-hidden rounded-xl border',
        isDarkMode ? 'border-white/10' : 'border-neutral-50/33'
      )}
    >
      <div className="flex min-w-0 flex-col justify-between gap-3 px-3 py-4 sm:flex-row sm:items-center sm:px-6">
        <p
          className={clsx(
            'font-urbanist font-bold text-base sm:text-lg break-words',
            isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
          )}
        >
          OpenAttestation records for{' '}
          <span className="break-all font-extrabold">{domain}</span>
        </p>
        <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-start">
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

      <div className="flex max-h-[360px] flex-col gap-3 overflow-y-auto px-3 pb-4 md:hidden">
        {rows.map((row, index) => (
          <DnsResultCard
            key={`${row.kind}-${row.data}-${index}`}
            row={row}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>

      <div className="hidden md:block max-h-[360px] overflow-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className={clsx(
                'text-xs font-urbanist font-bold uppercase tracking-wide sticky top-0',
                isDarkMode
                  ? 'text-neutral-50 bg-neutral-10'
                  : 'text-neutral-30 bg-white'
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
      'flex min-w-0 shrink-0 flex-col gap-2 overflow-hidden rounded-lg border p-3',
      isDarkMode ? 'border-white/10' : 'border-neutral-50/33'
    )}
  >
    <div className="flex flex-col items-start gap-1 text-left">
      <MobileFieldLabel isDarkMode={isDarkMode}>Type</MobileFieldLabel>
      <TypeBadge kind={row.kind} />
    </div>
    <div className="flex min-w-0 flex-col items-start gap-1 text-left">
      <MobileFieldLabel isDarkMode={isDarkMode}>Identity</MobileFieldLabel>
      <p
        className={clsx(
          'w-full break-all text-left font-avenir text-sm',
          isDarkMode ? 'text-neutral-60' : 'text-neutral-20'
        )}
      >
        {row.identity}
      </p>
    </div>
    <div className="flex min-w-0 flex-col items-start gap-1 text-left">
      <MobileFieldLabel isDarkMode={isDarkMode}>Data</MobileFieldLabel>
      <p
        className={clsx(
          'w-full break-all text-left font-mono text-sm',
          isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
        )}
      >
        {row.data}
      </p>
    </div>
    {row.extra && (
      <div className="flex flex-col items-start gap-1 text-left">
        <MobileFieldLabel isDarkMode={isDarkMode}>Meta</MobileFieldLabel>
        <span
          className={clsx(
            'font-avenir text-xs',
            isDarkMode ? 'text-neutral-60' : 'text-[#30333B]'
          )}
        >
          {row.extra}
        </span>
      </div>
    )}
  </div>
)

const MobileFieldLabel = ({
  children,
  isDarkMode,
}: {
  children: string
  isDarkMode: boolean
}) => (
  <span
    className={clsx(
      'font-urbanist text-[0.6875rem] font-bold uppercase tracking-wide',
      isDarkMode ? 'text-primary-90' : 'text-primary-60'
    )}
  >
    {children}
  </span>
)

export default DnsResolverTool
