import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '../../../__tests__/test-utils'
import { ActionLoader } from './ActionLoader'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const { mockNavigate, mockUseLocation, mockDecryptString } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseLocation: vi.fn(),
  mockDecryptString: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: mockUseLocation,
  }
})

vi.mock('@govtechsg/oa-encryption', () => ({
  decryptString: mockDecryptString,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SAMPLE_URI = 'https://storage.example.com/documents/doc.json'
const SAMPLE_CHAIN_ID = 11155111
const SAMPLE_DOC = { version: '2.0', data: { id: 'test-123' } }

const encodeAction = (overrides: object = {}) =>
  encodeURIComponent(
    JSON.stringify({
      type: 'DOCUMENT',
      payload: { uri: SAMPLE_URI, chainId: SAMPLE_CHAIN_ID, ...overrides },
    })
  )

const setLocation = (search: string) =>
  mockUseLocation.mockReturnValue({ search, hash: '', pathname: '/' })

const makeFetch = (body: object, ok = true) =>
  vi
    .fn()
    .mockResolvedValue({ ok, status: ok ? 200 : 404, json: async () => body })

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ActionLoader', () => {
  let mockLoadDocument: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadDocument = vi.fn().mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ── No-op when ?q= is absent ───────────────────────────────────────────────

  it('does nothing when the URL has no ?q= param', async () => {
    setLocation('')
    vi.stubGlobal('fetch', makeFetch(SAMPLE_DOC))

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    // Flush microtasks
    await new Promise(r => setTimeout(r, 0))
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockLoadDocument).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  // ── URL cleaning ───────────────────────────────────────────────────────────

  it('cleans the URL with replace:true before fetching', async () => {
    setLocation(`?q=${encodeAction()}`)
    vi.stubGlobal('fetch', makeFetch(SAMPLE_DOC))

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    // navigate is called synchronously inside useEffect, before the async fetch
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('fetches document and calls loadDocument with doc, chainId string, and filename', async () => {
    setLocation(`?q=${encodeAction()}`)
    vi.stubGlobal('fetch', makeFetch(SAMPLE_DOC))

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    await waitFor(() => expect(mockLoadDocument).toHaveBeenCalledTimes(1))
    expect(mockLoadDocument).toHaveBeenCalledWith(
      SAMPLE_DOC,
      String(SAMPLE_CHAIN_ID),
      'doc.json'
    )
    expect(fetch).toHaveBeenCalledWith(SAMPLE_URI)
  })

  it('unwraps { document: ... } opencerts wrapper before calling loadDocument', async () => {
    const innerDoc = { actual: 'content' }
    setLocation(`?q=${encodeAction()}`)
    vi.stubGlobal('fetch', makeFetch({ document: innerDoc }))

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    await waitFor(() => expect(mockLoadDocument).toHaveBeenCalledTimes(1))
    expect(mockLoadDocument).toHaveBeenCalledWith(
      innerDoc,
      String(SAMPLE_CHAIN_ID),
      'doc.json'
    )
  })

  it('derives fileName from the last path segment of the URI', async () => {
    const uri = 'https://cdn.example.com/docs/my-trade-doc.tt'
    setLocation(`?q=${encodeAction({ uri })}`)
    vi.stubGlobal('fetch', makeFetch(SAMPLE_DOC))

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    await waitFor(() => expect(mockLoadDocument).toHaveBeenCalledTimes(1))
    expect(mockLoadDocument).toHaveBeenCalledWith(
      SAMPLE_DOC,
      String(SAMPLE_CHAIN_ID),
      'my-trade-doc.tt'
    )
  })

  it('falls back to "document.json" when URI ends with a trailing slash', async () => {
    const uri = 'https://storage.example.com/'
    setLocation(`?q=${encodeAction({ uri })}`)
    vi.stubGlobal('fetch', makeFetch(SAMPLE_DOC))

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    await waitFor(() => expect(mockLoadDocument).toHaveBeenCalledTimes(1))
    const [, , name] = mockLoadDocument.mock.calls[0]
    expect(name).toBe('document.json')
  })

  it('coerces a numeric chainId to string', async () => {
    setLocation(`?q=${encodeAction({ chainId: 137 })}`)
    vi.stubGlobal('fetch', makeFetch(SAMPLE_DOC))

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    await waitFor(() => expect(mockLoadDocument).toHaveBeenCalledTimes(1))
    const [, chainId] = mockLoadDocument.mock.calls[0]
    expect(chainId).toBe('137')
    expect(typeof chainId).toBe('string')
  })

  it('passes null chainId when chainId is absent from payload', async () => {
    setLocation(
      `?q=${encodeURIComponent(JSON.stringify({ type: 'DOCUMENT', payload: { uri: SAMPLE_URI } }))}`
    )
    vi.stubGlobal('fetch', makeFetch(SAMPLE_DOC))

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    await waitFor(() => expect(mockLoadDocument).toHaveBeenCalledTimes(1))
    const [, chainId] = mockLoadDocument.mock.calls[0]
    expect(chainId).toBeNull()
  })

  // ── Early returns for unsupported actions ──────────────────────────────────

  it('does not call loadDocument when type is not DOCUMENT', async () => {
    setLocation(
      `?q=${encodeURIComponent(JSON.stringify({ type: 'OTHER', payload: { uri: SAMPLE_URI, chainId: 1 } }))}`
    )
    vi.stubGlobal('fetch', makeFetch(SAMPLE_DOC))

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    await new Promise(r => setTimeout(r, 20))
    expect(fetch).not.toHaveBeenCalled()
    expect(mockLoadDocument).not.toHaveBeenCalled()
  })

  it('does not call loadDocument when payload.uri is missing', async () => {
    setLocation(
      `?q=${encodeURIComponent(JSON.stringify({ type: 'DOCUMENT', payload: { chainId: 1 } }))}`
    )
    vi.stubGlobal('fetch', makeFetch(SAMPLE_DOC))

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    await new Promise(r => setTimeout(r, 20))
    expect(fetch).not.toHaveBeenCalled()
    expect(mockLoadDocument).not.toHaveBeenCalled()
  })

  // ── Error handling ─────────────────────────────────────────────────────────

  it('logs an error and does not throw when fetch returns a non-ok response', async () => {
    setLocation(`?q=${encodeAction()}`)
    vi.stubGlobal('fetch', makeFetch({}, false))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    await new Promise(r => setTimeout(r, 20))
    expect(mockLoadDocument).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(
      'ActionLoader: failed to load document from URL',
      expect.any(Error)
    )
  })

  it('logs an error and does not throw when fetch rejects', async () => {
    setLocation(`?q=${encodeAction()}`)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error'))
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    await new Promise(r => setTimeout(r, 20))
    expect(mockLoadDocument).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(
      'ActionLoader: failed to load document from URL',
      expect.any(Error)
    )
  })

  it('logs an error and does not throw when ?q= value is invalid JSON', async () => {
    setLocation('?q=not-valid-json')
    vi.stubGlobal('fetch', makeFetch(SAMPLE_DOC))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    await new Promise(r => setTimeout(r, 20))
    expect(mockLoadDocument).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(
      'ActionLoader: failed to load document from URL',
      expect.any(Error)
    )
  })

  it('still cleans the URL even when ?q= JSON is invalid', async () => {
    setLocation('?q=not-valid-json')
    vi.stubGlobal('fetch', makeFetch(SAMPLE_DOC))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<ActionLoader loadDocument={mockLoadDocument} />)

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  // ── OA Encrypted documents (OPEN-ATTESTATION-TYPE-1) ──────────────────────

  describe('decryption', () => {
    const ENCRYPTED_DOC = {
      type: 'OPEN-ATTESTATION-TYPE-1',
      cipherText: 'abc123==',
      tag: 'tagValue==',
      iv: 'ivValue',
    }
    const DECRYPTED_DOC = { version: '2.0', data: 'decrypted' }
    const DECRYPTION_KEY =
      '8813186d10c540b5ed97652b5d59e7f7636c1c3679729b924293c06a05fdaaed'

    it('decrypts an OA-encrypted document using the key from payload', async () => {
      mockDecryptString.mockReturnValue(JSON.stringify(DECRYPTED_DOC))
      setLocation(`?q=${encodeAction({ key: DECRYPTION_KEY })}`)
      vi.stubGlobal('fetch', makeFetch(ENCRYPTED_DOC))

      render(<ActionLoader loadDocument={mockLoadDocument} />)

      await waitFor(() => expect(mockLoadDocument).toHaveBeenCalledTimes(1))
      expect(mockDecryptString).toHaveBeenCalledWith({
        tag: ENCRYPTED_DOC.tag,
        cipherText: ENCRYPTED_DOC.cipherText,
        iv: ENCRYPTED_DOC.iv,
        key: DECRYPTION_KEY,
        type: ENCRYPTED_DOC.type,
      })
      expect(mockLoadDocument).toHaveBeenCalledWith(
        DECRYPTED_DOC,
        String(SAMPLE_CHAIN_ID),
        'doc.json'
      )
    })

    it('prefers the key from the URL hash anchor over payload.key', async () => {
      const anchorKey = 'anchor-key-takes-priority'
      mockDecryptString.mockReturnValue(JSON.stringify(DECRYPTED_DOC))
      mockUseLocation.mockReturnValue({
        search: `?q=${encodeAction({ key: DECRYPTION_KEY })}`,
        hash: `#${encodeURIComponent(JSON.stringify({ key: anchorKey }))}`,
        pathname: '/',
      })
      vi.stubGlobal('fetch', makeFetch(ENCRYPTED_DOC))

      render(<ActionLoader loadDocument={mockLoadDocument} />)

      await waitFor(() => expect(mockDecryptString).toHaveBeenCalledTimes(1))
      expect(mockDecryptString).toHaveBeenCalledWith(
        expect.objectContaining({ key: anchorKey })
      )
    })

    it('throws and logs an error when document is encrypted but no key is provided', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      setLocation(`?q=${encodeAction()}`) // no key in payload
      vi.stubGlobal('fetch', makeFetch(ENCRYPTED_DOC))

      render(<ActionLoader loadDocument={mockLoadDocument} />)

      await new Promise(r => setTimeout(r, 20))
      expect(mockDecryptString).not.toHaveBeenCalled()
      expect(mockLoadDocument).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledWith(
        'ActionLoader: failed to load document from URL',
        expect.any(Error)
      )
    })

    it('does not decrypt when document type is not OPEN-ATTESTATION-TYPE-1', async () => {
      setLocation(`?q=${encodeAction({ key: DECRYPTION_KEY })}`)
      vi.stubGlobal('fetch', makeFetch(SAMPLE_DOC)) // plain doc, not encrypted

      render(<ActionLoader loadDocument={mockLoadDocument} />)

      await waitFor(() => expect(mockLoadDocument).toHaveBeenCalledTimes(1))
      expect(mockDecryptString).not.toHaveBeenCalled()
      expect(mockLoadDocument).toHaveBeenCalledWith(
        SAMPLE_DOC,
        String(SAMPLE_CHAIN_ID),
        'doc.json'
      )
    })
  })
})
