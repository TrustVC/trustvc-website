import { describe, expect, it } from 'vitest'
import type { MagicUserMetadata } from '@magic-sdk/types'
import { ethereumAddressFromMagicUserMetadata } from './magicWallet'

describe('ethereumAddressFromMagicUserMetadata', () => {
  it('returns ethereum wallet address from wallets.ethereum', () => {
    const info = {
      issuer: null,
      email: null,
      phoneNumber: null,
      isMfaEnabled: false,
      recoveryFactors: [],
      firstLoginAt: null,
      wallets: {
        ethereum: {
          publicAddress: '0xabc',
          subAccounts: [],
        },
      },
    } as MagicUserMetadata
    expect(ethereumAddressFromMagicUserMetadata(info)).toBe('0xabc')
  })

  it('falls back to legacy publicAddress on root', () => {
    const info = {
      issuer: null,
      email: null,
      phoneNumber: null,
      isMfaEnabled: false,
      recoveryFactors: [],
      firstLoginAt: null,
      wallets: {},
      publicAddress: '0xlegacy',
    } as unknown as MagicUserMetadata
    expect(ethereumAddressFromMagicUserMetadata(info)).toBe('0xlegacy')
  })

  it('returns undefined when missing', () => {
    expect(ethereumAddressFromMagicUserMetadata(undefined)).toBeUndefined()
    expect(
      ethereumAddressFromMagicUserMetadata({
        issuer: null,
        email: null,
        phoneNumber: null,
        isMfaEnabled: false,
        recoveryFactors: [],
        firstLoginAt: null,
        wallets: {},
      } as MagicUserMetadata)
    ).toBeUndefined()
  })
})
