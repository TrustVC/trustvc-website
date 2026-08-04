import {
  acceptReturned,
  acceptReturnedGasless,
  acceptReturnedObligationRegistry,
} from '@trustvc/trustvc'
import { makeGaslessHook } from './makeGaslessHook'

interface AcceptReturnedSendParams {
  remarks?: string
}

export const useGaslessAcceptReturned =
  makeGaslessHook<AcceptReturnedSendParams>({
    gaslessFn: acceptReturnedGasless as any,
    directFn: acceptReturned as any,
    obligationFn: acceptReturnedObligationRegistry as any,
    buildGaslessArgs: ({ tokenRegistryAddress }) => ({
      tokenRegistryAddress: tokenRegistryAddress!,
    }),
    buildDirectArgs: ({ tokenRegistryAddress }) => ({ tokenRegistryAddress }),
    buildParams: (params, { tokenId }) => ({ tokenId: tokenId!, ...params }),
    directGuard: ({ tokenRegistryAddress, tokenId }) => {
      if (!tokenRegistryAddress)
        throw new Error('tokenRegistryAddress is required')
      if (!tokenId) throw new Error('tokenId is required')
    },
    extraEligibility: ({ tokenRegistryAddress, tokenId }) =>
      !!tokenRegistryAddress && !!tokenId,
  })
