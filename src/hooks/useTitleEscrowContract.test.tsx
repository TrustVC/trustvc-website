import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { utils } from 'ethers'
import { TokenRegistryVersions } from '../constants'
import { useTitleEscrowContract } from './useTitleEscrowContract'

vi.mock('./useTokenRegistryVersion', () => ({
  useTokenRegistryVersion: () => TokenRegistryVersions.V5,
}))

vi.mock('./useIsObligation', () => ({
  useIsObligation: () => false,
}))

vi.mock('@trustvc/trustvc', async importOriginal => {
  const actual = await importOriginal<typeof import('@trustvc/trustvc')>()
  const connect = (address: string) => ({ address })
  return {
    ...actual,
    getTitleEscrowAddress: vi.fn(async (_registry: string, id: string) =>
      id === '1'
        ? '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        : '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    ),
    v5Contracts: {
      ...actual.v5Contracts,
      TitleEscrow__factory: { connect },
      ObligationEscrow__factory: { connect },
    },
    v4Contracts: {
      ...actual.v4Contracts,
      TitleEscrow__factory: { connect },
    },
  }
})

const OWNER_A = '0x1111111111111111111111111111111111111111'
const OWNER_B = '0x2222222222222222222222222222222222222222'
const ESCROW_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

const ownerOf = new utils.Interface([
  'function ownerOf(uint256) view returns (address)',
])

const encodeOwner = (owner: string) =>
  ownerOf.encodeFunctionResult('ownerOf', [owner])

type Gate = {
  tokenId: string
  resolve: (value: string) => void
  reject: (error: Error) => void
}

