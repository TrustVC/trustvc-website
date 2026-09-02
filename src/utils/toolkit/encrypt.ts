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

export const ENCRYPTED_PAYLOAD_OBJECT_MESSAGE =
  'Encrypted payload must be a JSON object.'

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

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
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(INVALID_JSON_MESSAGE)
  }
  if (!isJsonObject(parsed)) {
    throw new Error(ENCRYPTED_PAYLOAD_OBJECT_MESSAGE)
  }
  const missing = REQUIRED_KEYS.filter(field => !(field in parsed))
  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(', ')}`)
  }
  if (typeof parsed.key !== 'string' || parsed.key.length === 0) {
    throw new Error('Missing key')
  }
  return { ...(parsed as EncryptedPayload), key: parsed.key }
}

export const decryptDocument = (
  rawEncrypted: string,
  fallbackKey?: string
): string => {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawEncrypted)
  } catch {
    throw new Error(INVALID_JSON_MESSAGE)
  }
  if (!isJsonObject(parsed)) {
    throw new Error(ENCRYPTED_PAYLOAD_OBJECT_MESSAGE)
  }
  const payload = parsed as EncryptedPayload
  const encrypted = parseEncryptedPayload(
    JSON.stringify(
      payload.key || !fallbackKey ? payload : { ...payload, key: fallbackKey }
    )
  )
  const decrypted = decryptString(encrypted)
  try {
    return JSON.stringify(JSON.parse(decrypted), undefined, 2)
  } catch {
    return decrypted
  }
}

/** Translates raw errors from encrypt/decrypt/URL-load into copy a user can act on. */
export const toEncryptErrorMessage = (
  err: unknown,
  mode: 'encrypt' | 'decrypt'
): string => {
  let message = ''
  if (err instanceof Error) message = err.message.trim()
  else if (typeof err === 'string') message = err.trim()

  if (!message) {
    return mode === 'encrypt'
      ? 'Unable to encrypt this document. Please try again.'
      : 'Unable to decrypt this document. Please try again.'
  }

  if (
    message === INVALID_JSON_MESSAGE ||
    message === ENCRYPTED_PAYLOAD_OBJECT_MESSAGE
  ) {
    return message
  }

  if (/^Missing key$/i.test(message)) {
    return 'No secret key found. Enter the key that was used to encrypt this document in the Key field above, or paste a payload that includes a "key" field.'
  }

  const missingFieldsMatch = message.match(/^Missing (.+)$/)
  if (missingFieldsMatch) {
    return `This doesn't look like a complete encrypted payload — it's missing: ${missingFieldsMatch[1]}. Paste the full JSON produced by the Encrypt tool.`
  }

  if (/^Expecting version .+ but got /i.test(message)) {
    return `This payload uses an encryption format this tool doesn't support (${message}). It may have come from a different tool or a different version of TrustVC.`
  }

  if (/^Error decrypting message$/i.test(message)) {
    return 'Could not decrypt this document. The secret key is likely wrong, or the encrypted payload has been altered. Double-check the key and try again.'
  }

  if (/^Please ensure the following params exist in the URL/i.test(message)) {
    return `${message}. Paste the full link you were given, including anything after the "#".`
  }

  if (/^Unable to load the document from /i.test(message)) {
    return `${message}. Check the link and try again.`
  }

  if (/invalid url/i.test(message)) {
    return "That doesn't look like a valid URL. Paste the full link, starting with https://."
  }

  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Could not reach that URL. Check your internet connection and the link, then try again.'
  }

  if (/unexpected token|is not valid json/i.test(message)) {
    return "The response from that URL wasn't valid JSON. Check the link points directly to the encrypted document."
  }

  return message
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
