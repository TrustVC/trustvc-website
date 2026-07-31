import type { ReactNode } from 'react'
import { Sentry } from './init'

type SentryErrorBoundaryProps = {
  children: ReactNode
}

export const SentryErrorBoundary = ({ children }: SentryErrorBoundaryProps) => (
  <Sentry.ErrorBoundary
    fallback={
      <div
        className="app-shell app-shell--bg-light"
        style={{ padding: '2rem' }}
      >
        <h1>Something went wrong</h1>
        <p>
          An unexpected error occurred. Please refresh the page or try again
          later.
        </p>
      </div>
    }
    beforeCapture={scope => {
      scope.setTag('error.source', 'app')
      scope.setTag('error.boundary', 'root')
    }}
  >
    {children}
  </Sentry.ErrorBoundary>
)
