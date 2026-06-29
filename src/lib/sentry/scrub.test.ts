import { describe, expect, it } from 'vitest'
import { scrubObject, scrubValue } from './scrub'

describe('scrubValue', () => {
  it('redacts sensitive keys in objects', () => {
    const result = scrubObject({
      fileName: 'doc.json',
      proofValue: 'long-sensitive-proof',
      credential: { id: 'abc' },
    })

    expect(result.fileName).toBe('doc.json')
    expect(result.proofValue).toBe('[Redacted]')
    expect(result.credential).toBe('[Redacted]')
  })

  it('redacts long credential-like strings', () => {
    const payload = JSON.stringify({
      proofValue: 'x'.repeat(600),
      merkleRoot: 'abc',
    })

    const result = scrubValue(payload)
    expect(result).toMatch(/^\[Redacted string len=\d+\]$/)
  })

  it('preserves short non-sensitive strings', () => {
    expect(scrubValue('DNS-TXT')).toBe('DNS-TXT')
  })
})

describe('scrubObject', () => {
  it('redacts nested sensitive keys', () => {
    const result = scrubObject({
      verification: {
        issuer_identity: 'example.com',
        proof: { value: 'secret' },
      },
    })

    expect(result.verification).toEqual({
      issuer_identity: 'example.com',
      proof: '[Redacted]',
    })
  })
})
