import {
  diagnose,
  getDataV2,
  isRawV2Document,
  isRawV3Document,
  isWrappedV2Document,
  isWrappedV3Document,
  wrapOADocument,
} from '@trustvc/trustvc'
import { INVALID_JSON_MESSAGE, type DocVersion } from './types'

export type ParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string }

export const parseJsonDocument = (raw: string): ParseResult => {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: false, error: 'Paste a document JSON first.' }
  }
  try {
    return { ok: true, value: JSON.parse(trimmed) }
  } catch {
    return { ok: false, error: INVALID_JSON_MESSAGE }
  }
}

export const detectVersion = (document: unknown): DocVersion | null => {
  if (isRawV2Document(document) || isWrappedV2Document(document)) {
    return '2.0'
  }
  if (isRawV3Document(document) || isWrappedV3Document(document)) {
    return '3.0'
  }
  if (looksLikeV4(document)) {
    return '4.0'
  }
  return null
}

const looksLikeV4 = (document: unknown): boolean => {
  if (!document || typeof document !== 'object') return false
  const record = document as Record<string, unknown>
  const version = record.version
  if (typeof version === 'string' && version.includes('4.0')) return true
  const context = record['@context']
  if (Array.isArray(context)) {
    return context.some(
      item => typeof item === 'string' && item.includes('open-attestation/4')
    )
  }
  return false
}

export const isRawDocument = (document: unknown): boolean =>
  isRawV2Document(document) ||
  isRawV3Document(document) ||
  looksLikeV4(document)

export const diagnoseDocument = (
  document: unknown,
  version: DocVersion,
  kind: 'raw' | 'wrapped'
): { message: string }[] => {
  if (version === '4.0') {
    return [
      {
        message:
          'OA v4 wrap is not available on the TrustVC stack. Use v2, or migrate to W3C VC.',
      },
    ]
  }
  return diagnose({
    version,
    kind,
    document,
    debug: false,
    mode: 'strict',
  })
}

export const wrapRawDocument = async (document: unknown): Promise<unknown> => {
  const version = detectVersion(document)
  if (version === '2.0' && isRawV2Document(document)) {
    return wrapOADocument(document)
  }
  if (version === '3.0') {
    throw new Error(
      'OA v3 wrap is not available on the TrustVC stack. Use a v2 document.'
    )
  }
  if (version === '4.0') {
    throw new Error(
      'OA v4 wrap is not available on the TrustVC stack. Use v2, or migrate to W3C VC.'
    )
  }
  throw new Error('Unsupported document version')
}

export const unwrapDocument = (document: unknown): unknown => {
  if (!isWrappedV2Document(document)) {
    throw new Error(
      'Unwrap is only supported for OpenAttestation v2 documents.'
    )
  }
  return getDataV2(document)
}

export const prettyJson = (value: unknown): string =>
  JSON.stringify(value, null, 2)
