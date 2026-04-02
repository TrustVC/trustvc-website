import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreateClient = vi.hoisted(() => vi.fn(() => ({ fetch: vi.fn() })))
const mockImageUrlBuilder = vi.hoisted(() =>
  vi.fn(() => ({
    image: vi.fn(() => ({
      auto: vi.fn(() => 'mock-image-url'),
    })),
  }))
)

vi.mock('@sanity/client', () => ({ createClient: mockCreateClient }))
vi.mock('@sanity/image-url', () => ({ default: mockImageUrlBuilder }))

describe('sanity/client — unconfigured (no env vars)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SANITY_PROJECT_ID', '')
    vi.stubEnv('VITE_SANITY_DATASET', '')
    vi.stubEnv('VITE_SANITY_READ_TOKEN', '')
    mockCreateClient.mockClear()
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('isSanityConfigured is false', async () => {
    const { isSanityConfigured } = await import('./client')
    expect(isSanityConfigured).toBe(false)
  })

  it('sanityClient is null', async () => {
    const { sanityClient } = await import('./client')
    expect(sanityClient).toBeNull()
  })

  it('does not call createClient', async () => {
    mockCreateClient.mockClear()
    await import('./client')
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('getSanityImageUrl returns null for any source', async () => {
    const { getSanityImageUrl } = await import('./client')
    expect(getSanityImageUrl({ asset: { _ref: 'image-abc123' } })).toBeNull()
  })

  it('getSanityImageUrl returns null for undefined source', async () => {
    const { getSanityImageUrl } = await import('./client')
    expect(getSanityImageUrl(undefined)).toBeNull()
  })

  it('getSanityImageUrl returns null for empty source object', async () => {
    const { getSanityImageUrl } = await import('./client')
    expect(getSanityImageUrl({})).toBeNull()
  })
})

describe('sanity/client — configured (both env vars set)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SANITY_PROJECT_ID', 'test-project-id')
    vi.stubEnv('VITE_SANITY_DATASET', 'production')
    mockCreateClient.mockClear()
    mockImageUrlBuilder.mockClear()
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('isSanityConfigured is true', async () => {
    const { isSanityConfigured } = await import('./client')
    expect(isSanityConfigured).toBe(true)
  })

  it('sanityClient is not null', async () => {
    const { sanityClient } = await import('./client')
    expect(sanityClient).not.toBeNull()
  })

  it('calls createClient with projectId and dataset', async () => {
    await import('./client')
    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'test-project-id',
        dataset: 'production',
      })
    )
  })

  it('calls createClient with useCdn: true', async () => {
    await import('./client')
    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({ useCdn: true })
    )
  })

  it('uses default apiVersion 2025-01-01 when env var is not set', async () => {
    await import('./client')
    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({ apiVersion: '2025-01-01' })
    )
  })

  it('uses custom apiVersion when VITE_SANITY_API_VERSION is set', async () => {
    vi.stubEnv('VITE_SANITY_API_VERSION', '2024-06-01')
    vi.resetModules()
    await import('./client')
    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({ apiVersion: '2024-06-01' })
    )
  })

  it('passes token when VITE_SANITY_READ_TOKEN is set', async () => {
    vi.stubEnv('VITE_SANITY_READ_TOKEN', 'sk-secret-token')
    vi.resetModules()
    await import('./client')
    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'sk-secret-token' })
    )
  })

  it('passes undefined token when VITE_SANITY_READ_TOKEN is not set', async () => {
    vi.stubEnv('VITE_SANITY_READ_TOKEN', '')
    vi.resetModules()
    await import('./client')
    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({ token: undefined })
    )
  })

  it('getSanityImageUrl returns a non-null result for a valid source', async () => {
    const { getSanityImageUrl } = await import('./client')
    const result = getSanityImageUrl({ asset: { _ref: 'image-abc123' } })
    expect(result).not.toBeNull()
  })

  it('getSanityImageUrl returns null for undefined source even when configured', async () => {
    const { getSanityImageUrl } = await import('./client')
    expect(getSanityImageUrl(undefined)).toBeNull()
  })

  it('getSanityImageUrl calls imageBuilder.image with the source', async () => {
    const mockImage = vi.fn(() => ({ auto: vi.fn(() => 'url') }))
    mockImageUrlBuilder.mockReturnValue({ image: mockImage })
    vi.resetModules()
    const { getSanityImageUrl } = await import('./client')
    const source = { asset: { _ref: 'image-xyz' } }
    getSanityImageUrl(source)
    expect(mockImage).toHaveBeenCalledWith(source)
  })

  it('getSanityImageUrl calls .auto("format") on the image builder result', async () => {
    const mockAuto = vi.fn(() => 'formatted-url')
    const mockImage = vi.fn(() => ({ auto: mockAuto }))
    mockImageUrlBuilder.mockReturnValue({ image: mockImage })
    vi.resetModules()
    const { getSanityImageUrl } = await import('./client')
    getSanityImageUrl({ asset: { _ref: 'image-xyz' } })
    expect(mockAuto).toHaveBeenCalledWith('format')
  })
})

describe('sanity/client — partially configured', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('isSanityConfigured is false when only projectId is set', async () => {
    vi.stubEnv('VITE_SANITY_PROJECT_ID', 'test-project-id')
    vi.stubEnv('VITE_SANITY_DATASET', '')
    vi.resetModules()
    const { isSanityConfigured } = await import('./client')
    expect(isSanityConfigured).toBe(false)
  })

  it('isSanityConfigured is false when only dataset is set', async () => {
    vi.stubEnv('VITE_SANITY_PROJECT_ID', '')
    vi.stubEnv('VITE_SANITY_DATASET', 'production')
    vi.resetModules()
    const { isSanityConfigured } = await import('./client')
    expect(isSanityConfigured).toBe(false)
  })

  it('sanityClient is null when only projectId is set', async () => {
    vi.stubEnv('VITE_SANITY_PROJECT_ID', 'test-project-id')
    vi.stubEnv('VITE_SANITY_DATASET', '')
    vi.resetModules()
    const { sanityClient } = await import('./client')
    expect(sanityClient).toBeNull()
  })
})
