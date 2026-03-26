type FetchClientOptions = {
  baseUrl: string
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

export const createFetchClient = ({ baseUrl }: FetchClientOptions) => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '')

  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${normalizedBaseUrl}${path}`, init)

    const contentType = response.headers.get('content-type') || ''
    const data = contentType.includes('application/json')
      ? await response.json()
      : null

    const errorBody = data as ApiErrorBody | null
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

const supportApiBaseUrl = ((import.meta as any).env?.VITE_SUPPORT_API_BASE_URL as string) || ''

if (!supportApiBaseUrl && typeof window !== 'undefined') {
  console.warn('[fetchClient] VITE_SUPPORT_API_BASE_URL is not configured. API requests may fail.')
}

export const fetchClientSupport = createFetchClient({
  baseUrl: supportApiBaseUrl,
})
