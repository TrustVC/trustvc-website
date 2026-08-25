// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { extractRevokeTarget, truncateHash } from './revoke'
import { wrapRawDocument } from './wrap'
import { SAMPLE_RAW_V2_DOCUMENT } from './types'

describe('toolkit revoke', () => {
  it('extracts store address and merkle root from a wrapped v2 document', async () => {
    const wrapped = await wrapRawDocument(SAMPLE_RAW_V2_DOCUMENT)
    const target = extractRevokeTarget(wrapped)
    expect(target.storeAddress.toLowerCase()).toBe(
      SAMPLE_RAW_V2_DOCUMENT.issuers[0].documentStore.toLowerCase()
    )
    expect(target.documentHash.startsWith('0x')).toBe(true)
    expect(target.documentHash.length).toBe(66)
  })

  it('truncates hashes for confirm copy', () => {
    expect(truncateHash('0x9a1c8f2e7b3d4a5e6c1f0b2d9e8a7c6b5d4e3f2a')).toMatch(
      /^0x9a1c8f…/
    )
  })
})
