type FetchClientOptions = {
  baseUrl: string
  timeoutMs?: number
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

export const createFetchClient = ({
  baseUrl,
  timeoutMs,
}: FetchClientOptions) => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '')
  const defaultTimeoutMs = timeoutMs ?? 15000

  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const controller = new AbortController()
    const timeoutMs = defaultTimeoutMs
    const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs)
    const signal = init?.signal

    if (signal) {
      if (signal.aborted) controller.abort()
      signal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    const response = await fetch(`${normalizedBaseUrl}${path}`, {
      ...init,
      signal: controller.signal,
    }).finally(() => {
      globalThis.clearTimeout(timeoutId)
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
      typeof data === 'object' && data !== null ? (data as ApiErrorBody) : null
    if (!response.ok || (errorBody && errorBody.success === false)) {
      const message =
        errorBody?.error?.message ||
        errorBody?.message ||
        `Request failed with status ${response.status}`
      throw new FetchClientError({ status: response.status, message, data })
    }

    return data as T
  }

  return { request }
}

export const fetchClientSupport = createFetchClient({
  baseUrl:
    (import.meta.env?.VITE_SUPPORT_API_BASE_URL as string | undefined) || '',
})
