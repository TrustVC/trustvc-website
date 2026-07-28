import {
  transferBeneficiary,
  transferBeneficiaryGasless,
} from '@trustvc/trustvc'
import { makeGaslessHook } from './makeGaslessHook'

interface TransferBeneficiaryParams {
  newBeneficiaryAddress: string
  remarks?: string
}

export const useGaslessTransferBeneficiary =
  makeGaslessHook<TransferBeneficiaryParams>({
    gaslessFn: transferBeneficiaryGasless as any,
    directFn: transferBeneficiary as any,
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
