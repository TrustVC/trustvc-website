// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import {
  decryptDocument,
  encryptDocument,
  generateEncryptionKey,
  loadEncryptedFromActionUrl,
  parseEncryptedPayload,
  toEncryptErrorMessage,
  ENCRYPTED_PAYLOAD_OBJECT_MESSAGE,
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

  it('rejects null, arrays, and other non-objects instead of using in on them', () => {
    const nonObjects = ['null', '[]', '42', '"x"', 'true']
    for (const raw of nonObjects) {
      expect(() => parseEncryptedPayload(raw)).toThrow(
        ENCRYPTED_PAYLOAD_OBJECT_MESSAGE
      )
      expect(() => decryptDocument(raw)).toThrow(
        ENCRYPTED_PAYLOAD_OBJECT_MESSAGE
      )
      expect(() => decryptDocument(raw)).not.toThrow(INVALID_JSON_MESSAGE)
    }
  })

  it('keeps INVALID_JSON_MESSAGE for malformed JSON', () => {
    expect(() => parseEncryptedPayload('not-json')).toThrow(
      INVALID_JSON_MESSAGE
    )
    expect(() => decryptDocument('not-json')).toThrow(INVALID_JSON_MESSAGE)
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

  describe('toEncryptErrorMessage', () => {
    it('explains an AES-GCM auth failure as a wrong key or altered payload', () => {
      expect(
        toEncryptErrorMessage(new Error('Error decrypting message'), 'decrypt')
      ).toMatch(/secret key is likely wrong|corrupted|altered/i)
    })

    it('explains a missing key in plain language', () => {
      expect(
        toEncryptErrorMessage(new Error('Missing key'), 'decrypt')
      ).toMatch(/no secret key found/i)
    })

    it('explains missing payload fields with guidance', () => {
      expect(
        toEncryptErrorMessage(new Error('Missing cipherText, iv'), 'decrypt')
      ).toMatch(/missing: cipherText, iv/i)
    })

    it('passes already-friendly messages through unchanged', () => {
      expect(
        toEncryptErrorMessage(new Error(INVALID_JSON_MESSAGE), 'encrypt')
      ).toBe(INVALID_JSON_MESSAGE)
      expect(
        toEncryptErrorMessage(
          new Error(ENCRYPTED_PAYLOAD_OBJECT_MESSAGE),
          'decrypt'
        )
      ).toBe(ENCRYPTED_PAYLOAD_OBJECT_MESSAGE)
    })

    it('falls back to a mode-specific message when there is nothing to go on', () => {
      expect(toEncryptErrorMessage({}, 'encrypt')).toBe(
        'Unable to encrypt this document. Please try again.'
      )
      expect(toEncryptErrorMessage({}, 'decrypt')).toBe(
        'Unable to decrypt this document. Please try again.'
      )
    })
  })
})
