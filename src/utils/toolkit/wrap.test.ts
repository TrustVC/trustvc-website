// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  detectVersion,
  parseJsonDocument,
  prettyJson,
  unwrapDocument,
  wrapRawDocument,
} from './wrap'
import { INVALID_JSON_MESSAGE, SAMPLE_RAW_V2_DOCUMENT } from './types'

describe('toolkit wrap', () => {
  it('rejects non-JSON', () => {
    const result = parseJsonDocument('not json')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe(INVALID_JSON_MESSAGE)
    }
  })

  it('wraps a v2 document and unwraps it back', async () => {
    const wrapped = await wrapRawDocument(SAMPLE_RAW_V2_DOCUMENT)
    expect(detectVersion(wrapped)).toBe('2.0')
    const unwrapped = unwrapDocument(wrapped) as typeof SAMPLE_RAW_V2_DOCUMENT
    expect(unwrapped.recipient?.name).toBe('Alice Lim')
    expect(prettyJson(wrapped)).toContain('signature')
  })

  it('refuses unwrap of non-v2 documents', () => {
    expect(() => unwrapDocument({ foo: 'bar' })).toThrow(
      /only supported for OpenAttestation v2/i
    )
  })

  it('surfaces a v4 error instead of wrapping', async () => {
    await expect(
      wrapRawDocument({
        version: 'https://schema.openattestation.com/4.0/schema.json',
      })
    ).rejects.toThrow(/v4 wrap is not available/i)
  })
})
