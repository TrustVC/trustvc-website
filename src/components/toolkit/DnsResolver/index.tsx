import { useState } from 'react'
import { Globe } from 'react-feather'
import { getDocumentStoreRecords, getDnsDidRecords } from '@trustvc/trustvc'
import { ToolCard, StatusAlert } from '@/components/toolkit/shared'

type DnsStatus = 'initial' | 'loading' | 'done' | 'error'

const DnsResolver = () => {
  const [domain, setDomain] = useState('')
  const [status, setStatus] = useState<DnsStatus>('initial')
  const [error, setError] = useState('')
  const [txtRecords, setTxtRecords] = useState<Record<string, unknown>[]>([])
  const [didRecords, setDidRecords] = useState<Record<string, unknown>[]>([])

  const resolve = async () => {
    if (!domain.trim()) {
      setStatus('error')
      setError('Enter a domain to resolve.')
      return
    }
    setStatus('loading')
    setError('')
    try {
      const [txt, did] = await Promise.all([
        getDocumentStoreRecords(domain.trim()),
        getDnsDidRecords(domain.trim()),
      ])
      setTxtRecords(txt as never)
      setDidRecords(did as never)
      setStatus('done')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'DNS resolution failed')
    }
  }

  const hasRecords = txtRecords.length > 0 || didRecords.length > 0

  return (
    <ToolCard
      icon={<Globe size={22} />}
      title="DNS Resolver"
      description="Look up the OpenAttestation DNS-TXT and DNS-DID records published on a domain to see which document stores and DIDs it endorses."
    >
      <div className="mb-6 flex flex-col gap-3 xl:flex-row">
        <div className="flex-1">
          <label
            htmlFor="dns-domain"
            className="mb-2 block text-sm font-semibold text-neutral-10"
          >
            Domain
          </label>
          <input
            id="dns-domain"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="e.g. example.openattestation.com"
            className="w-full rounded-lg border border-neutral-60 px-3 py-2 text-sm focus:border-primary-60 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={resolve}
          disabled={status === 'loading'}
          className="self-end rounded-lg bg-primary-60 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-50 disabled:opacity-50"
        >
          {status === 'loading' ? 'Resolving…' : 'Resolve'}
        </button>
      </div>

      {status === 'error' && <StatusAlert variant="error">{error}</StatusAlert>}

      {status === 'done' && !hasRecords && (
        <StatusAlert variant="info">
          No records found on this domain.
        </StatusAlert>
      )}

      {status === 'done' && hasRecords && (
        <div className="flex flex-col gap-6">
          {txtRecords.length > 0 && (
            <RecordTable
              title="DNS-TXT (document stores)"
              records={txtRecords}
            />
          )}
          {didRecords.length > 0 && (
            <RecordTable title="DNS-DID" records={didRecords} />
          )}
        </div>
      )}
    </ToolCard>
  )
}

const RecordTable = ({
  title,
  records,
}: {
  title: string
  records: Record<string, unknown>[]
}) => {
  const columns = Object.keys(records[0])
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-neutral-10">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-neutral-60">
        <table className="w-full text-left text-sm">
          <thead className="bg-primary-100/20 text-neutral-10">
            <tr>
              {columns.map(c => (
                <th key={c} className="px-4 py-2 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i} className="border-t border-neutral-60">
                {columns.map(c => (
                  <td key={c} className="px-4 py-2 font-mono text-xs">
                    {String(r[c] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DnsResolver
