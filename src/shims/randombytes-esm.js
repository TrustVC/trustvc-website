/**
 * Browser-only ESM replacement for `randombytes/browser` (CommonJS).
 * Prevents CJS `module.exports`/`exports` leakage in production ESM chunks.
 */
const g = globalThis
const cryptoApi = g.crypto || g.msCrypto
const MAX_BYTES = 65536
const MAX_UINT32 = 4294967295

function oldBrowser() {
  throw new Error(
    'Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11'
  )
}

function getBufferCtor() {
  const Buffer = g.Buffer
  if (!Buffer) {
    throw new Error('Buffer is not available (node polyfill missing)')
  }
  return Buffer
}

function randomBytes(size, cb) {
  if (size > MAX_UINT32) {
    throw new RangeError('requested too many random bytes')
  }

  const Buffer = getBufferCtor()
  const bytes = Buffer.allocUnsafe(size)

  if (size > 0) {
    if (size > MAX_BYTES) {
      for (let generated = 0; generated < size; generated += MAX_BYTES) {
        cryptoApi.getRandomValues(
          bytes.subarray(generated, generated + MAX_BYTES)
        )
      }
    } else {
      cryptoApi.getRandomValues(bytes)
    }
  }

  if (typeof cb === 'function') {
    queueMicrotask(() => cb(null, bytes))
    return
  }

  return bytes
}

const impl = cryptoApi && cryptoApi.getRandomValues ? randomBytes : oldBrowser

export default impl
