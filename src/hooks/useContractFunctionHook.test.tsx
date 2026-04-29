import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useContractFunctionHook } from './useContractFunctionHook'

vi.mock('../components/common/contexts/DocumentContext', () => ({
  useDocumentContext: () => ({ keyId: 'test-key' }),
}))

const { mockTransferHolder } = vi.hoisted(() => ({
  mockTransferHolder: vi.fn(),
}))

vi.mock('@trustvc/trustvc', () => ({
  transferHolder: mockTransferHolder,
  transferBeneficiary: vi.fn(),
  transferOwners: vi.fn(),
  rejectTransferHolder: vi.fn(),
  rejectTransferBeneficiary: vi.fn(),
  rejectTransferOwners: vi.fn(),
  nominate: vi.fn(),
  returnToIssuer: vi.fn(),
  rejectReturned: vi.fn(),
  acceptReturned: vi.fn(),
}))

const mockContract = { address: '0xabc' } as any

describe('useContractFunctionHook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('send — missing contract or method', () => {
    it('sets ERROR and errorMessage when contract is undefined', async () => {
      const { result } = renderHook(() =>
        useContractFunctionHook(undefined, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.state).toBe('ERROR')
      expect(result.current.errorMessage).toBe('Contract or method is not specified')
    })

    it('sets ERROR and errorMessage when method is undefined', async () => {
      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, undefined)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.state).toBe('ERROR')
      expect(result.current.errorMessage).toBe('Contract or method is not specified')
    })
  })

  describe('send — MetaMask numeric error codes', () => {
    it('maps code 4001 to "User Rejected Transaction" and sets ERROR state', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: 4001 })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.state).toBe('ERROR')
      expect(result.current.errorMessage).toBe('User Rejected Transaction')
    })

    it('user rejection now sets ERROR state (not UNINITIALIZED)', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: 4001 })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.state).toBe('ERROR')
    })

    it('maps code 4100 to "Unauthorized: Account or method not authorized"', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: 4100 })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.errorMessage).toBe(
        'Unauthorized: Account or method not authorized'
      )
    })

    it('maps code 4900 to "Wallet Disconnected"', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: 4900 })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.errorMessage).toBe('Wallet Disconnected')
    })

    it('maps code -32603 to "Internal Error"', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: -32603 })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.errorMessage).toBe('Internal Error')
    })

    it('maps code -32000 to "Invalid Input"', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: -32000 })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.errorMessage).toBe('Invalid Input')
    })

    it('maps code -32003 to "Transaction Rejected"', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: -32003 })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.errorMessage).toBe('Transaction Rejected')
    })
  })

  describe('send — ethers string error codes', () => {
    it('maps ACTION_REJECTED to "User Rejected Transaction"', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: 'ACTION_REJECTED' })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.state).toBe('ERROR')
      expect(result.current.errorMessage).toBe('User Rejected Transaction')
    })

    it('maps INSUFFICIENT_FUNDS to "Insufficient Funds"', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: 'INSUFFICIENT_FUNDS' })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.errorMessage).toBe('Insufficient Funds')
    })

    it('maps UNPREDICTABLE_GAS_LIMIT to "Unable to Estimate Gas"', async () => {
      mockTransferHolder.mockRejectedValueOnce({
        code: 'UNPREDICTABLE_GAS_LIMIT',
      })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.errorMessage).toBe('Unable to Estimate Gas')
    })

    it('maps CALL_EXCEPTION to "Contract Call Failed"', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: 'CALL_EXCEPTION' })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.errorMessage).toBe('Contract Call Failed')
    })

    it('maps NETWORK_ERROR to "Network Error"', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: 'NETWORK_ERROR' })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.errorMessage).toBe('Network Error')
    })
  })

  describe('send — fallback error handling', () => {
    it('uses error.message when code is not in any map', async () => {
      mockTransferHolder.mockRejectedValueOnce(
        new Error('Transaction failed: nonce too low')
      )

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.errorMessage).toBe(
        'Transaction failed: nonce too low'
      )
    })

    it('returns empty string for errors with unknown numeric code and no message', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: 9999 })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.errorMessage).toBe('')
    })

    it('returns empty string for errors with unknown string code and no message', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: 'UNKNOWN_CODE' })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.errorMessage).toBe('')
    })
  })

  describe('send — error thrown inside transaction.wait()', () => {
    it('applies error mapping to errors thrown during wait()', async () => {
      const mockWait = vi.fn().mockRejectedValueOnce({ code: 4001 })
      mockTransferHolder.mockResolvedValueOnce({ wait: mockWait })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.state).toBe('ERROR')
      expect(result.current.errorMessage).toBe('User Rejected Transaction')
    })
  })

  describe('reset', () => {
    it('clears errorMessage and returns to UNINITIALIZED', async () => {
      mockTransferHolder.mockRejectedValueOnce({ code: 4001 })

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContract, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.send({})
      })

      expect(result.current.errorMessage).toBe('User Rejected Transaction')

      act(() => {
        result.current.reset()
      })

      expect(result.current.errorMessage).toBeUndefined()
      expect(result.current.state).toBe('UNINITIALIZED')
    })
  })

  describe('call — error handling', () => {
    it('sets ERROR state without errorMessage when contract is missing', async () => {
      const { result } = renderHook(() =>
        useContractFunctionHook(undefined, 'transferHolder' as any)
      )

      await act(async () => {
        await result.current.call()
      })

      expect(result.current.state).toBe('ERROR')
      expect(result.current.errorMessage).toBeUndefined()
    })

    it('maps call error code to errorMessage', async () => {
      const mockContractWithMethod = {
        functions: {
          someMethod: vi
            .fn()
            .mockRejectedValueOnce({ code: 'INSUFFICIENT_FUNDS' }),
        },
      } as any

      const { result } = renderHook(() =>
        useContractFunctionHook(mockContractWithMethod, 'someMethod' as any)
      )

      await act(async () => {
        await result.current.call()
      })

      expect(result.current.state).toBe('ERROR')
      expect(result.current.errorMessage).toBe('Insufficient Funds')
    })
  })
})
