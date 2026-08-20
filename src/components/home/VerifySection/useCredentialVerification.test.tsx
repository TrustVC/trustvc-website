import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, render, renderHook, waitFor } from '@testing-library/react'
import {
  CredentialVerification,
  useCredentialVerification,
} from './useCredentialVerification'

/**
 * The hook's own job is to call verifyDocument once per credential and reshape the
 * fragments into what the panel renders. That reshaping is what these tests cover, with
 * verifyDocument mocked so each case is deterministic and instant.
 *
 * Real verification is deliberately NOT exercised here: under jsdom the ECDSA proofs cannot
 * verify and the promises take minutes to settle. The genuine verdicts are covered under
 * the node environment in src/__tests__/verifiablePresentation.integration.test.ts.
 */
const { verifyDocument } = vi.hoisted(() => ({ verifyDocument: vi.fn() }))

// Mocked WITHOUT importOriginal on purpose. Spreading the real @trustvc/trustvc namespace
// exhausts the heap under jsdom (the repo raises Node to 6GB just to build against it), and
// this file needs nothing else from the library — the hook imports only verifyDocument.
vi.mock('@trustvc/trustvc', () => ({ verifyDocument }))

const frag = (type: string, status: string) => ({
  name: `X${type}`,
  type,
  status,
})

const allValid = [
  frag('DOCUMENT_STATUS', 'VALID'),
  frag('ISSUER_IDENTITY', 'VALID'),
  frag('DOCUMENT_INTEGRITY', 'VALID'),
]

const credential = (issuer: unknown) => ({
  issuer,
  type: ['VerifiableCredential'],
})

