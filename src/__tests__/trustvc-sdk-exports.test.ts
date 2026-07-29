import { describe, it, expect } from 'vitest'
import * as trustvc from '@trustvc/trustvc'

describe('TrustVC SDK exports required by the toolkit page', () => {
  it.each([
    'wrapOADocument',
    'getDataV2',
    'diagnose',
    'isRawV2Document',
    'isRawV3Document',
    'isWrappedV2Document',
    'isWrappedV3Document',
    'encryptString',
    'decryptString',
    'getDocumentStoreRecords',
    'getDnsDidRecords',
    'documentStoreRevoke',
  ])('exports %s', name => {
    expect(trustvc[name as keyof typeof trustvc]).toBeDefined()
  })
})
