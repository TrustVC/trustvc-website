import { beforeEach, describe, expect, it } from 'vitest'
import {
  ADDRESS_RESOLVERS_KEY,
  loadAddressResolvers,
  parseResolverEndpoint,
  saveAddressResolvers,
  toAddressResolver,
} from './addressResolvers'

const valid = {
  name: 'Acme',
  endpoint: 'https://resolver.example.com/addresses',
  apiHeader: 'x-api-key',
  apiKey: 'secret',
}

describe('parseResolverEndpoint', () => {
  it.each([
    'https://resolver.example.com',
    'http://localhost:3000/a',
    'http://127.0.0.1:8080',
  ])('accepts %s', url => {
    expect(parseResolverEndpoint(url)).not.toBeNull()
  })

  it.each([
    'http://resolver.example.com',
    'javascript:alert(1)',
    'data:text/plain,hi',
    'file:///etc/passwd',
    'not a url',
    '',
  ])('rejects %s', url => {
    expect(parseResolverEndpoint(url)).toBeNull()
  })
})

describe('toAddressResolver', () => {
  it('keeps a valid resolver and only its known fields', () => {
    expect(toAddressResolver({ ...valid, isAdmin: true })).toEqual(valid)
  })

  it('defaults missing header and key to empty strings', () => {
    expect(toAddressResolver({ name: 'A', endpoint: valid.endpoint })).toEqual({
      name: 'A',
      endpoint: valid.endpoint,
      apiHeader: '',
      apiKey: '',
    })
  })

  it.each([
    ['null', null],
    ['a string', 'resolver'],
    ['a missing name', { ...valid, name: undefined }],
    ['a blank name', { ...valid, name: '  ' }],
    ['a non-string name', { ...valid, name: 42 }],
    ['an unsafe endpoint', { ...valid, endpoint: 'javascript:alert(1)' }],
    ['an invalid header name', { ...valid, apiHeader: 'bad header:' }],
    ['a non-string key', { ...valid, apiKey: { a: 1 } }],
  ])('rejects %s', (_, value) => {
    expect(toAddressResolver(value)).toBeNull()
  })
})

describe('loadAddressResolvers', () => {
  beforeEach(() => localStorage.clear())

  it('returns [] when nothing is stored', () => {
    expect(loadAddressResolvers()).toEqual([])
  })

  it('returns [] for invalid JSON or a non-array', () => {
    localStorage.setItem(ADDRESS_RESOLVERS_KEY, '{not json')
    expect(loadAddressResolvers()).toEqual([])
    localStorage.setItem(ADDRESS_RESOLVERS_KEY, '{"name":"A"}')
    expect(loadAddressResolvers()).toEqual([])
  })

  it('drops malformed entries and keeps valid ones', () => {
    localStorage.setItem(
      ADDRESS_RESOLVERS_KEY,
      JSON.stringify([
        valid,
        { name: 'Evil', endpoint: 'javascript:alert(1)' },
        null,
        { endpoint: valid.endpoint },
      ])
    )
    expect(loadAddressResolvers()).toEqual([valid])
  })

  it('does not copy a __proto__ key from storage', () => {
    localStorage.setItem(
      ADDRESS_RESOLVERS_KEY,
      `[{"name":"A","endpoint":"${valid.endpoint}","__proto__":{"polluted":true}}]`
    )
    const [resolver] = loadAddressResolvers()
    expect(Object.getPrototypeOf(resolver)).toBe(Object.prototype)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('saveAddressResolvers', () => {
  beforeEach(() => localStorage.clear())

  it('returns only valid resolvers, with their API keys', () => {
    const saved = saveAddressResolvers([
      valid,
      { ...valid, name: 'Bad', endpoint: 'http://evil.example.com' },
    ])
    expect(saved).toEqual([valid])
  })

  it('never writes the API key to localStorage', () => {
    saveAddressResolvers([valid])
    const raw = localStorage.getItem(ADDRESS_RESOLVERS_KEY)!
    const { apiKey: _apiKey, ...withoutKey } = valid
    expect(JSON.parse(raw)).toEqual([withoutKey])
    expect(raw).not.toContain(valid.apiKey)
  })

  it('loads a saved resolver back with an empty API key', () => {
    saveAddressResolvers([valid])
    expect(loadAddressResolvers()).toEqual([{ ...valid, apiKey: '' }])
  })
})
