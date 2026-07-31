import {
  rejectTransferOwners,
  rejectTransferOwnersGasless,
} from '@trustvc/trustvc'
import { makeGaslessHook } from './makeGaslessHook'

interface RejectTransferParams {
  remarks?: string
}

export const useGaslessRejectTransferOwners =
  makeGaslessHook<RejectTransferParams>({
    gaslessFn: rejectTransferOwnersGasless as any,
    directFn: rejectTransferOwners as any,
    buildGaslessArgs: ({ titleEscrowAddress }) => ({
      titleEscrowAddress: titleEscrowAddress!,
    }),
    buildDirectArgs: ({
      titleEscrowAddress,
      tokenRegistryAddress,
      tokenId,
    }) => ({ titleEscrowAddress, tokenRegistryAddress, tokenId }),
    directGuard: ({ titleEscrowAddress }) => {
      if (!titleEscrowAddress) throw new Error('titleEscrowAddress is required')
    },
  })
