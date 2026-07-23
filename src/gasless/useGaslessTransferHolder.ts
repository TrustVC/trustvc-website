import { useCallback, useState } from 'react'
import { transferHolder, transferHolderGasless } from '@trustvc/trustvc'
import { type ContractFunctionState } from '../hooks/useContractFunctionHook'
import { useDocumentContext } from '../components/common/contexts/DocumentContext'
import { useProviderContext } from '../components/common/contexts/providerContext'
import { getRpcUrl } from '../utils/helper'
import { getMetaMaskErrorMessage } from '../hooks/useContractFunctionHook'
import { checkEIP7702Delegation } from './checkDelegation'
import { checkPaymasterWhitelist } from './checkPaymasterWhitelist'
import { buildSmartAccountClient } from './buildSmartAccountClient'

const PAYMASTER_ADDRESS = import.meta.env.VITE_PAYMASTER_ADDRESS as
  | string
  | undefined
const PIMLICO_API_KEY = import.meta.env.VITE_PIMLICO_API_KEY as
  | string
  | undefined

interface ContractOptions {
  titleEscrowAddress?: string
  tokenRegistryAddress?: string
  tokenId?: string
}

interface TransferHolderParams {
  holderAddress: string
  remarks?: string
}

/**
 * Drop-in replacement for useContractFunctionHook(titleEscrow, 'transferHolder', ...).
 *
 * On send(), automatically checks:
 *   1. EIP-7702 delegation on the caller's EOA
 *   2. PlatformPaymaster whitelist (authorizedCallers + authorizedTitleEscrows)
 *
 * If both pass → executes gaslessly via transferHolderGasless.
 * Otherwise → falls back to the standard transferHolder (paid transaction).
 */
export function useGaslessTransferHolder(
  contractOptions: ContractOptions,
  providerOrSigner: any,
  chainId?: string
) {
  const [state, setState] = useState<ContractFunctionState>('UNINITIALIZED')
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [transactionHash, setTransactionHash] = useState<string | undefined>()

  const { keyId } = useDocumentContext()
  const { account } = useProviderContext()

  const reset = useCallback(() => {
    setState('UNINITIALIZED')
    setErrorMessage(undefined)
    setTransactionHash(undefined)
  }, [])

  const send = useCallback(
    async (params: TransferHolderParams) => {
      reset()

      const { titleEscrowAddress, tokenRegistryAddress, tokenId } =
        contractOptions

      try {
        setState('INITIALIZED')

        let useGasless = false

        // Read paymaster address fresh on each send — user may have set it after page load
        const resolvedPaymasterAddress =
          (account
            ? localStorage.getItem(`trustvc_paymaster_${account}`)
            : null) || PAYMASTER_ADDRESS

        // Gasless eligibility checks — all conditions must be met
        const hasGaslessConfig =
          !!account &&
          !!titleEscrowAddress &&
          !!resolvedPaymasterAddress &&
          !!PIMLICO_API_KEY &&
          !!chainId &&
          !!(window as any).ethereum // MetaMask required for EIP-7702 signing

        if (hasGaslessConfig) {
          const rpcUrl = getRpcUrl(chainId!)

          if (rpcUrl) {
            // Step 1: Check EIP-7702 delegation
            const isDelegated = await checkEIP7702Delegation(account!, rpcUrl)

            if (isDelegated) {
              // Step 2: Check paymaster whitelist
              const { isCallerAuthorized, isTitleEscrowAuthorized } =
                await checkPaymasterWhitelist(
                  resolvedPaymasterAddress!,
                  account!,
                  titleEscrowAddress!,
                  rpcUrl
                )

              useGasless = isCallerAuthorized && isTitleEscrowAuthorized
            }
          }
        }

        setState('PENDING_CONFIRMATION')

        if (useGasless) {
          const { smartAccountClient } = await buildSmartAccountClient(
            account as `0x${string}`,
            resolvedPaymasterAddress as `0x${string}`,
            Number(chainId),
            getRpcUrl(chainId!)!,
            PIMLICO_API_KEY!
          )

          const txHash = await transferHolderGasless(
            { titleEscrowAddress: titleEscrowAddress! },
            smartAccountClient as {
              sendTransaction(args: {
                to: `0x${string}`
                value: bigint
                data: `0x${string}`
              }): Promise<`0x${string}`>
            },
            params,
            { id: keyId ?? '' }
          )

          setTransactionHash(txHash)
        } else {
          // Traditional paid transaction fallback
          const options = { id: keyId ?? '' }
          if (!titleEscrowAddress)
            throw new Error('titleEscrowAddress is required')
          const tx = await transferHolder(
            { titleEscrowAddress, tokenRegistryAddress, tokenId },
            providerOrSigner,
            params,
            options
          )
          const receipt = await tx.wait()
          setTransactionHash(receipt.transactionHash)
        }

        setState('CONFIRMED')
      } catch (e: unknown) {
        setErrorMessage(getMetaMaskErrorMessage(e))
        setState('ERROR')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contractOptions, providerOrSigner, chainId, account, keyId]
  )

  return { send, state, transactionHash, errorMessage, reset }
}
