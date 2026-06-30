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

  it('strips hash, q, and sensitive query params from URLs', () => {
    const url =
      'https://trustvc.io/verify?token=abc&apiKey=xyz&safe=keep#{"key":"secret"}'
    const result = scrubValue(url)
    expect(result).toBe('https://trustvc.io/verify?safe=keep')
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

  it('redacts camelCase sensitive keys regardless of casing', () => {
    const result = scrubObject({
      targetHash: 'abc123',
      rawDocument: { data: 'x' },
      fileContent: 'raw bytes',
      fileText: 'plain text',
    })

    expect(result.targetHash).toBe('[Redacted]')
    expect(result.rawDocument).toBe('[Redacted]')
    expect(result.fileContent).toBe('[Redacted]')
    expect(result.fileText).toBe('[Redacted]')
  })
})

describe('scrubEvent', () => {
  it('scrubs string message fields and request bodies', () => {
    const payload = JSON.stringify({
      proofValue: 'x'.repeat(600),
    })

    const event = scrubEvent({
      message: payload,
      logentry: { message: payload, formatted: payload } as {
        message: string
        formatted: string
      },
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

  it('strips hash and q param from request.url', () => {
    const shareUrl =
      'https://trustvc.io/?q=%7B%22type%22%3A%22DOCUMENT%22%7D#{"key":"secret"}'
    const event = scrubEvent({ request: { url: shareUrl } })

    expect(event?.request?.url).not.toContain('#')
    expect(event?.request?.url).not.toContain('?q=')
    expect(event?.request?.url).toBe('https://trustvc.io/')
  })

  it('leaves request.url unchanged when no sensitive params present', () => {
    const event = scrubEvent({ request: { url: 'https://trustvc.io/' } })
    expect(event?.request?.url).toBe('https://trustvc.io/')
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

  it('strips hash and q param from navigation breadcrumb from/to URLs', () => {
    const sensitiveUrl =
      'https://trustvc.io/?q=%7B%22type%22%3A%22DOCUMENT%22%7D#{"key":"secret"}'
    const breadcrumb = scrubBreadcrumb({
      type: 'navigation',
      category: 'navigation',
      data: { from: sensitiveUrl, to: 'https://trustvc.io/' },
    })

    const from = breadcrumb?.data?.from as string
    expect(from).not.toContain('#')
    expect(from).not.toContain('?q=')
    expect(from).toBe('https://trustvc.io/')
    expect(breadcrumb?.data?.to).toBe('https://trustvc.io/')
  })
})
