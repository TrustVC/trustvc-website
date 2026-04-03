/**
 * Browser-only ESM replacement for `randomfill` (CommonJS).
 * Avoids `exports.*` leaking into Vite's ESM production bundle (fixes
 * "ReferenceError: exports is not defined" from crypto-browserify).
 */
const g = globalThis
const cryptoApi = g.crypto || g.msCrypto
const kMaxUint32 = Math.pow(2, 32) - 1

function getBufferCtor() {
  const Buffer = g.Buffer
  if (!Buffer) {
    throw new Error('Buffer is not available (node polyfill missing)')
  }
  return Buffer
}

function oldBrowser() {
  throw new Error(
    'secure random number generation not supported by this browser\nuse chrome, FireFox or Internet Explorer 11'
  )
}

function assertOffset(offset, length, kBufferMaxLength) {
  if (typeof offset !== 'number' || offset !== offset) {
    throw new TypeError('offset must be a number')
  }
  if (offset > kMaxUint32 || offset < 0) {
    throw new TypeError('offset must be a uint32')
  }
  if (offset > kBufferMaxLength || offset > length) {
    throw new RangeError('offset out of range')
  }
}

function assertSize(size, offset, length, kBufferMaxLength) {
  if (typeof size !== 'number' || size !== size) {
    throw new TypeError('size must be a number')
  }
  if (size > kMaxUint32 || size < 0) {
    throw new TypeError('size must be a uint32')
  }
  if (size + offset > length || size > kBufferMaxLength) {
    throw new RangeError('buffer too small')
  }
}

function actualFill(buf, offset, size) {
  const view =
    buf instanceof Uint8Array
      ? buf.subarray(offset, offset + size)
      : new Uint8Array(buf.buffer, buf.byteOffset + offset, size)
  cryptoApi.getRandomValues(view)
  return buf
}

function nextTick(fn) {
  queueMicrotask(fn)
}

function randomFillSyncImpl(buf, offset, size) {
  const Buffer = getBufferCtor()
  const kBufferMaxLength = Buffer.kMaxLength
  if (typeof offset === 'undefined') {
    offset = 0
  }
  if (!Buffer.isBuffer(buf) && !(buf instanceof g.Uint8Array)) {
    throw new TypeError('"buf" argument must be a Buffer or Uint8Array')
  }
  assertOffset(offset, buf.length, kBufferMaxLength)
  if (size === undefined) size = buf.length - offset
  assertSize(size, offset, buf.length, kBufferMaxLength)
  return actualFill(buf, offset, size)
}

function randomFillImpl(buf, offset, size, cb) {
  const Buffer = getBufferCtor()
  const kBufferMaxLength = Buffer.kMaxLength
  if (!Buffer.isBuffer(buf) && !(buf instanceof g.Uint8Array)) {
    throw new TypeError('"buf" argument must be a Buffer or Uint8Array')
  }

  if (typeof offset === 'function') {
    cb = offset
    offset = 0
    size = buf.length
  } else if (typeof size === 'function') {
    cb = size
    size = buf.length - offset
  } else if (typeof cb !== 'function') {
    throw new TypeError('"cb" argument must be a function')
  }
  assertOffset(offset, buf.length, kBufferMaxLength)
  assertSize(size, offset, buf.length, kBufferMaxLength)

  try {
    actualFill(buf, offset, size)
  } catch (e) {
    nextTick(() => cb(e))
    return
  }
  nextTick(() => cb(null, buf))
}

const useCrypto = Boolean(cryptoApi && cryptoApi.getRandomValues)

export const randomFillSync = useCrypto ? randomFillSyncImpl : oldBrowser
export const randomFill = useCrypto ? randomFillImpl : oldBrowser

/** @type {{ randomFill: typeof randomFill; randomFillSync: typeof randomFillSync }} */
const randomfill = { randomFill, randomFillSync }
export default randomfill
