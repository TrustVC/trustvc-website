import { acceptReturned, acceptReturnedGasless } from '@trustvc/trustvc'
import { makeGaslessHook } from './makeGaslessHook'

interface AcceptReturnedSendParams {
  remarks?: string
}

export const useGaslessAcceptReturned =
  makeGaslessHook<AcceptReturnedSendParams>({
    gaslessFn: acceptReturnedGasless as any,
    directFn: acceptReturned as any,
    buildGaslessArgs: ({ tokenRegistryAddress }) => ({
      tokenRegistryAddress: tokenRegistryAddress!,
    }),
    buildDirectArgs: ({ tokenRegistryAddress }) => ({ tokenRegistryAddress }),
    buildParams: (params, { tokenId }) => ({ tokenId: tokenId!, ...params }),
    directGuard: ({ tokenRegistryAddress }) => {
      if (!tokenRegistryAddress)
        throw new Error('tokenRegistryAddress is required')
    },
    extraEligibility: ({ tokenRegistryAddress, tokenId }) =>
      !!tokenRegistryAddress && !!tokenId,
  })
