import { describe, expect, it } from 'vitest'
import { scrubBreadcrumb, scrubEvent, scrubObject, scrubValue } from './scrub'

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

  it('redacts auth-related keys', () => {
    const result = scrubObject({
      Authorization: 'Bearer secret',
      Cookie: 'session=abc',
      apiKey: 'key-123',
    })

    expect(result.Authorization).toBe('[Redacted]')
    expect(result.Cookie).toBe('[Redacted]')
    expect(result.apiKey).toBe('[Redacted]')
  })
})

describe('scrubEvent', () => {
  it('scrubs string message fields and request bodies', () => {
    const payload = JSON.stringify({
      proofValue: 'x'.repeat(600),
    })

    const event = scrubEvent({
      message: payload,
      logentry: { message: payload, formatted: payload },
      exception: {
        values: [{ type: 'Error', value: payload }],
      },
      request: { data: payload },
    })

    expect(event?.message).toMatch(/^\[Redacted string len=\d+\]$/)
    expect(event?.logentry?.message).toMatch(/^\[Redacted string len=\d+\]$/)
    expect(
      (event?.logentry as { formatted?: string } | undefined)?.formatted
    ).toMatch(/^\[Redacted string len=\d+\]$/)
    expect(event?.exception?.values?.[0]?.value).toMatch(
      /^\[Redacted string len=\d+\]$/
    )
    expect(event?.request?.data).toMatch(/^\[Redacted string len=\d+\]$/)
  })
})

describe('scrubBreadcrumb', () => {
  it('scrubs breadcrumb message and data', () => {
    const payload = JSON.stringify({ proofValue: 'x'.repeat(600) })
    const breadcrumb = scrubBreadcrumb({
      message: payload,
      data: { authorization: 'Bearer secret' },
    })

    expect(breadcrumb?.message).toMatch(/^\[Redacted string len=\d+\]$/)
    expect(breadcrumb?.data).toEqual({ authorization: '[Redacted]' })
  })
})
