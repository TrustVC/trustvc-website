import { transferOwners, transferOwnersGasless } from '@trustvc/trustvc'
import { makeGaslessHook } from './makeGaslessHook'

interface TransferOwnersParams {
  newHolderAddress: string
  newBeneficiaryAddress: string
  remarks?: string
}

export const useGaslessTransferOwners = makeGaslessHook<TransferOwnersParams>({
  gaslessFn: transferOwnersGasless as any,
  directFn: transferOwners as any,
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