describe('useTitleEscrowContract', () => {
  const gates: Gate[] = []
  const provider = {
    call: vi.fn(({ data }: { data: string }) => {
      const tokenId = BigInt(`0x${data.slice(-64)}`).toString()
      return new Promise<string>((resolve, reject) => {
        gates.push({ tokenId, resolve, reject })
      })
    }),
  }
  const tokenRegistry = {
    address: '0x1234567890123456789012345678901234567890',
  }

  beforeEach(() => {
    gates.length = 0
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const latestGate = (tokenId: string) =>
    [...gates].reverse().find(gate => gate.tokenId === tokenId)

  it('ignores a late success for a previous token', async () => {
    const { result, rerender } = renderHook(
      ({ tokenId }) =>
        useTitleEscrowContract(
          provider as never,
          tokenRegistry as never,
          tokenId
        ),
      { initialProps: { tokenId: '1' } }
    )

    await waitFor(() => expect(latestGate('1')).toBeDefined())
    rerender({ tokenId: '2' })
    await waitFor(() => expect(latestGate('2')).toBeDefined())

    latestGate('2')?.resolve(encodeOwner(OWNER_B))
    await waitFor(() => expect(result.current.documentOwner).toBe(OWNER_B))

    latestGate('1')?.resolve(encodeOwner(OWNER_A))
    await waitFor(() => expect(result.current.documentOwner).toBe(OWNER_B))
    expect(result.current.titleEscrowAddress).toBe(ESCROW_B)
  })

  it('ignores a late failure for a previous token', async () => {
    const { result, rerender } = renderHook(
      ({ tokenId }) =>
        useTitleEscrowContract(
          provider as never,
          tokenRegistry as never,
          tokenId
        ),
      { initialProps: { tokenId: '1' } }
    )

    await waitFor(() => expect(latestGate('1')).toBeDefined())
    rerender({ tokenId: '2' })
    await waitFor(() => expect(latestGate('2')).toBeDefined())

    latestGate('2')?.resolve(encodeOwner(OWNER_B))
    await waitFor(() => expect(result.current.documentOwner).toBe(OWNER_B))

    latestGate('1')?.reject(new Error('previous token failed'))
    await waitFor(() => expect(result.current.documentOwner).toBe(OWNER_B))
    expect(result.current.titleEscrowAddress).toBe(ESCROW_B)
    expect(console.error).not.toHaveBeenCalled()
  })

  it('ignores the original success when the token leaves A and returns to A', async () => {
    const { result, rerender } = renderHook(
      ({ tokenId }) =>
        useTitleEscrowContract(
          provider as never,
          tokenRegistry as never,
          tokenId
        ),
      { initialProps: { tokenId: '1' } }
    )

    await waitFor(() => expect(latestGate('1')).toBeDefined())
    const originalA = latestGate('1')

    rerender({ tokenId: '2' })
    await waitFor(() => expect(latestGate('2')).toBeDefined())
    rerender({ tokenId: '1' })
    await waitFor(() => expect(latestGate('1')).not.toBe(originalA))

    latestGate('1')?.resolve(encodeOwner(OWNER_B))
    await waitFor(() => expect(result.current.documentOwner).toBe(OWNER_B))

    originalA?.resolve(encodeOwner(OWNER_A))
    await waitFor(() => expect(result.current.documentOwner).toBe(OWNER_B))
  })

  it('ignores the original failure when the token leaves A and returns to A', async () => {
    const { result, rerender } = renderHook(
      ({ tokenId }) =>
        useTitleEscrowContract(
          provider as never,
          tokenRegistry as never,
          tokenId
        ),
      { initialProps: { tokenId: '1' } }
    )

    await waitFor(() => expect(latestGate('1')).toBeDefined())
    const originalA = latestGate('1')

    rerender({ tokenId: '2' })
    await waitFor(() => expect(latestGate('2')).toBeDefined())
    rerender({ tokenId: '1' })
    await waitFor(() => expect(latestGate('1')).not.toBe(originalA))

    latestGate('1')?.resolve(encodeOwner(OWNER_B))
    await waitFor(() => expect(result.current.documentOwner).toBe(OWNER_B))

    originalA?.reject(new Error('stale return to A'))
    await waitFor(() => expect(result.current.documentOwner).toBe(OWNER_B))
    expect(
      vi.mocked(console.error).mock.calls.map(call => call[0])
    ).not.toContainEqual(expect.any(Error))
  })

  it('ignores a late success after the provider changes', async () => {
    const firstProvider = deferredProvider()
    const nextProvider = deferredProvider()
    const { result, rerender } = renderHook(
      ({ provider }) =>
        useTitleEscrowContract(provider as never, tokenRegistry as never, '1'),
      { initialProps: { provider: firstProvider.provider } }
    )

    await waitFor(() => expect(firstProvider.gates[0]).toBeDefined())
    rerender({ provider: nextProvider.provider })
    await waitFor(() => expect(nextProvider.gates[0]).toBeDefined())

    nextProvider.gates[0].resolve(encodeOwner(OWNER_B))
    await waitFor(() => expect(result.current.documentOwner).toBe(OWNER_B))

    firstProvider.gates[0].resolve(encodeOwner(OWNER_A))
    await waitFor(() => expect(result.current.documentOwner).toBe(OWNER_B))
  })

  it('ignores an older refresh that fails after a newer one succeeds', async () => {
    const { result } = renderHook(() =>
      useTitleEscrowContract(provider as never, tokenRegistry as never, '1')
    )

    await waitFor(() => expect(latestGate('1')).toBeDefined())
    const first = latestGate('1')
    let newer: Promise<void> = Promise.resolve()
    await act(async () => {
      newer = result.current.updateTitleEscrow()
    })
    await waitFor(() => expect(latestGate('1')).not.toBe(first))

    await act(async () => {
      latestGate('1')?.resolve(encodeOwner(OWNER_B))
      await newer
    })
    await waitFor(() => expect(result.current.documentOwner).toBe(OWNER_B))

    await act(async () => {
      first?.reject(new Error('older refresh failed'))
    })
    await waitFor(() => expect(result.current.documentOwner).toBe(OWNER_B))
    expect(vi.mocked(console.error).mock.calls.map(call => call[0])).not.toContainEqual(
      expect.any(Error)
    )
  })
})

const deferredProvider = () => {
  const gates: Gate[] = []
  return {
    gates,
    provider: {
      call: ({ data }: { data: string }) => {
        const tokenId = BigInt(`0x${data.slice(-64)}`).toString()
        return new Promise<string>((resolve, reject) => {
          gates.push({ tokenId, resolve, reject })
        })
      },
    },
  }
}
