// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import {
  decryptDocument,
  encryptDocument,
  generateEncryptionKey,
  loadEncryptedFromActionUrl,
  parseEncryptedPayload,
} from './encrypt'
import { INVALID_JSON_MESSAGE } from './types'

describe('toolkit encrypt', () => {
  it('round-trips a document', () => {
    const key = generateEncryptionKey()
    const raw = JSON.stringify({ hello: 'world' })
    const encrypted = encryptDocument(raw, key)
    expect(encrypted.cipherText).toBeTruthy()
    expect(encrypted.iv).toBeTruthy()
    expect(encrypted.tag).toBeTruthy()
    expect(encrypted.type).toBe('OPEN-ATTESTATION-TYPE-1')
    expect(encrypted).not.toHaveProperty('key')

    const decrypted = decryptDocument(JSON.stringify({ ...encrypted, key }))
    expect(JSON.parse(decrypted)).toEqual({ hello: 'world' })
  })

  it('decrypts using the key field when the payload omits key', () => {
    const key = generateEncryptionKey()
    const raw = JSON.stringify({ hello: 'world' })
    const encrypted = encryptDocument(raw, key)
    const decrypted = decryptDocument(JSON.stringify(encrypted), key)
    expect(JSON.parse(decrypted)).toEqual({ hello: 'world' })
  })

  it('rejects invalid JSON before encrypting', () => {
    expect(() => encryptDocument('not-json', generateEncryptionKey())).toThrow(
      INVALID_JSON_MESSAGE
    )
  })

  it('rejects a payload missing required fields', () => {
    expect(() =>
      parseEncryptedPayload(JSON.stringify({ cipherText: 'x' }))
    ).toThrow(/Missing/)
  })

  it('loads an encrypted document from an action URL', async () => {
    const payload = {
      cipherText: 'aaa',
      iv: 'bbb',
      tag: 'ccc',
      type: 'OPEN-ATTESTATION-TYPE-1',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => payload,
      })
    )
    const action = encodeURIComponent(
      JSON.stringify({
        type: 'DOCUMENT',
        payload: { uri: 'https://example.com/doc.json' },
      })
    )
    const anchor = encodeURIComponent(JSON.stringify({ key: 'abc123' }))
    const loaded = await loadEncryptedFromActionUrl(
      `https://trustvc.io/?q=${action}#${anchor}`
    )
    expect(loaded.key).toBe('abc123')
    expect(loaded.payload.cipherText).toBe('aaa')
    expect(loaded.payload.key).toBe('abc123')
    vi.unstubAllGlobals()
  })

  it('rejects a 2xx action-URL response that is not an encrypted payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ document: { hello: 'world' } }),
      })
    )
    const action = encodeURIComponent(
      JSON.stringify({
        type: 'DOCUMENT',
        payload: { uri: 'https://example.com/doc.json' },
      })
    )
    const anchor = encodeURIComponent(JSON.stringify({ key: 'abc123' }))
    await expect(
      loadEncryptedFromActionUrl(`https://trustvc.io/?q=${action}#${anchor}`)
    ).rejects.toThrow(/Missing/)
    vi.unstubAllGlobals()
  })
})
