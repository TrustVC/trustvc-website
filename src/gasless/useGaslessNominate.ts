import {
  nominate,
  nominateGasless,
  nominateObligationRegistry,
} from '@trustvc/trustvc'
import { makeGaslessHook } from './makeGaslessHook'

interface NominateParams {
  newBeneficiaryAddress: string
  remarks?: string
}

export const useGaslessNominate = makeGaslessHook<NominateParams>({
  gaslessFn: nominateGasless as any,
  directFn: nominate as any,
  obligationFn: nominateObligationRegistry as any,
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
