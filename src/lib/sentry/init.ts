import * as Sentry from '@sentry/react'
import { scrubBreadcrumb, scrubEvent } from './scrub'

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

export const isSentryEnabled = (): boolean => Boolean(dsn)

let initialized = false

export const initSentry = (): void => {
  if (initialized || !dsn) return

  const environment =
    (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ??
    (import.meta.env.VITE_PLATFORM as string | undefined) ??
    'local'

  const release = import.meta.env.VITE_SENTRY_RELEASE as string | undefined

  Sentry.init({
    dsn,
    environment,
    release,
    enabled: true,
    // Session replay disabled — the verify UI may display credential content.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
  })

  initialized = true

  if (typeof window !== 'undefined' && environment !== 'production') {
    ;(window as TrustVCSentryTestWindow).__trustvcSentryTest = () => {
      import('./capture').then(({ triggerSentryTestError }) => {
        triggerSentryTestError()
      })
    }
  }
}

interface TrustVCSentryTestWindow extends Window {
  __trustvcSentryTest?: () => void
}

export { Sentry }
