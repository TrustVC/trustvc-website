import type { Breadcrumb, Event, EventHint } from '@sentry/react'

const REDACTED = '[Redacted]'

/** Keys that must never leave the browser in Sentry payloads. */
const SENSITIVE_KEYS = new Set([
  'proof',
  'proofValue',
  'proofs',
  'credential',
  'verifiableCredential',
  'merkleRoot',
  'targetHash',
  'signature',
  'signatures',
  'privateKey',
  'payload',
  'attachments',
  'document',
  'rawDocument',
  'doc',
  'email',
  'phone',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'captchaToken',
  'recaptchaToken',
  'VITE_SANITY_READ_TOKEN',
  'fileContent',
  'fileText',
  'body',
])

const SENSITIVE_KEY_PATTERN =
  /proof|credential|merkle|signature|payload|attachment|private|secret|password|token/i

const CREDENTIAL_JSON_PATTERN =
  /"(?:proofValue|merkleRoot|targetHash|verifiableCredential|credentialSubject)"/i

const MAX_STRING_LENGTH = 500
const MAX_DEPTH = 8

const isSensitiveKey = (key: string): boolean =>
  SENSITIVE_KEYS.has(key) || SENSITIVE_KEY_PATTERN.test(key)

const looksLikeCredentialPayload = (value: string): boolean =>
  value.length > MAX_STRING_LENGTH || CREDENTIAL_JSON_PATTERN.test(value)

export const scrubValue = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_DEPTH) return '[Truncated]'

  if (
    value == null ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return value
  }

  if (typeof value === 'string') {
    if (looksLikeCredentialPayload(value)) {
      return `[Redacted string len=${value.length}]`
    }
    return value
  }

  if (Array.isArray(value)) {
    return value.map(item => scrubValue(item, depth + 1))
  }

  if (typeof value === 'object') {
    return scrubObject(value as Record<string, unknown>, depth + 1)
  }

  return value
}

export const scrubObject = (
  obj: Record<string, unknown>,
  depth = 0
): Record<string, unknown> => {
  const result: Record<string, unknown> = {}

  for (const [key, val] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      result[key] = REDACTED
      continue
    }
    result[key] = scrubValue(val, depth + 1)
  }

  return result
}

export const scrubBreadcrumb = (breadcrumb: Breadcrumb): Breadcrumb | null => {
  if (!breadcrumb.data) return breadcrumb

  return {
    ...breadcrumb,
    data: scrubObject(breadcrumb.data as Record<string, unknown>),
  }
}

export const scrubEvent = (event: Event, _hint?: EventHint): Event | null => {
  if (event.extra) {
    event.extra = scrubObject(event.extra as Record<string, unknown>)
  }

  if (event.contexts) {
    const contexts: Record<string, unknown> = {}
    for (const [key, ctx] of Object.entries(event.contexts)) {
      contexts[key] =
        ctx && typeof ctx === 'object'
          ? scrubObject(ctx as Record<string, unknown>)
          : ctx
    }
    event.contexts = contexts as Event['contexts']
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .map(crumb => scrubBreadcrumb(crumb))
      .filter((crumb): crumb is Breadcrumb => crumb != null)
  }

  if (event.request?.data && typeof event.request.data === 'object') {
    event.request.data = scrubObject(
      event.request.data as Record<string, unknown>
    )
  }

  return event
}
