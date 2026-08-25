import {
  decryptString,
  encryptString,
  generateEncryptionKey,
  type IEncryptionResults,
} from '@trustvc/trustvc'
import { INVALID_JSON_MESSAGE } from './types'
import { parseJsonDocument } from './wrap'

export type EncryptedPayload = Omit<IEncryptionResults, 'key'> & {
  key?: string
}

const REQUIRED_KEYS = ['cipherText', 'iv', 'tag', 'key', 'type'] as const

export { generateEncryptionKey }

export const encryptDocument = (
  rawDocument: string,
  key: string
): EncryptedPayload => {
  const parsed = parseJsonDocument(rawDocument)
  if (!parsed.ok) {
    throw new Error(parsed.error)
  }
  const { key: _key, ...encrypted } = encryptString(rawDocument, key)
  return encrypted
}

export const parseEncryptedPayload = (raw: string): IEncryptionResults => {
  let parsed: EncryptedPayload
  try {
    parsed = JSON.parse(raw) as EncryptedPayload
  } catch {
    throw new Error(INVALID_JSON_MESSAGE)
  }
  const missing = REQUIRED_KEYS.filter(field => !(field in parsed))
  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(', ')}`)
  }
  if (typeof parsed.key !== 'string' || parsed.key.length === 0) {
    throw new Error('Missing key')
  }
  return { ...parsed, key: parsed.key }
}

export const decryptDocument = (
  rawEncrypted: string,
  fallbackKey?: string
): string => {
  let parsed: EncryptedPayload
  try {
    parsed = JSON.parse(rawEncrypted) as EncryptedPayload
  } catch {
    throw new Error(INVALID_JSON_MESSAGE)
  }
  const encrypted = parseEncryptedPayload(
    JSON.stringify(
      parsed.key || !fallbackKey ? parsed : { ...parsed, key: fallbackKey }
    )
  )
  const decrypted = decryptString(encrypted)
  try {
    return JSON.stringify(JSON.parse(decrypted), undefined, 2)
  } catch {
    return decrypted
  }
}

export const loadEncryptedFromActionUrl = async (
  url: string
): Promise<{ payload: EncryptedPayload; key: string }> => {
  const parsedUrl = new URL(url)
  const params = new URLSearchParams(parsedUrl.search)
  const hash = parsedUrl.hash.startsWith('#')
    ? parsedUrl.hash.slice(1)
    : parsedUrl.hash

  const action = JSON.parse(params.get('q') || '{}') as {
    payload?: { uri?: string; key?: string }
  }
  const anchor = JSON.parse(decodeURIComponent(hash || '{}')) as {
    key?: string
  }
  const key = anchor.key || action.payload?.key

  const errors: string[] = []
  if (!action.payload?.uri) errors.push('payload.uri')
  if (!key) errors.push('key')
  if (errors.length > 0) {
    throw new Error(
      `Please ensure the following params exist in the URL: ${errors.join(', ')}`
    )
  }

  const response = await fetch(action.payload!.uri!)
  if (response.status >= 400 && response.status < 600) {
    throw new Error(`Unable to load the document from ${action.payload!.uri}`)
  }
  let document = await response.json()
  document = document.document || document

  const payload = parseEncryptedPayload(JSON.stringify({ ...document, key }))
  return {
    payload,
    key: key as string,
  }
}
