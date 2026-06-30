import { captureFetchError } from '../lib/sentry'

type FetchClientOptions = {
  baseUrl: string
  timeoutMs?: number
  service?: 'support-api' | 'app'
}

interface ApiErrorBody {
  success?: boolean
  error?: { message?: string }
  message?: string
}

export type FetchClientErrorDetails = {
  status: number
  message: string
  data?: unknown
}

export class FetchClientError extends Error {
  public readonly status: number
  public readonly data?: unknown

  constructor(details: FetchClientErrorDetails) {
    super(details.message)
    this.name = 'FetchClientError'
    this.status = details.status
    this.data = details.data
  }
}

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError'

export const createFetchClient = ({
  baseUrl,
  timeoutMs,
  service = 'app',
}: FetchClientOptions) => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '')
  const defaultTimeoutMs = timeoutMs ?? 15000

  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const controller = new AbortController()
    const timeoutMs = defaultTimeoutMs
    const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs)
    const signal = init?.signal
    const method = init?.method ?? 'GET'
    let onCallerAbort: (() => void) | undefined

    if (signal) {
      if (signal.aborted) controller.abort()
      onCallerAbort = () => controller.abort()
      signal.addEventListener('abort', onCallerAbort, { once: true })
    }

    try {
      const response = await fetch(`${normalizedBaseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      })

      const contentType = response.headers.get('content-type') || ''
      let data: unknown = null
      if (contentType.includes('application/json')) {
        try {
          data = await response.json()
        } catch {
          data = null
        }
      }

      const errorBody =
        typeof data === 'object' && data !== null
          ? (data as ApiErrorBody)
          : null
      if (!response.ok || (errorBody && errorBody.success === false)) {
        const message =
          errorBody?.error?.message ||
          errorBody?.message ||
          `Request failed with status ${response.status}`
        const error = new FetchClientError({
          status: response.status,
          message,
          data,
        })
        captureFetchError(error, {
          service,
          path,
          method,
          status: response.status,
        })
        throw error
      }

      return data as T
    } catch (error) {
      if (!(error instanceof FetchClientError) && !isAbortError(error)) {
        captureFetchError(error, { service, path, method })
      }
      throw error
    } finally {
      globalThis.clearTimeout(timeoutId)
      if (signal && onCallerAbort) {
        signal.removeEventListener('abort', onCallerAbort)
      }
    }
  }

  return { request }
}

export const fetchClientSupport = createFetchClient({
  baseUrl:
    (import.meta.env?.VITE_SUPPORT_API_BASE_URL as string | undefined) || '',
  service: 'support-api',
})
