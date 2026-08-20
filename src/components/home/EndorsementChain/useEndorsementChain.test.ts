import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useEndorsementChain } from './useEndorsementChain'

// Mock dependencies
vi.mock('@trustvc/trustvc', () => ({
  fetchEndorsementChain: vi.fn(),
}))

vi.mock('ethers', () => ({
  ethers: {
    providers: {
      JsonRpcProvider: vi.fn(),
    },
  },
}))

vi.mock('../../../utils/helper', () => ({
  getRpcUrl: vi.fn(() => 'https://rpc.example.com'),
}))

const { fetchEndorsementChain } = await import('@trustvc/trustvc')
const { getRpcUrl } = await import('../../../utils/helper')

describe('useEndorsementChain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns idle status with no params', () => {
    const { result } = renderHook(() =>
      useEndorsementChain({
        tokenRegistryAddress: undefined,
        tokenId: undefined,
        verifiedChainId: undefined,
      })
    )
    expect(result.current.endorsementChainStatus.status).toBe('idle')
    expect(result.current.endorsementChain).toBeUndefined()
    expect(result.current.showEndorsementChain).toBe(false)
  })

  it('fetches endorsement chain when all params provided', async () => {
    const mockChain = { chain: [] }
    vi.mocked(fetchEndorsementChain).mockResolvedValue(mockChain as any)

    const { result } = renderHook(() =>
      useEndorsementChain({
        tokenRegistryAddress: '0x1234',
        tokenId: '0xabcd',
        verifiedChainId: '1',
      })
    )

    // Should be loading initially
    expect(result.current.endorsementChainStatus.status).toBe('loading')

    await waitFor(() => {
      expect(result.current.endorsementChainStatus.status).toBe('success')
    })
    expect(result.current.endorsementChain).toBe(mockChain)
  })

  it('handles fetch error', async () => {
    vi.mocked(fetchEndorsementChain).mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() =>
      useEndorsementChain({
        tokenRegistryAddress: '0x1234',
        tokenId: '0xabcd',
        verifiedChainId: '1',
      })
    )

    await waitFor(() => {
      expect(result.current.endorsementChainStatus.status).toBe('error')
    })
    expect(result.current.endorsementChainStatus.errorMessage).toBe(
      'Network error'
    )
    expect(result.current.endorsementChain).toBeUndefined()
  })

  it('handles missing RPC URL', async () => {
    vi.mocked(getRpcUrl).mockReturnValue(null)

    const { result } = renderHook(() =>
      useEndorsementChain({
        tokenRegistryAddress: '0x1234',
        tokenId: '0xabcd',
        verifiedChainId: '999',
      })
    )

    await waitFor(() => {
      expect(result.current.endorsementChainStatus.status).toBe('error')
    })
    expect(result.current.endorsementChainStatus.errorMessage).toContain(
      'No RPC URL configured'
    )
  })

  it('toggles showEndorsementChain', () => {
    const { result } = renderHook(() =>
      useEndorsementChain({
        tokenRegistryAddress: undefined,
        tokenId: undefined,
        verifiedChainId: undefined,
      })
    )

    expect(result.current.showEndorsementChain).toBe(false)

    act(() => {
      result.current.handleShowEndorsementChain()
    })
    expect(result.current.showEndorsementChain).toBe(true)

    act(() => {
      result.current.handleHideEndorsementChain()
    })
    expect(result.current.showEndorsementChain).toBe(false)
  })

  it('resets to idle when params become undefined', async () => {
    vi.mocked(getRpcUrl).mockReturnValue('https://rpc.example.com')
    const mockChain = { chain: [] }
    vi.mocked(fetchEndorsementChain).mockResolvedValue(mockChain as any)

    const { result, rerender } = renderHook(
      (props: {
        tokenRegistryAddress?: string
        tokenId?: string
        verifiedChainId?: string
        keyId?: string
      }) => useEndorsementChain(props),
      {
        initialProps: {
          tokenRegistryAddress: '0x1234' as string | undefined,
          tokenId: '0xabcd' as string | undefined,
          verifiedChainId: '1' as string | undefined,
          keyId: undefined as string | undefined,
        },
      }
    )

    await waitFor(() => {
      expect(result.current.endorsementChainStatus.status).toBe('success')
    })

    rerender({
      tokenRegistryAddress: undefined,
      tokenId: undefined,
      verifiedChainId: undefined,
      keyId: undefined,
    })

    await waitFor(() => {
      expect(result.current.endorsementChainStatus.status).toBe('idle')
    })
    expect(result.current.endorsementChain).toBeUndefined()
  })

  it('uses fetchEndorsementChain for BoE / obligation documents', async () => {
    const mockChain = [{ type: 'TRANSFER_HOLDER' }]
    vi.mocked(fetchEndorsementChain).mockResolvedValue(mockChain as any)

    const { result } = renderHook(() =>
      useEndorsementChain({
        tokenRegistryAddress: '0xObligRegistry',
        tokenId: '0xabcd',
        verifiedChainId: '11155111',
        keyId: 'boe-key',
      })
    )

    await waitFor(() => {
      expect(result.current.endorsementChainStatus.status).toBe('success')
    })

    expect(fetchEndorsementChain).toHaveBeenCalledOnce()
    expect(fetchEndorsementChain).toHaveBeenCalledWith(
      '0xObligRegistry',
      '0xabcd',
      expect.anything(),
      'boe-key'
    )
    expect(result.current.endorsementChain).toBe(mockChain)
  })

  it('handles obligation endorsement chain fetch errors', async () => {
    vi.mocked(fetchEndorsementChain).mockRejectedValue(
      new Error('Obligation RPC failed')
    )

    const { result } = renderHook(() =>
      useEndorsementChain({
        tokenRegistryAddress: '0xObligRegistry',
        tokenId: '0xabcd',
        verifiedChainId: '11155111',
      })
    )

    await waitFor(() => {
      expect(result.current.endorsementChainStatus.status).toBe('error')
    })
    expect(result.current.endorsementChainStatus.errorMessage).toBe(
      'Obligation RPC failed'
    )
  })
})
