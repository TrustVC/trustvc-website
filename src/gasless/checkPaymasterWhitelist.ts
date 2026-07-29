import { createPublicClient, http } from 'viem'
import { eip7702Abis } from '@trustvc/trustvc'

const PAYMASTER_ABI = eip7702Abis.platformPaymasterAbi

export interface PaymasterWhitelistResult {
  isCallerAuthorized: boolean
  isTitleEscrowAuthorized: boolean
}

/**
 * Checks whether `userAddress` is an authorized caller and `titleEscrowAddress`
 * is an authorized title escrow on the given PlatformPaymaster contract.
 */
export async function checkPaymasterWhitelist(
  paymasterAddress: string,
  userAddress: string,
  titleEscrowAddress: string,
  rpcUrl: string
): Promise<PaymasterWhitelistResult> {
  const publicClient = createPublicClient({ transport: http(rpcUrl) })

  const [isCallerAuthorized, isTitleEscrowAuthorized] = await Promise.all([
    publicClient.readContract({
      address: paymasterAddress as `0x${string}`,
      abi: PAYMASTER_ABI,
      functionName: 'authorizedCallers',
      args: [userAddress as `0x${string}`],
    }),
    publicClient.readContract({
      address: paymasterAddress as `0x${string}`,
      abi: PAYMASTER_ABI,
      functionName: 'authorizedTitleEscrows',
      args: [titleEscrowAddress as `0x${string}`],
    }),
  ])

  return { isCallerAuthorized, isTitleEscrowAuthorized }
}
