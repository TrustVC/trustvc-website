import { useCallback, useState } from 'react'
import {
  type ContractFunctionState,
  getMetaMaskErrorMessage,
} from '../hooks/useContractFunctionHook'
import { useDocumentContext } from '../components/common/contexts/DocumentContext'
import { useProviderContext } from '../components/common/contexts/providerContext'
import { getRpcUrl } from '../utils/helper'
import { checkEIP7702Delegation } from './checkDelegation'
import { checkPaymasterWhitelist } from './checkPaymasterWhitelist'
import { buildSmartAccountClient } from './buildSmartAccountClient'
import { getPaymasterAddress } from './paymasterStorage'

const PAYMASTER_ADDRESS = import.meta.env.VITE_PAYMASTER_ADDRESS as
  | string
  | undefined
const PIMLICO_API_KEY = import.meta.env.VITE_PIMLICO_API_KEY as
  | string
  | undefined

export interface GaslessContractOptions {
  titleEscrowAddress?: string
  tokenRegistryAddress?: string
  tokenId?: string
}

type SmartClientLike = {
  sendTransaction(args: {
    to: `0x${string}`
    value: bigint
    data: `0x${string}`
  }): Promise<`0x${string}`>
}

type DirectFn = (
  contractArgs: object,
  signer: any,
  params: any,
  opts: { id: string }
) => Promise<{ wait(): Promise<{ transactionHash: string }> }>

export interface MakeGaslessHookConfig<P> {
  gaslessFn: (
    contractArgs: object,
    client: SmartClientLike,
    params: any,
    opts: { id: string }
  ) => Promise<string>
  directFn: DirectFn
  /** BoE / obligation-registry paid path (no EIP-7702 gasless). */
  obligationFn?: DirectFn
  buildGaslessArgs: (opts: GaslessContractOptions) => object
  buildDirectArgs: (opts: GaslessContractOptions) => object
  buildParams?: (params: P, opts: GaslessContractOptions) => any
  directGuard?: (opts: GaslessContractOptions) => void
  extraEligibility?: (opts: GaslessContractOptions) => boolean
}

const toObligationArgs = (opts: GaslessContractOptions) => ({
  obligationRegistryAddress: opts.tokenRegistryAddress,
  obligationEscrowAddress: opts.titleEscrowAddress,
  tokenId: opts.tokenId,
})

export function makeGaslessHook<P>(config: MakeGaslessHookConfig<P>) {
  return function (
    contractOptions: GaslessContractOptions,
    providerOrSigner: any,
    chainId?: string,
    /** Optional guard (e.g. assertSignerOnDocumentChain) before BoE writes. */
    preflightCheck?: () => void
  ) {
    const [state, setState] = useState<ContractFunctionState>('UNINITIALIZED')
    const [errorMessage, setErrorMessage] = useState<string | undefined>()
    const [transactionHash, setTransactionHash] = useState<string | undefined>()

    const { keyId, isObligation } = useDocumentContext()
    const { account } = useProviderContext()

    const reset = useCallback(() => {
      setState('UNINITIALIZED')
      setErrorMessage(undefined)
      setTransactionHash(undefined)
    }, [])

    const send = useCallback(
      async (params: P) => {
        setState('UNINITIALIZED')
        setErrorMessage(undefined)
        setTransactionHash(undefined)

        try {
          setState('INITIALIZED')

          const resolvedParams = config.buildParams
            ? config.buildParams(params, contractOptions)
            : params
          const opts = { id: keyId ?? '' }

          // BoE: always use obligation-registry functions (not Token Registry V4/V5 / gasless).
          if (isObligation) {
            if (!config.obligationFn) {
              throw new Error(
                'This action is not supported for Bill of Exchange (obligation registry) documents'
              )
            }
            // Same document-chain guard as useContractFunctionHook's obligation
            // writes — wallet must be on the document network before broadcast.
            preflightCheck?.()
            setState('PENDING_CONFIRMATION')
            const tx = await config.obligationFn(
              toObligationArgs(contractOptions),
              providerOrSigner,
              resolvedParams,
              opts
            )
            const receipt = await tx.wait()
            setTransactionHash(receipt.transactionHash)
            setState('CONFIRMED')
            return
          }

          let useGasless = false
          const resolvedPaymasterAddress =
            getPaymasterAddress(account) || PAYMASTER_ADDRESS

          const hasGaslessConfig =
            !!account &&
            !!contractOptions.titleEscrowAddress &&
            !!resolvedPaymasterAddress &&
            !!PIMLICO_API_KEY &&
            !!chainId &&
            !!(window as any).ethereum &&
            (config.extraEligibility?.(contractOptions) ?? true)

          if (hasGaslessConfig) {
            const rpcUrl = getRpcUrl(chainId!)
            if (rpcUrl) {
              try {
                const isDelegated = await checkEIP7702Delegation(
                  account!,
                  rpcUrl
                )
                if (isDelegated) {
                  const { isCallerAuthorized, isTitleEscrowAuthorized } =
                    await checkPaymasterWhitelist(
                      resolvedPaymasterAddress!,
                      account!,
                      contractOptions.titleEscrowAddress!,
                      rpcUrl
                    )
                  useGasless = isCallerAuthorized && isTitleEscrowAuthorized
                }
              } catch {
                // Eligibility check failed — fall back to the paid transaction path
                useGasless = false
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
            const txHash = await config.gaslessFn(
              config.buildGaslessArgs(contractOptions),
              smartAccountClient as SmartClientLike,
              resolvedParams,
              opts
            )
            setTransactionHash(txHash)
          } else {
            config.directGuard?.(contractOptions)
            const tx = await config.directFn(
              config.buildDirectArgs(contractOptions),
              providerOrSigner,
              resolvedParams,
              opts
            )
            const receipt = await tx.wait()
            setTransactionHash(receipt.transactionHash)
          }

          setState('CONFIRMED')
        } catch (e: unknown) {
          setErrorMessage(
            getMetaMaskErrorMessage(e) ||
              (e instanceof Error ? e.message : 'Transaction failed')
          )
          setState('ERROR')
        }
      },
      [
        contractOptions,
        providerOrSigner,
        chainId,
        account,
        keyId,
        isObligation,
        preflightCheck,
      ]
    )

    return { send, state, transactionHash, errorMessage, reset }
  }
}
