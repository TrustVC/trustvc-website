import {
  isWrappedV2Document,
  isWrappedV3Document,
  isRawV2Document,
  isRawV3Document,
  isSignedWrappedV2Document,
  isSignedWrappedV3Document,
  vc,
} from '@trustvc/trustvc'

export type DocumentSchemaLabel =
  | 'OA v2'
  | 'OA v3'
  | 'W3C VC V1.1'
  | 'W3C VC V2.0'
  | 'Unknown'

export const getDocumentSchemaLabel = (doc: unknown): DocumentSchemaLabel => {
  const d = doc as Record<string, unknown>
  if (
    isWrappedV2Document(d) ||
    isRawV2Document(d) ||
    isSignedWrappedV2Document(d)
  ) {
    return 'OA v2'
  }
  if (
    isWrappedV3Document(d) ||
    isRawV3Document(d) ||
    isSignedWrappedV3Document(d)
  ) {
    return 'OA v3'
  }
  if (vc.isSignedDocument(d) || vc.isRawDocument(d)) {
    return vc.isSignedDocumentV2_0(d) ? 'W3C VC V2.0' : 'W3C VC V1.1'
  }
  return 'Unknown'
}
