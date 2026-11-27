// Address resolvers: user-configured endpoints that supply address-book
// entries. They are kept in localStorage, which anything on this origin can
// write, so entries are checked on the way in AND on the way out. Callers get
// only well-formed resolvers and never need to trust the stored value.

export const ADDRESS_RESOLVERS_KEY = 'ADDRESS_RESOLVERS'

export interface AddressResolver {
  name: string
  endpoint: string
  apiHeader: string
  apiKey: string
}

// RFC 9110 field-name token. Anything else makes fetch() throw a TypeError.
export const HEADER_NAME_PATTERN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

// Resolver endpoints must be https; plain http only for a resolver on this
// machine (the browser blocks other http fetches from an https page anyway).
// Returns null for anything else, including javascript:, data: and file: URLs.
export const parseResolverEndpoint = (value: string): URL | null => {
  try {
    const url = new URL(value.trim())
    if (url.protocol === 'https:') return url
    if (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname)) return url
    return null
  } catch {
    return null
  }
}

const isString = (value: unknown): value is string => typeof value === 'string'

/**
 * Returns a clean copy of `value` if it is a usable resolver, otherwise null.
 * Only the four known fields are copied, so extra keys (including
 * `__proto__`) are dropped.
 */
export const toAddressResolver = (value: unknown): AddressResolver | null => {
  if (typeof value !== 'object' || value === null) return null
  const {
    name,
    endpoint,
    apiHeader = '',
    apiKey = '',
  } = value as Record<string, unknown>
  if (!isString(name) || !name.trim()) return null
  if (!isString(endpoint) || !parseResolverEndpoint(endpoint)) return null
  if (!isString(apiHeader) || !isString(apiKey)) return null
  if (apiHeader && !HEADER_NAME_PATTERN.test(apiHeader.trim())) return null
  return { name, endpoint, apiHeader, apiKey }
}

const sanitize = (values: unknown): AddressResolver[] =>
  Array.isArray(values)
    ? values
        .map(toAddressResolver)
        .filter((r): r is AddressResolver => r !== null)
    : []

export const loadAddressResolvers = (): AddressResolver[] => {
  try {
    const stored = localStorage.getItem(ADDRESS_RESOLVERS_KEY)
    return stored ? sanitize(JSON.parse(stored)) : []
  } catch {
    return []
  }
}

export const saveAddressResolvers = (
  resolvers: AddressResolver[]
): AddressResolver[] => {
  const clean = sanitize(resolvers)
  const persisted = clean.map(({ name, endpoint, apiHeader }) => ({
    name,
    endpoint,
    apiHeader,
  }))
  localStorage.setItem(ADDRESS_RESOLVERS_KEY, JSON.stringify(persisted))
  return clean
}
