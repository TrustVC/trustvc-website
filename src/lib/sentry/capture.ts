import * as Sentry from '@sentry/react'
import type { VerifyErrorType } from '../../components/home/VerifySection/verifyErrorUtils'
import type { VerificationFragment } from '../../components/home/VerifySection/useVerify'
import { getDocumentSchemaLabel } from './documentSchema'
import { isSentryEnabled } from './init'

export type ErrorSource =
  | 'verification'
  | 'support-api'
  | 'sanity-cms'
  | 'wallet'
  | 'app'

export type VerificationStage =
  | 'processFile'
  | 'handleNetworkConfirm'
  | 'loadDocument'
  | 'runVerification'

const withScope = (
  source: ErrorSource,
  tags: Record<string, string | undefined>,
  fn: () => void
): void => {
  if (!isSentryEnabled()) return

  Sentry.withScope(scope => {
    scope.setTag('error.source', source)
    for (const [key, value] of Object.entries(tags)) {
      if (value != null && value !== '') {
        scope.setTag(key, value)
      }
    }
    fn()
  })
}

export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, unknown>
): void => {
  if (!isSentryEnabled()) return

  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data: data as Record<string, string | number | boolean> | undefined,
  })
}

export const captureAppException = (
  error: unknown,
  context?: {
    source?: ErrorSource
    tags?: Record<string, string | undefined>
    extra?: Record<string, unknown>
  }
): void => {
  if (!isSentryEnabled()) return

  withScope(context?.source ?? 'app', context?.tags ?? {}, () => {
    if (context?.extra) {
      Sentry.setContext('details', context.extra)
    }
    Sentry.captureException(error)
  })
}

export const captureVerificationBreadcrumb = (
  message: string,
  data?: Record<string, unknown>
): void => {
  addBreadcrumb(message, 'verification', data)
}

export const captureVerificationException = (
  error: unknown,
  context: {
    stage: VerificationStage
    fileName?: string
    chainId?: string | null
  }
): void => {
  captureAppException(error, {
    source: 'verification',
    tags: {
      'verification.stage': context.stage,
      'verification.chain_id': context.chainId ?? undefined,
    },
    extra: {
      fileName: context.fileName,
    },
  })
}

export const captureVerificationInvalid = (context: {
  doc: unknown
  fileName?: string
  chainId?: string | null
  errorType?: VerifyErrorType
  errorMessage?: string
  fragments?: VerificationFragment[]
}): void => {
  if (!isSentryEnabled()) return

  const schema = getDocumentSchemaLabel(context.doc)
  const fragmentSummary = (context.fragments ?? []).map(fragment => ({
    name: fragment.name,
    status: fragment.status,
    type: fragment.type,
  }))

  withScope(
    'verification',
    {
      'verification.result': 'invalid',
      'verification.schema': schema,
      'verification.error_type': context.errorType,
      'verification.chain_id': context.chainId ?? undefined,
    },
    () => {
      Sentry.setContext('verification', {
        fileName: context.fileName,
        errorMessage: context.errorMessage,
        fragmentSummary,
      })
      Sentry.captureMessage('Document verification failed', 'warning')
    }
  )
}

export const captureSanityError = (
  error: unknown,
  context: { operation: string }
): void => {
  captureAppException(error, {
    source: 'sanity-cms',
    tags: {
      'sanity.operation': context.operation,
    },
  })
}

export const captureFetchError = (
  error: unknown,
  context: {
    service: 'support-api' | 'app'
    path: string
    method?: string
    status?: number
  }
): void => {
  captureAppException(error, {
    source: context.service === 'support-api' ? 'support-api' : 'app',
    tags: {
      'http.path': context.path,
      'http.method': context.method ?? 'GET',
      'http.status': context.status?.toString(),
    },
  })
}

/** Dev-only helper for end-to-end Sentry verification. */
export const triggerSentryTestError = (): void => {
  if (!isSentryEnabled()) {
    throw new Error('Sentry is not enabled (missing VITE_SENTRY_DSN)')
  }

  const environment =
    (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ??
    (import.meta.env.VITE_PLATFORM as string | undefined) ??
    'local'

  if (environment === 'production') {
    throw new Error('Sentry test errors are disabled in production')
  }

  throw new Error('TrustVC Sentry test error — safe to ignore')
}
