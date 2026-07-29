import {
  rejectTransferBeneficiary,
  rejectTransferBeneficiaryGasless,
} from '@trustvc/trustvc'
import { makeGaslessHook } from './makeGaslessHook'

interface RejectTransferParams {
  remarks?: string
}

export const useGaslessRejectTransferBeneficiary =
  makeGaslessHook<RejectTransferParams>({
    gaslessFn: rejectTransferBeneficiaryGasless as any,
    directFn: rejectTransferBeneficiary as any,
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
