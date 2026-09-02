import {
  getDnsDidRecords,
  getDocumentStoreRecords,
  type OpenAttestationDnsDidRecord,
  type OpenAttestationDNSTextRecord,
} from '@trustvc/trustvc'

export type DnsLookupStatus = 'idle' | 'loading' | 'found' | 'empty' | 'failed'

export type DnsLookupResult = {
  did: OpenAttestationDnsDidRecord[]
  txt: OpenAttestationDNSTextRecord[]
}

export const lookupDnsRecords = async (
  domain: string
): Promise<DnsLookupResult> => {
  const location = domain.trim()
  if (!location) {
    throw new Error('Enter a domain, e.g. example.openattestation.com')
  }
  const [did, txt] = await Promise.all([
    getDnsDidRecords(location),
    getDocumentStoreRecords(location),
  ])
  return { did, txt }
}

export const totalDnsRecords = (result: DnsLookupResult): number =>
  result.did.length + result.txt.length
