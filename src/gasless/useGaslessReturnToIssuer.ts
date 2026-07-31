import { returnToIssuer, returnToIssuerGasless } from '@trustvc/trustvc'
import { makeGaslessHook } from './makeGaslessHook'

interface ReturnToIssuerParams {
  remarks?: string
}

export const useGaslessReturnToIssuer = makeGaslessHook<ReturnToIssuerParams>({
  gaslessFn: returnToIssuerGasless as any,
  directFn: returnToIssuer as any,
  buildGaslessArgs: ({ titleEscrowAddress }) => ({
    titleEscrowAddress: titleEscrowAddress!,
  }),
  buildDirectArgs: ({ titleEscrowAddress, tokenRegistryAddress, tokenId }) => ({
    titleEscrowAddress,
    tokenRegistryAddress,
    tokenId,
  }),
  directGuard: ({ titleEscrowAddress }) => {
    if (!titleEscrowAddress) throw new Error('titleEscrowAddress is required')
  },
})
