import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useContractFunctionHook } from './useContractFunctionHook'

const {
  mockTransferHolder,
  mockTransferHolderObligation,
  mockAcceptObligation,
} = vi.hoisted(() => ({
  mockTransferHolder: vi.fn(),
  mockTransferHolderObligation: vi.fn(),
  mockAcceptObligation: vi.fn(),
}))

vi.mock('../components/common/contexts/DocumentContext', () => ({
  useDocumentContext: vi.fn(() => ({ keyId: 'test-key', isObligation: false })),
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
  acceptObligationRegistry: mockAcceptObligation,
  rejectObligationRegistry: vi.fn(),
  dischargeObligationRegistry: vi.fn(),
  transferHolderObligationRegistry: mockTransferHolderObligation,
  transferBeneficiaryObligationRegistry: vi.fn(),
  transferOwnersObligationRegistry: vi.fn(),
  nominateObligationRegistry: vi.fn(),
  returnToIssuerObligationRegistry: vi.fn(),
  rejectTransferHolderObligationRegistry: vi.fn(),
  rejectTransferBeneficiaryObligationRegistry: vi.fn(),
  rejectTransferOwnersObligationRegistry: vi.fn(),
  acceptReturnedObligationRegistry: vi.fn(),
  rejectReturnedObligationRegistry: vi.fn(),
}))

import { useDocumentContext } from '../components/common/contexts/DocumentContext'

const mockContract = { address: '0xabc' } as any
const mockSigner = { _isSigner: true } as any
const contractOptions = {
  titleEscrowAddress: '0xESCROW',
  tokenRegistryAddress: '0xREGISTRY',
  tokenId: '0xtoken',
}

describe('useContractFunctionHook — obligation registry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDocumentContext).mockReturnValue({
      keyId: 'test-key',
      isObligation: false,
    } as any)
  })

  it('routes transferHolder to classic transferHolder when not obligation', async () => {
    const mockTx = {
      wait: vi.fn().mockResolvedValue({ transactionHash: '0xhash' }),
    }
    mockTransferHolder.mockResolvedValueOnce(mockTx)

    const { result } = renderHook(() =>
      useContractFunctionHook(
        mockContract,
        'transferHolder' as any,
        contractOptions,
        mockSigner
      )
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEW' })
    })

    expect(mockTransferHolder).toHaveBeenCalledOnce()
    expect(mockTransferHolderObligation).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('routes transferHolder to transferHolderObligationRegistry for BoE', async () => {
    vi.mocked(useDocumentContext).mockReturnValue({
      keyId: 'boe-key',
      isObligation: true,
    } as any)

    const mockTx = {
      wait: vi.fn().mockResolvedValue({ transactionHash: '0xboe' }),
    }
    mockTransferHolderObligation.mockResolvedValueOnce(mockTx)

    const { result } = renderHook(() =>
      useContractFunctionHook(
        mockContract,
        'transferHolder' as any,
        contractOptions,
        mockSigner
      )
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEW' })
    })

    expect(mockTransferHolderObligation).toHaveBeenCalledOnce()
    expect(mockTransferHolderObligation).toHaveBeenCalledWith(
      {
        obligationRegistryAddress: '0xREGISTRY',
        obligationEscrowAddress: '0xESCROW',
        tokenId: '0xtoken',
      },
      mockSigner,
      { holderAddress: '0xNEW' },
      { id: 'boe-key' }
    )
    expect(mockTransferHolder).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('routes accept to acceptObligationRegistry for BoE', async () => {
    vi.mocked(useDocumentContext).mockReturnValue({
      keyId: 'boe-key',
      isObligation: true,
    } as any)

    const mockTx = {
      wait: vi.fn().mockResolvedValue({ transactionHash: '0xaccept' }),
    }
    mockAcceptObligation.mockResolvedValueOnce(mockTx)

    const { result } = renderHook(() =>
      useContractFunctionHook(
        mockContract,
        'accept' as any,
        contractOptions,
        mockSigner
      )
    )

    await act(async () => {
      await result.current.send({ remarks: 'accept boe' })
    })

    expect(mockAcceptObligation).toHaveBeenCalledOnce()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('maps classic options to obligation options when already using obligation keys', async () => {
    vi.mocked(useDocumentContext).mockReturnValue({
      keyId: 'boe-key',
      isObligation: true,
    } as any)

    const mockTx = {
      wait: vi.fn().mockResolvedValue({ transactionHash: '0xhash' }),
    }
    mockTransferHolderObligation.mockResolvedValueOnce(mockTx)

    const alreadyMapped = {
      obligationRegistryAddress: '0xOBLREG',
      obligationEscrowAddress: '0xOBLESC',
      tokenId: '0xtoken2',
    }

    const { result } = renderHook(() =>
      useContractFunctionHook(
        mockContract,
        'transferHolder' as any,
        alreadyMapped,
        mockSigner
      )
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEW' })
    })

    expect(mockTransferHolderObligation).toHaveBeenCalledWith(
      alreadyMapped,
      mockSigner,
      { holderAddress: '0xNEW' },
      { id: 'boe-key' }
    )
  })
})
