import { useCallback, useState } from 'react'
import {
  rejectTransferHolder,
  rejectTransferHolderGasless,
} from '@trustvc/trustvc'
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

interface RejectTransferParams {
  remarks?: string
}

export function useGaslessRejectTransferHolder(
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
    async (params: RejectTransferParams = {}) => {
      setState('UNINITIALIZED')
      setErrorMessage(undefined)
      setTransactionHash(undefined)

      const { titleEscrowAddress, tokenRegistryAddress, tokenId } =
        contractOptions

      try {
        setState('INITIALIZED')

        let useGasless = false

        const resolvedPaymasterAddress =
          (account
            ? localStorage.getItem(`trustvc_paymaster_${account}`)
            : null) || PAYMASTER_ADDRESS

        const hasGaslessConfig =
          !!account &&
          !!titleEscrowAddress &&
          !!resolvedPaymasterAddress &&
          !!PIMLICO_API_KEY &&
          !!chainId &&
          !!(window as any).ethereum

        if (hasGaslessConfig) {
          const rpcUrl = getRpcUrl(chainId!)

          if (rpcUrl) {
            const isDelegated = await checkEIP7702Delegation(account!, rpcUrl)

            if (isDelegated) {
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

          const txHash = await rejectTransferHolderGasless(
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
          if (!titleEscrowAddress)
            throw new Error('titleEscrowAddress is required')
          const tx = await rejectTransferHolder(
            { titleEscrowAddress, tokenRegistryAddress, tokenId },
            providerOrSigner,
            params,
            { id: keyId ?? '' }
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
    [contractOptions, providerOrSigner, chainId, account, keyId]
  )

  return { send, state, transactionHash, errorMessage, reset }
}
