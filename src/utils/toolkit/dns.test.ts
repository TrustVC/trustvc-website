import { describe, expect, it, vi } from 'vitest'
import { lookupDnsRecords, totalDnsRecords } from './dns'

vi.mock('@trustvc/trustvc', () => ({
  getDnsDidRecords: vi.fn(),
  getDocumentStoreRecords: vi.fn(),
}))

import { getDnsDidRecords, getDocumentStoreRecords } from '@trustvc/trustvc'

describe('toolkit dns', () => {
  it('requires a domain', async () => {
    await expect(lookupDnsRecords('   ')).rejects.toThrow(/enter a domain/i)
  })

  it('returns DID and TXT records', async () => {
    vi.mocked(getDnsDidRecords).mockResolvedValue([
      {
        type: 'openatts',
        algorithm: 'dns-did',
        publicKey: 'did:ethr:0xabc#controller',
        version: '1.0',
      },
    ])
    vi.mocked(getDocumentStoreRecords).mockResolvedValue([
      {
        type: 'openatts',
        net: 'ethereum',
        netId: '1',
        addr: '0x123',
      },
    ])

    const result = await lookupDnsRecords('example.openattestation.com')
    expect(result.did).toHaveLength(1)
    expect(result.txt).toHaveLength(1)
    expect(totalDnsRecords(result)).toBe(2)
  })

  it('propagates lookup failures', async () => {
    vi.mocked(getDnsDidRecords).mockRejectedValue(new Error('dns down'))
    vi.mocked(getDocumentStoreRecords).mockRejectedValue(new Error('dns down'))
    await expect(lookupDnsRecords('example.com')).rejects.toThrow('dns down')
  })
})
