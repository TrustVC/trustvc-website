import { rejectReturned, rejectReturnedGasless } from '@trustvc/trustvc'
import { makeGaslessHook } from './makeGaslessHook'

interface RejectReturnedSendParams {
  remarks?: string
}

export const useGaslessRejectReturned =
  makeGaslessHook<RejectReturnedSendParams>({
    gaslessFn: rejectReturnedGasless as any,
    directFn: rejectReturned as any,
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