describe('useCredentialVerification', () => {
  beforeEach(() => {
    verifyDocument.mockReset()
  })

  const settled = async (credentials: unknown[]) => {
    const hook = renderHook(() =>
      useCredentialVerification(credentials as never[])
    )
    await waitFor(() =>
      expect(hook.result.current.every(r => !r.loading)).toBe(true)
    )
    return hook.result
  }

  it('starts every credential in a loading state', () => {
    verifyDocument.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() =>
      useCredentialVerification([
        credential('did:web:a'),
        credential('did:web:b'),
      ] as never[])
    )

    expect(result.current).toHaveLength(2)
    expect(result.current.every(r => r.loading)).toBe(true)
  })

  it('returns one settled result per credential, in order', async () => {
    verifyDocument.mockResolvedValue(allValid)
    const result = await settled([
      credential('did:web:a'),
      credential('did:web:b'),
      credential('did:web:c'),
    ])

    expect(result.current).toHaveLength(3)
    expect(result.current.map(r => r.issuer)).toEqual([
      'DID:WEB:A',
      'DID:WEB:B',
      'DID:WEB:C',
    ])
  })

  it('upper-cases the issuer so it matches every other identity in the UI', async () => {
    verifyDocument.mockResolvedValue(allValid)
    const result = await settled([credential('did:key:zAbCdEf')])

    expect(result.current[0].issuer).toBe('DID:KEY:ZABCDEF')
  })

  it('reads an issuer given as an object', async () => {
    verifyDocument.mockResolvedValue(allValid)
    const result = await settled([
      credential({ id: 'did:web:issuer.example.com' }),
    ])

    expect(result.current[0].issuer).toBe('DID:WEB:ISSUER.EXAMPLE.COM')
  })

  it('marks a credential valid only when every group passes', async () => {
    verifyDocument
      .mockResolvedValueOnce(allValid)
      .mockResolvedValueOnce([
        frag('DOCUMENT_STATUS', 'INVALID'),
        frag('ISSUER_IDENTITY', 'VALID'),
        frag('DOCUMENT_INTEGRITY', 'VALID'),
      ])
    const result = await settled([
      credential('did:web:a'),
      credential('did:web:b'),
    ])

    expect(result.current[0].isValid).toBe(true)
    expect(result.current[1].isValid).toBe(false)
    expect(result.current[1].status.DOCUMENT_STATUS).toBe('INVALID')
    expect(result.current[1].status.DOCUMENT_INTEGRITY).toBe('VALID')
  })

  it('treats an ERROR fragment as a failed check, not a passing one', async () => {
    verifyDocument.mockResolvedValue([
      frag('DOCUMENT_STATUS', 'ERROR'),
      frag('ISSUER_IDENTITY', 'VALID'),
      frag('DOCUMENT_INTEGRITY', 'VALID'),
    ])
    const result = await settled([credential('did:web:a')])

    expect(result.current[0].status.DOCUMENT_STATUS).toBe('INVALID')
    expect(result.current[0].isValid).toBe(false)
  })

  it('ignores SKIPPED fragments, failing the group only if nothing ran', async () => {
    verifyDocument.mockResolvedValue([
      frag('DOCUMENT_STATUS', 'SKIPPED'),
      frag('DOCUMENT_STATUS', 'VALID'),
      frag('ISSUER_IDENTITY', 'VALID'),
      frag('DOCUMENT_INTEGRITY', 'VALID'),
    ])
    const result = await settled([credential('did:web:a')])

    expect(result.current[0].status.DOCUMENT_STATUS).toBe('VALID')
  })

  it('fails every check when a credential cannot be verified at all', async () => {
    // Otherwise the panel would sit on a spinner forever.
    verifyDocument.mockRejectedValue(new Error('not a credential'))
    const result = await settled([credential('did:web:a')])

    expect(result.current[0].isValid).toBe(false)
    expect(Object.values(result.current[0].status)).toEqual([
      'INVALID',
      'INVALID',
      'INVALID',
    ])
  })

  /**
   * These two watch EVERY render, not just the settled result.
   *
   * renderHook wraps its work in act(), which flushes effects before the assertions run —
   * so a wrong value that exists for one render is invisible to `result.current`. The
   * regressions below both lived in exactly that gap, and a probe component that records
   * each render is the only way to see them.
   */
  describe('per-render output', () => {
    const recordRenders = () => {
      const renders: CredentialVerification[][] = []
      const Probe = ({ creds }: { creds: unknown[] }) => {
        renders.push(useCredentialVerification(creds as never[]))
        return null
      }
      return { renders, Probe }
    }

    it('is pending from the very first render, never an empty result set', () => {
      // Regression: the pending state was seeded in an effect, so the first render returned
      // []. Every check then read undefined, fell through to its INVALID branch, and a red
      // cross flashed before the spinner on every presentation opened.
      verifyDocument.mockReturnValue(new Promise(() => {}))
      const { renders, Probe } = recordRenders()

      render(
        <Probe creds={[credential('did:web:a'), credential('did:web:b')]} />
      )

      expect(renders[0]).toHaveLength(2)
      expect(renders[0].every(r => r.loading)).toBe(true)
    })

    it("never shows the previous credentials' verdicts against a new set", async () => {
      // Regression: results were not tied to the credentials they described, so the render
      // between a new presentation arriving and its effect firing showed the old verdicts —
      // a stale VALID against a different credential.
      verifyDocument.mockResolvedValue(allValid)
      const { renders, Probe } = recordRenders()
      const { rerender } = render(<Probe creds={[credential('did:web:a')]} />)
      await waitFor(() => expect(renders.at(-1)?.[0]?.isValid).toBe(true))

      // This set never settles, so any non-pending result for it is left over from the last.
      verifyDocument.mockReturnValue(new Promise(() => {}))
      const before = renders.length
      rerender(
        <Probe creds={[credential('did:web:b'), credential('did:web:c')]} />
      )

      for (const results of renders.slice(before)) {
        expect(results).toHaveLength(2)
        expect(results.every(r => r.loading)).toBe(true)
      }
    })
  })

  it('fails a credential whose verification never settles', async () => {
    // Otherwise the tab spins for the life of the page: verifyDocument reaches the network
    // and takes no abort signal, so nothing else would ever resolve this.
    vi.useFakeTimers()
    try {
      verifyDocument.mockReturnValue(new Promise(() => {}))
      const { result } = renderHook(() =>
        useCredentialVerification([credential('did:web:a')] as never[])
      )
      expect(result.current[0].loading).toBe(true)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000)
      })

      expect(result.current[0].loading).toBe(false)
      expect(result.current[0].isValid).toBe(false)
      expect(Object.values(result.current[0].status)).toEqual([
        'INVALID',
        'INVALID',
        'INVALID',
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('returns nothing for an empty credential list', () => {
    const { result } = renderHook(() => useCredentialVerification([]))

    expect(result.current).toEqual([])
    expect(verifyDocument).not.toHaveBeenCalled()
  })

  it('does not re-verify when the same credentials are passed in a new array', async () => {
    // The guard that stops an infinite render loop: callers build a fresh array each render.
    const credentials = [credential('did:example:a')]
    verifyDocument.mockResolvedValue(allValid)

    const { rerender } = renderHook(
      ({ creds }) => useCredentialVerification(creds),
      { initialProps: { creds: credentials } }
    )
    await waitFor(() => expect(verifyDocument).toHaveBeenCalledTimes(1))

    rerender({ creds: [{ ...credentials[0] }] })
    await waitFor(() => expect(verifyDocument).toHaveBeenCalledTimes(1))
  })

  it('re-verifies when a credential is TAMPERED but keeps its id and proof', async () => {
    // Regression: the key was `id ?? proofValue.slice(0, 32)`, which is untouched by
    // tampering — it edits the claims and leaves both alone. So a tampered credential reused
    // the untampered one's verdict and the panel kept showing VALID. The real fixtures
    // valid/single_credential.json and invalid/tampered_credential.json collide that way.
    const untampered = {
      id: 'urn:uuid:same-id',
      type: ['VerifiableCredential'],
      credentialSubject: { blNumber: 'BL-0001' },
      proof: { proofValue: 'u' + 'A'.repeat(64) },
    }
    const tampered = {
      ...untampered,
      credentialSubject: { blNumber: 'TAMPERED' },
    }

    verifyDocument.mockResolvedValue(allValid)
    const { rerender, result } = renderHook(
      ({ creds }) => useCredentialVerification(creds),
      { initialProps: { creds: [untampered] } }
    )
    await waitFor(() => expect(result.current[0]?.isValid).toBe(true))
    expect(verifyDocument).toHaveBeenCalledTimes(1)

    // Same id, same proof, different claims — this MUST be verified again.
    verifyDocument.mockResolvedValue([
      frag('DOCUMENT_STATUS', 'VALID'),
      frag('ISSUER_IDENTITY', 'VALID'),
      frag('DOCUMENT_INTEGRITY', 'INVALID'),
    ])
    rerender({ creds: [tampered] })

    await waitFor(() => expect(verifyDocument).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(result.current[0]?.isValid).toBe(false))
  })
})
