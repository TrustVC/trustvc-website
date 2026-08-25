// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  detectVersion,
  OA_UNSUPPORTED_VERSION_MESSAGE,
  OA_UNWRAP_V2_ONLY_MESSAGE,
  OA_V3_WRAP_MESSAGE,
  parseJsonDocument,
  prettyJson,
  unwrapDocument,
  wrapRawDocument,
} from './wrap'
import {
  INVALID_JSON_MESSAGE,
  SAMPLE_RAW_V2_DOCUMENT,
  SAMPLE_RAW_V4_DOCUMENT,
} from './types'
import oaDnsTxtDocstoreV2 from '../../__tests__/__fixtures__/oa/2.0/signed_wrapped_oa_dns_txt_docstore_v2.json'
import oaDnsTxtDocstoreV3 from '../../__tests__/__fixtures__/oa/3.0/signed_wrapped_oa_dns_txt_docstore_v3.json'

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

  it('unwraps an existing wrapped v2 fixture', () => {
    expect(detectVersion(oaDnsTxtDocstoreV2)).toBe('2.0')
    const unwrapped = unwrapDocument(oaDnsTxtDocstoreV2) as {
      issuers?: Array<{ name?: string; documentStore?: string }>
    }
    expect(unwrapped.issuers?.[0]?.name).toBe('Demo Issuer')
    expect(unwrapped.issuers?.[0]?.documentStore).toBe(
      '0xA594f6e10564e87888425c7CC3910FE1c800aB0B'
    )
  })

  it('refuses v3 wrap with the TrustVC deprecation message', async () => {
    const { proof: _proof, ...rawV3 } = oaDnsTxtDocstoreV3
    expect(detectVersion(rawV3)).toBe('3.0')
    await expect(wrapRawDocument(rawV3)).rejects.toThrow(OA_V3_WRAP_MESSAGE)
  })

  it('refuses unwrap of non-v2 documents', () => {
    expect(() => unwrapDocument({ foo: 'bar' })).toThrow(
      OA_UNWRAP_V2_ONLY_MESSAGE
    )
  })

  it('refuses v4 wrap with the TrustVC unsupported-version message', async () => {
    expect(detectVersion(SAMPLE_RAW_V4_DOCUMENT)).toBe('4.0')
    await expect(wrapRawDocument(SAMPLE_RAW_V4_DOCUMENT)).rejects.toThrow(
      OA_UNSUPPORTED_VERSION_MESSAGE
    )
  })
})
