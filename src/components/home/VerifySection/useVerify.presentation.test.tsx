import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVerify } from './useVerify'
import { DocumentProvider } from '../../common/contexts/DocumentContext'
import vp from '../../../__tests__/__fixtures__/w3c/presentations/valid/two_credentials.json'

/**
 * Drives the hook against a REAL Verifiable Presentation with @trustvc/trustvc unmocked.
 *
 * The sibling useVerify.test.ts mocks the library wholesale, which means a trustvc helper
 * that throws on a presentation goes unnoticed there — `getDocumentData` did exactly that,
 * and the whole run fell into the catch and rendered "Document Verification Failed".
 *
 * Crypto is NOT the point here: under jsdom the ECDSA holder proof cannot verify, so the
 * result may legitimately be `invalid`. What matters is that the run COMPLETES — reaching
 * `valid` or `invalid` rather than the `error` state — and that the presentation-specific
 * metadata is populated. Real cryptographic verification is covered under the node
 * environment in src/__tests__/verifiablePresentation.integration.test.ts.
 */

vi.mock('../../../lib/sentry', () => ({
  captureVerificationBreadcrumb: vi.fn(),
  captureVerificationException: vi.fn(),
  captureVerificationInvalid: vi.fn(),
  isSentryEnabled: vi.fn(() => false),
  initSentry: vi.fn(),
}))

vi.mock('../../../utils/analytics', () => ({
  trackDocumentDropped: vi.fn(),
  trackDocumentVerified: vi.fn(),
  trackDocumentVerifyError: vi.fn(),
  trackNetworkSelectionShown: vi.fn(),
  trackNetworkSelected: vi.fn(),
  trackNetworkSelectionCancelled: vi.fn(),
  trackVerificationReset: vi.fn(),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DocumentProvider>{children}</DocumentProvider>
)

const loadPresentation = async () => {
  const hook = renderHook(() => useVerify(), { wrapper })
  await act(async () => {
    await hook.result.current.loadDocument(vp, null, 'presentation.json')
  })
  await waitFor(
    () => {
      expect(hook.result.current.verifyStatus).not.toBe('verifying')
    },
    { timeout: 60000 }
  )
  return hook
}

describe('useVerify with a Verifiable Presentation', () => {
  it('completes the run instead of falling into the error state', async () => {
    const { result } = await loadPresentation()

    // 'error' means something threw. That is the regression this test exists for.
    expect(result.current.verifyStatus).not.toBe('error')
    expect(['valid', 'invalid']).toContain(result.current.verifyStatus)
  }, 90000)

  it('keeps the presentation as the raw document so the tabs can read it', async () => {
    const { result } = await loadPresentation()

    expect(result.current.rawDocument).toBeDefined()
    expect(result.current.rawDocument).toHaveProperty('verifiableCredential')
  }, 90000)

  it('shows the holder as the identity, since a presentation has no issuer', async () => {
    const { result } = await loadPresentation()

    expect(result.current.issuerName).toBe(
      (vp as { holder: string }).holder.toUpperCase()
    )
  }, 90000)

  it('tags it as a presentation and counts the credentials', async () => {
    const { result } = await loadPresentation()

    expect(result.current.tags).toContain('W3C VP V2.0')
    expect(result.current.tags).toContain('2 Credentials')
  }, 90000)

  it('does not treat it as transferable or expired', async () => {
    const { result } = await loadPresentation()

    expect(result.current.isTransferable).toBe(false)
    expect(result.current.isExpired).toBe(false)
  }, 90000)
})
