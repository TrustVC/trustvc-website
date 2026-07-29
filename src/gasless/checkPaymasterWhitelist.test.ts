import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockReadContract = vi.fn()

vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({ readContract: mockReadContract })),
  http: vi.fn((url: string) => ({ _url: url })),
}))

vi.mock('@trustvc/trustvc', () => ({
  eip7702Abis: { platformPaymasterAbi: [] },
}))

import { checkPaymasterWhitelist } from './checkPaymasterWhitelist'

const PAYMASTER = '0xcccc000000000000000000000000000000000003'
const USER = '0x1234567890123456789012345678901234567890'
const TITLE_ESCROW = '0xaaaa000000000000000000000000000000000001'
const RPC_URL = 'https://sepolia.example.com'

describe('checkPaymasterWhitelist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns both authorized when contract confirms caller and title escrow', async () => {
    mockReadContract
      .mockResolvedValueOnce(true) // authorizedCallers
      .mockResolvedValueOnce(true) // authorizedTitleEscrows

    const result = await checkPaymasterWhitelist(
      PAYMASTER,
      USER,
      TITLE_ESCROW,
      RPC_URL
    )

    expect(result.isCallerAuthorized).toBe(true)
    expect(result.isTitleEscrowAuthorized).toBe(true)
  })

  it('returns caller not authorized when only title escrow is whitelisted', async () => {
    mockReadContract
      .mockResolvedValueOnce(false) // authorizedCallers
      .mockResolvedValueOnce(true) // authorizedTitleEscrows

    const result = await checkPaymasterWhitelist(
      PAYMASTER,
      USER,
      TITLE_ESCROW,
      RPC_URL
    )

    expect(result.isCallerAuthorized).toBe(false)
    expect(result.isTitleEscrowAuthorized).toBe(true)
  })

  it('returns title escrow not authorized when only caller is whitelisted', async () => {
    mockReadContract
      .mockResolvedValueOnce(true) // authorizedCallers
      .mockResolvedValueOnce(false) // authorizedTitleEscrows

    const result = await checkPaymasterWhitelist(
      PAYMASTER,
      USER,
      TITLE_ESCROW,
      RPC_URL
    )

    expect(result.isCallerAuthorized).toBe(true)
    expect(result.isTitleEscrowAuthorized).toBe(false)
  })

  it('returns both false when neither is whitelisted', async () => {
    mockReadContract
      .mockResolvedValueOnce(false) // authorizedCallers
      .mockResolvedValueOnce(false) // authorizedTitleEscrows

    const result = await checkPaymasterWhitelist(
      PAYMASTER,
      USER,
      TITLE_ESCROW,
      RPC_URL
    )

    expect(result.isCallerAuthorized).toBe(false)
    expect(result.isTitleEscrowAuthorized).toBe(false)
  })

  it('throws (does not catch) when the contract call fails — caller can distinguish invalid paymaster', async () => {
    mockReadContract.mockRejectedValue(new Error('execution reverted'))

    await expect(
      checkPaymasterWhitelist(PAYMASTER, USER, TITLE_ESCROW, RPC_URL)
    ).rejects.toThrow('execution reverted')
  })

  it('calls readContract with authorizedCallers using the user address', async () => {
    mockReadContract.mockResolvedValue(true)

    await checkPaymasterWhitelist(PAYMASTER, USER, TITLE_ESCROW, RPC_URL)

    const calls = mockReadContract.mock.calls
    const callerCall = calls.find(
      c => c[0].functionName === 'authorizedCallers'
    )
    expect(callerCall).toBeDefined()
    expect(callerCall![0].args[0]).toBe(USER)
    expect(callerCall![0].address).toBe(PAYMASTER)
  })

  it('calls readContract with authorizedTitleEscrows using the title escrow address', async () => {
    mockReadContract.mockResolvedValue(true)

    await checkPaymasterWhitelist(PAYMASTER, USER, TITLE_ESCROW, RPC_URL)

    const calls = mockReadContract.mock.calls
    const escrowCall = calls.find(
      c => c[0].functionName === 'authorizedTitleEscrows'
    )
    expect(escrowCall).toBeDefined()
    expect(escrowCall![0].args[0]).toBe(TITLE_ESCROW)
  })

  it('runs both contract reads in parallel (Promise.all — two calls)', async () => {
    mockReadContract.mockResolvedValue(false)

    await checkPaymasterWhitelist(PAYMASTER, USER, TITLE_ESCROW, RPC_URL)

    expect(mockReadContract).toHaveBeenCalledTimes(2)
  })
})
