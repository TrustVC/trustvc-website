import {
  rejectTransferHolder,
  rejectTransferHolderGasless,
} from '@trustvc/trustvc'
import { makeGaslessHook } from './makeGaslessHook'

interface RejectTransferParams {
  remarks?: string
}

export const useGaslessRejectTransferHolder =
  makeGaslessHook<RejectTransferParams>({
    gaslessFn: rejectTransferHolderGasless as any,
    directFn: rejectTransferHolder as any,
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
