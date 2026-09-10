import { __unsafe__use__it__at__your__own__risks__wrapDocument } from '@tradetrust-tt/tradetrust'
import {
  diagnose,
  getDataV2,
  isRawV2Document,
  isRawV3Document,
  isWrappedV2Document,
  isWrappedV3Document,
  wrapOADocument,
  type DiagnoseError,
} from '@trustvc/trustvc'
import { INVALID_JSON_MESSAGE, type DocVersion } from './types'

export type ParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string }

/** Same copy as `@trustvc/trustvc` `wrapOADocument` for non-v2/v3 documents. */
export const OA_UNSUPPORTED_VERSION_MESSAGE = 'Unsupported document version'

export const OA_UNWRAP_V2_ONLY_MESSAGE =
  'Unwrap is only supported for OpenAttestation v2 documents.'

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
      item =>
        typeof item === 'string' &&
        (item.includes('open-attestation/4') ||
          item.includes('openattestation/4'))
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
): DiagnoseError[] => {
  if (version === '4.0') {
    return []
  }
  return diagnose({
    version,
    kind,
    document,
    debug: false,
    mode: 'strict',
  })
}

export const formatDiagnoseError = (error: DiagnoseError): string =>
  error.message

export const formatDiagnoseMessage = (errors: DiagnoseError[]): string =>
  ['Document is not valid:', ...errors.map(formatDiagnoseError)].join('\n')

export const wrapRawDocument = async (document: unknown): Promise<unknown> => {
  // TrustVC wrapOADocument rejects v3. Use tradetrust already installed
  // through @trustvc/trustvc — do not add it as a website dependency.
  if (isRawV3Document(document)) {
    return __unsafe__use__it__at__your__own__risks__wrapDocument(document)
  }
  return wrapOADocument(document as Parameters<typeof wrapOADocument>[0])
}

export const unwrapDocument = (document: unknown): unknown => {
  if (!isWrappedV2Document(document)) {
    throw new Error(OA_UNWRAP_V2_ONLY_MESSAGE)
  }
  return getDataV2(document)
}

export const prettyJson = (value: unknown): string =>
  JSON.stringify(value, null, 2)
