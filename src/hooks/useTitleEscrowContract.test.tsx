import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
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
})
