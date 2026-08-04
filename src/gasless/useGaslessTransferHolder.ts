import {
  transferHolder,
  transferHolderGasless,
  transferHolderObligationRegistry,
} from '@trustvc/trustvc'
import { makeGaslessHook } from './makeGaslessHook'

interface TransferHolderParams {
  holderAddress: string
  remarks?: string
}

export const useGaslessTransferHolder = makeGaslessHook<TransferHolderParams>({
  gaslessFn: transferHolderGasless as any,
  directFn: transferHolder as any,
  obligationFn: transferHolderObligationRegistry as any,
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
