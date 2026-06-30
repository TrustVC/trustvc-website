import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createFetchClient, FetchClientError } from './fetchClient'

vi.mock('../lib/sentry', () => ({
  captureFetchError: vi.fn(),
}))

import { captureFetchError } from '../lib/sentry'

describe('fetchClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('createFetchClient', () => {
    it('strips trailing slash from baseUrl', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const client = createFetchClient({ baseUrl: 'https://api.example.com/' })
      await client.request('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.any(Object)
      )
    })

    it('returns parsed JSON data on success', async () => {
      const mockData = { success: true, result: 42 }
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockData),
        })
      )

      const client = createFetchClient({ baseUrl: 'https://api.example.com' })
      const result = await client.request('/data')

      expect(result).toEqual(mockData)
    })

    it('throws FetchClientError on non-ok response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ message: 'Not found' }),
        })
      )

      const client = createFetchClient({ baseUrl: 'https://api.example.com' })

      await expect(client.request('/missing')).rejects.toThrow(FetchClientError)
      await expect(client.request('/missing')).rejects.toThrow('Not found')
    })

    it('throws FetchClientError when success is false', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              success: false,
              error: { message: 'Validation failed' },
            }),
        })
      )

      const client = createFetchClient({ baseUrl: 'https://api.example.com' })

      await expect(client.request('/submit')).rejects.toThrow(
        'Validation failed'
      )
    })

    it('handles non-JSON response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({ 'content-type': 'text/plain' }),
        })
      )

      const client = createFetchClient({ baseUrl: 'https://api.example.com' })
      const result = await client.request('/text')

      expect(result).toBeNull()
    })

    it('provides fallback error message for non-ok response without body', async () => {
      expect.assertions(3)
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          headers: new Headers({ 'content-type': 'text/plain' }),
        })
      )

      const client = createFetchClient({ baseUrl: 'https://api.example.com' })

      try {
        await client.request('/error')
      } catch (e) {
        expect(e).toBeInstanceOf(FetchClientError)
        expect((e as FetchClientError).status).toBe(500)
        expect((e as FetchClientError).message).toBe(
          'Request failed with status 500'
        )
      }
    })

    it('does not report caller aborts to Sentry', async () => {
      const abortError = new DOMException(
        'The user aborted a request.',
        'AbortError'
      )
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError))

      const client = createFetchClient({ baseUrl: 'https://api.example.com' })
      const controller = new AbortController()
      controller.abort()

      await expect(
        client.request('/aborted', { signal: controller.signal })
      ).rejects.toThrow()

      expect(captureFetchError).not.toHaveBeenCalled()
    })

    it('removes caller abort listener after request completes', async () => {
      const removeEventListener = vi.fn()
      const signal = {
        aborted: false,
        addEventListener: vi.fn(),
        removeEventListener,
      } as unknown as AbortSignal

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true }),
        })
      )

      const client = createFetchClient({ baseUrl: 'https://api.example.com' })
      await client.request('/ok', { signal })

      expect(signal.addEventListener).toHaveBeenCalled()
      expect(removeEventListener).toHaveBeenCalled()
    })
  })

  describe('FetchClientError', () => {
    it('has correct properties', () => {
      const error = new FetchClientError({
        status: 400,
        message: 'Bad request',
        data: { field: 'email' },
      })
      expect(error.name).toBe('FetchClientError')
      expect(error.status).toBe(400)
      expect(error.message).toBe('Bad request')
      expect(error.data).toEqual({ field: 'email' })
    })
  })
})
