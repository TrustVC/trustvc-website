import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  withScope: vi.fn((fn: (scope: unknown) => void) => {
    fn({
      setTag: vi.fn(),
      setContext: vi.fn(),
    })
  }),
  setContext: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
  ErrorBoundary: ({ children }: { children: unknown }) => children,
}))

vi.mock('./init', () => ({
  isSentryEnabled: vi.fn(() => true),
}))

import * as Sentry from '@sentry/react'
import {
  captureSanityError,
  captureVerificationException,
  captureVerificationInvalid,
  triggerSentryTestError,
} from './capture'

describe('captureSanityError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('captures exception with sanity-cms source tag', () => {
    const error = new Error('Sanity timeout')
    captureSanityError(error, { operation: 'fetchNewsArticles' })

    expect(Sentry.captureException).toHaveBeenCalledWith(error)
    expect(Sentry.withScope).toHaveBeenCalled()
  })
})

describe('captureVerificationException', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends file extension metadata instead of raw filename', () => {
    captureVerificationException(new Error('parse failed'), {
      stage: 'processFile',
      fileName: 'private-doc.json',
    })

    expect(Sentry.setContext).toHaveBeenCalledWith('details', {
      fileExtension: '.json',
    })
  })
})

describe('captureVerificationInvalid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('captures warning message without document payload', () => {
    captureVerificationInvalid({
      doc: { proofValue: 'should-not-be-sent' },
      fileName: 'test.json',
      chainId: '1',
      errorType: 'VERIFICATION_ERROR',
      errorMessage: 'Hash mismatch',
      fragments: [
        {
          name: 'OpenAttestationHash',
          status: 'INVALID',
          type: 'DOCUMENT_INTEGRITY',
        },
      ],
    })

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Document verification failed',
      'warning'
    )
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })
})

describe('triggerSentryTestError', () => {
  it('blocks test errors in production environment', () => {
    vi.stubEnv('VITE_SENTRY_ENVIRONMENT', 'production')
    vi.stubEnv('VITE_SENTRY_DSN', 'https://example@o0.ingest.sentry.io/0')

    expect(() => triggerSentryTestError()).toThrow(
      'Sentry test errors are disabled in production'
    )

    vi.unstubAllEnvs()
  })
})
