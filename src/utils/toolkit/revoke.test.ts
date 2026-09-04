// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { Contract, providers, type Signer } from 'ethers'
import type { CHAIN_ID } from '@trustvc/trustvc'
import {
  extractRevokeTarget,
  revokeOnDocumentStore,
  toRevokeErrorMessage,
  truncateHash,
} from './revoke'
import { wrapRawDocument } from './wrap'
import { SAMPLE_RAW_V2_DOCUMENT } from './types'

const { ContractMock } = vi.hoisted(() => ({
  ContractMock: vi.fn(),
}))

vi.mock('ethers', async () => {
  const actual = await vi.importActual<typeof import('ethers')>('ethers')
  ContractMock.mockImplementation(
    (...args: ConstructorParameters<typeof actual.Contract>) =>
      new actual.Contract(...args)
  )
  return {
    ...actual,
    Contract: ContractMock,
  }
})

describe('toolkit revoke', () => {
  it('extracts store address and merkle root from a wrapped v2 document', async () => {
    const wrapped = await wrapRawDocument(SAMPLE_RAW_V2_DOCUMENT)
    const target = extractRevokeTarget(wrapped)
    expect(target.storeAddress.toLowerCase()).toBe(
      SAMPLE_RAW_V2_DOCUMENT.issuers[0].documentStore.toLowerCase()
    )
    expect(target.documentHash.startsWith('0x')).toBe(true)
    expect(target.documentHash.length).toBe(66)
  })

  it('extracts a real wrapped v2 document pasted by a user', () => {
    const wrapped = {
      version: 'https://schema.openattestation.com/2.0/schema.json',
      data: {
        $template: {
          name: '98b3e57c-b80a-465f-86e3-645c6ab6e7d7:string:main',
          type: 'fb45bf0f-b6b3-4d27-971e-e157fc1544b9:string:EMBEDDED_RENDERER',
          url: '2a5b2916-eaac-4806-b175-b35ac6f07877:string:https://generic-templates.tradetrust.io',
        },
        issuers: [
          {
            name: 'b8aa305a-89f7-475e-b09b-c21c62687b20:string:Demo Issuer',
            documentStore:
              'fbfe631b-e738-4bd1-b857-596e1c2e16a8:string:0x28712Bd97849D4dF0BC7Ed26Ff882a284dD788C2',
            identityProof: {
              type: '610f49db-7245-4b86-b7b6-05b9e2cad9c7:string:DNS-TXT',
              location:
                '66a09621-0983-435c-a737-24f66469020d:string:example.openattestation.com',
            },
          },
        ],
        network: {
          chain: '4fe14a52-94ea-4af7-a09d-296b54578b81:string:ETH',
          chainId: '86ecfdec-c299-4c14-bfab-a29a9794d495:string:11155111',
        },
        recipient: {
          name: '1d3f0433-949e-4a32-ad1d-af92e292ca76:string:Alice Lim',
        },
        name: 'ae318bce-7e7f-4bae-affb-f4a6aba5d071:string:Alice Lim',
        degree:
          '5461d82c-fff4-4804-929b-580a93480d55:string:BSc Computer Science',
      },
      signature: {
        type: 'SHA3MerkleProof',
        targetHash:
          'e37a2f52313e5fd136f3f752646d2edd56920c322f862d74efdf7fa0b3f83c03',
        proof: [],
        merkleRoot:
          'e37a2f52313e5fd136f3f752646d2edd56920c322f862d74efdf7fa0b3f83c03',
      },
    }
    const target = extractRevokeTarget(wrapped)
    expect(target.storeAddress).toBe(
      '0x28712Bd97849D4dF0BC7Ed26Ff882a284dD788C2'
    )
    expect(target.documentHash).toBe(
      '0xe37a2f52313e5fd136f3f752646d2edd56920c322f862d74efdf7fa0b3f83c03'
    )
  })

  it('truncates hashes for confirm copy', () => {
    expect(truncateHash('0x9a1c8f2e7b3d4a5e6c1f0b2d9e8a7c6b5d4e3f2a')).toMatch(
      /^0x9a1c8f…/
    )
  })

  it('rewrites the SDK callStatic pre-check into actionable copy', () => {
    expect(
      toRevokeErrorMessage(
        new Error('Pre-check (callStatic) for revoke failed')
      )
    ).toMatch(/document store rejected this revoke/i)
    expect(
      toRevokeErrorMessage(
        new TypeError(
          'documentStoreContract.callStatic.revoke is not a function'
        )
      )
    ).toMatch(/document store rejected this revoke/i)
  })

  it('rewrites a missing revoker role', () => {
    expect(
      toRevokeErrorMessage({
        reason: 'AccessControl: account is missing role',
      })
    ).toMatch(/does not have revoker rights/i)
  })

  it('exposes callStatic.revoke when the ABI has only the single-hash revoke', () => {
    const contract = new Contract(
      '0x0000000000000000000000000000000000dEaD',
      ['function revoke(bytes32 document)'],
      new providers.JsonRpcProvider()
    )
    expect(typeof contract.callStatic.revoke).toBe('function')
    expect(typeof contract.revoke).toBe('function')
  })

  it('rewrites wallet rejection and insufficient funds', () => {
    expect(toRevokeErrorMessage(new Error('user rejected transaction'))).toBe(
      'Revoke cancelled in your wallet.'
    )
    expect(toRevokeErrorMessage({ code: 4001 })).toBe(
      'Revoke cancelled in your wallet.'
    )
    expect(toRevokeErrorMessage(new Error('insufficient funds for gas'))).toBe(
      'This wallet does not have enough cryptocurrency to pay for the transaction.'
    )
  })

  it('falls back when the error has no usable message', () => {
    expect(toRevokeErrorMessage({})).toBe('Revoke failed. Please try again.')
  })

  it('wraps an unrecognised error instead of showing it bare', () => {
    expect(toRevokeErrorMessage(new Error('nonce too low'))).toBe(
      'Revoke failed. The wallet or network reported: "nonce too low" — double-check the store address, hash and network, then try again.'
    )
  })

  it('rewrites an InactiveDocument revert instead of the ethers dump', () => {
    expect(
      toRevokeErrorMessage(
        new Error(
          'call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="revoke(bytes32)", data="0xd19a0b2f596234fcc71050f9701df16735f19dc57dea741ad733a4aceeeaa9fe22f3cc5f596234fcc71050f9701df16735f19dc57dea741ad733a4aceeeaa9fe22f3cc5f", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.8.0)'
        )
      )
    ).toBe(
      'This document is already revoked on that document store. Revoking it again is not possible.'
    )
  })

  it('rewrites a generic CALL_EXCEPTION when the revert cannot be decoded', () => {
    expect(
      toRevokeErrorMessage({
        message:
          'call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ]',
        reason: null,
      })
    ).toMatch(/document store rejected this revoke/i)
  })

  it('prefers a short revert reason over a noisy raw message', () => {
    expect(
      toRevokeErrorMessage({
        message:
          'call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ]',
        reason: 'document already revoked',
      })
    ).toBe(
      'This document is already revoked on that document store. Revoking it again is not possible.'
    )
  })

  it('does not call the document store when the signer is on a different network', async () => {
    ContractMock.mockClear()
    const signer = {
      getChainId: vi.fn().mockResolvedValue(1),
    } as unknown as Signer

    await expect(
      revokeOnDocumentStore({
        storeAddress: '0xA594f6e10564e87888425c7CC3910FE1c800aB0B',
        documentHash: `0x${'ab'.repeat(32)}`,
        signer,
        chainId: '137' as CHAIN_ID,
      })
    ).rejects.toThrow(/underlying network changed/i)

    expect(ContractMock).not.toHaveBeenCalled()
  })

  it('rejects after mining when the revoke transaction status is not success', async () => {
    const wait = vi.fn().mockResolvedValue({ status: 0 })
    const revoke = vi.fn().mockResolvedValue({ hash: '0xabc', wait })
    const callStaticRevoke = vi.fn().mockResolvedValue(undefined)
    ContractMock.mockImplementationOnce(() => ({
      callStatic: { revoke: callStaticRevoke },
      revoke,
    }))

    await expect(
      revokeOnDocumentStore({
        storeAddress: '0xA594f6e10564e87888425c7CC3910FE1c800aB0B',
        documentHash: `0x${'ab'.repeat(32)}`,
        signer: {
          getChainId: vi.fn().mockResolvedValue(1),
        } as unknown as Signer,
        chainId: '1' as CHAIN_ID,
      })
    ).rejects.toThrow(/call revert exception/i)

    expect(callStaticRevoke).toHaveBeenCalled()
    expect(revoke).toHaveBeenCalled()
    expect(wait).toHaveBeenCalled()
  })
})
