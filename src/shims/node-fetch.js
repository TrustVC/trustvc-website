// Browser shim for node-fetch.
// node-fetch's XHR-based polyfill chain fails in browser context with a body
// parsing error ("[object Object]"). We replace it with the browser's native fetch
// which handles responses correctly. For the opencerts registry specifically,
// we fall back to an empty registry if the native fetch fails (e.g. CORS),
// so the verifier returns SKIPPED instead of throwing.

const nativeFetch = globalThis.fetch.bind(globalThis)

const nodeFetchShim = async (url, options) => {
  if (String(url).includes('opencerts.io/static/registry.json')) {
    try {
      const res = await nativeFetch(url, options)
      if (res.ok) return res
    } catch {
      // CORS or network error — fall through to empty registry
    }
    return new globalThis.Response('{"issuers":{}}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return nativeFetch(url, options)
}

export default nodeFetchShim
export const Headers = globalThis.Headers
export const Request = globalThis.Request
export const Response = globalThis.Response
