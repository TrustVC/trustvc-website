import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkEIP7702Delegation } from './checkDelegation'

const RPC_URL = 'https://sepolia.example.com'
const USER_ADDRESS = '0x1234567890123456789012345678901234567890'

describe('checkEIP7702Delegation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when code starts with EIP-7702 prefix (lowercase)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ result: '0xef0100deadbeef' }),
    })

    const result = await checkEIP7702Delegation(USER_ADDRESS, RPC_URL)

    expect(result).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith(
      RPC_URL,
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('eth_getCode'),
      })
    )
  })

  it('returns true when code starts with EIP-7702 prefix (uppercase — case-insensitive)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ result: '0xEF0100DEADBEEF' }),
    })

    const result = await checkEIP7702Delegation(USER_ADDRESS, RPC_URL)

    expect(result).toBe(true)
  })

  it('returns false when code is empty (no delegation)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ result: '0x' }),
    })

    const result = await checkEIP7702Delegation(USER_ADDRESS, RPC_URL)

    expect(result).toBe(false)
  })

  it('returns false when code has a different bytecode prefix', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ result: '0x6080604052' }),
    })

    const result = await checkEIP7702Delegation(USER_ADDRESS, RPC_URL)

    expect(result).toBe(false)
  })

  it('returns false when result field is null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ result: null }),
    })

    const result = await checkEIP7702Delegation(USER_ADDRESS, RPC_URL)

    expect(result).toBe(false)
  })

  it('returns false when result field is absent', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
    })

    const result = await checkEIP7702Delegation(USER_ADDRESS, RPC_URL)

    expect(result).toBe(false)
  })

  it('returns false when fetch throws a network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'))

    const result = await checkEIP7702Delegation(USER_ADDRESS, RPC_URL)

    expect(result).toBe(false)
  })

  it('returns false when json() rejects', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.reject(new Error('Invalid JSON')),
    })

    const result = await checkEIP7702Delegation(USER_ADDRESS, RPC_URL)

    expect(result).toBe(false)
  })

  it('includes the user address in the RPC request params', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ result: '0x' }),
    })

    await checkEIP7702Delegation(USER_ADDRESS, RPC_URL)

    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
    expect(body.params[0]).toBe(USER_ADDRESS)
    expect(body.params[1]).toBe('latest')
    expect(body.method).toBe('eth_getCode')
  })
})
