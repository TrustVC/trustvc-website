import { BaseContract, ContractReceipt, ContractTransaction } from 'ethers'
import { useCallback, useState } from 'react'
import {
  rejectTransferHolder,
  rejectTransferBeneficiary,
  transferBeneficiary,
  transferHolder,
  transferOwners,
  nominate,
  returnToIssuer,
  rejectReturned,
  acceptReturned,
  rejectTransferOwners,
  acceptObligationRegistry,
  rejectObligationRegistry,
  dischargeObligationRegistry,
  transferHolderObligationRegistry,
  transferBeneficiaryObligationRegistry,
  transferOwnersObligationRegistry,
  nominateObligationRegistry,
  returnToIssuerObligationRegistry,
  rejectTransferHolderObligationRegistry,
  rejectTransferBeneficiaryObligationRegistry,
  rejectTransferOwnersObligationRegistry,
  acceptReturnedObligationRegistry,
  rejectReturnedObligationRegistry,
} from '@trustvc/trustvc'
import { TitleEscrow, TradeTrustToken } from '../types'
import { TypedContractMethod } from '@trustvc/trustvc'
import { useDocumentContext } from '../components/common/contexts/DocumentContext'

const METAMASK_NUMERIC_CODES: Record<number, string> = {
  4001: 'User Rejected Transaction',
  4100: 'Unauthorized: Account or method not authorized',
  4200: 'Unsupported Method',
  4900: 'Wallet Disconnected',
  4901: 'Chain Disconnected',
  [-32700]: 'Parse Error',
  [-32600]: 'Invalid Request',
  [-32601]: 'Method Not Found',
  [-32602]: 'Invalid Parameters',
  [-32000]: 'Invalid Input',
  [-32001]: 'Resource Not Found',
  [-32002]: 'Request Already Pending',
  [-32003]: 'Transaction Rejected',
  [-32004]: 'Method Not Supported',
  [-32005]: 'Request Limit Exceeded',
}

const ETHERS_STRING_CODES: Record<string, string> = {
  ACTION_REJECTED: 'User Rejected Transaction',
  INSUFFICIENT_FUNDS: 'Insufficient Funds',
  UNPREDICTABLE_GAS_LIMIT: 'Unable to Estimate Gas',
  NETWORK_ERROR: 'Network Error',
  SERVER_ERROR: 'Server Error',
  TIMEOUT: 'Request Timed Out',
  CALL_EXCEPTION: 'Contract Call Failed',
  TRANSACTION_REPLACED: 'Transaction Replaced',
  NONCE_EXPIRED: 'Nonce Already Used',
  REPLACEMENT_UNDERPRICED: 'Replacement Transaction Underpriced',
}

export const getMetaMaskErrorMessage = (e: unknown): string => {
  const code = (e as any)?.code
  if (typeof code === 'number' && code in METAMASK_NUMERIC_CODES) {
    return METAMASK_NUMERIC_CODES[code]
  }
  if (typeof code === 'string' && code in ETHERS_STRING_CODES) {
    return ETHERS_STRING_CODES[code]
  }
  return ''
}

// Classic ETR title-escrow / token-registry methods
const trustvcFunctions: Record<string, (...args: any[]) => any> = {
  transferHolder,
  transferBeneficiary,
  transferOwners,
  rejectTransferHolder,
  rejectTransferBeneficiary,
  rejectTransferOwners,
  nominate,
  returnToIssuer,
  rejectReturned,
  acceptReturned,
}

// BoE obligation-registry / obligation-escrow methods (same UI method names)
const obligationFunctions: Record<string, (...args: any[]) => any> = {
  transferHolder: transferHolderObligationRegistry,
  transferBeneficiary: transferBeneficiaryObligationRegistry,
  transferOwners: transferOwnersObligationRegistry,
  rejectTransferHolder: rejectTransferHolderObligationRegistry,
  rejectTransferBeneficiary: rejectTransferBeneficiaryObligationRegistry,
  rejectTransferOwners: rejectTransferOwnersObligationRegistry,
  nominate: nominateObligationRegistry,
  returnToIssuer: returnToIssuerObligationRegistry,
  rejectReturned: rejectReturnedObligationRegistry,
  acceptReturned: acceptReturnedObligationRegistry,
  accept: acceptObligationRegistry,
  reject: rejectObligationRegistry,
  discharge: dischargeObligationRegistry,
}

/** Map classic { tokenRegistryAddress, titleEscrowAddress, tokenId } → obligation options. */
const toObligationContractOptions = (opts: any) => {
  if (!opts) return opts
  if (opts.obligationRegistryAddress || opts.obligationEscrowAddress) {
    return opts
  }
  return {
    obligationRegistryAddress: opts.tokenRegistryAddress,
    obligationEscrowAddress: opts.titleEscrowAddress,
    tokenId: opts.tokenId,
  }
}
export type ContractFunctionState =
  | 'UNINITIALIZED'
  | 'INITIALIZED'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'ERROR'
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T
// Todo
// Deploy
// Deploy & Initialize

// interface useContractFunctionHookReturn<T extends Contract, S extends keyof T> {
//   state: ContractFunctionState;
//   receipt?: ContractReceipt;
//   transaction?: ContractTransaction;
//   error?: Error;
//   value:
// }

export function useContractFunctionHook<
  T extends BaseContract | TitleEscrow | TradeTrustToken,
  S extends keyof T,
  R = void,
>(
  contract?: T,
  method?: S,
  contractOptions?: any,
  providerOrSigner?: any
): {
  call: TypedContractMethod<
    any[],
    ReturnType<T[S] extends (...args: any[]) => any ? T[S] : never>,
    'nonpayable'
  >
  send: TypedContractMethod<any[], [R], 'nonpayable'>
  reset: () => void
  state: ContractFunctionState
  receipt?: ContractReceipt
  transaction?: ContractTransaction
  errorMessage?: string
  value?: UnwrapPromise<
    ReturnType<T[S] extends (...args: any[]) => any ? T[S] : never>
  >
  events?: ContractReceipt['events']
  transactionHash?: string
} {
  const [state, setState] = useState<ContractFunctionState>('UNINITIALIZED')
  const [receipt, setReceipt] = useState<ContractReceipt>()
  const [transaction, setTransaction] = useState<ContractTransaction>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [value, setValue] =
    useState<
      UnwrapPromise<
        ReturnType<T[S] extends (...args: any[]) => any ? T[S] : never>
      >
    >()

  // Reset state is added to allow the same hook to be used for multiple transactions although
  // it is highly unrecommended.
  const resetState = (): void => {
    setState('UNINITIALIZED')
    setReceipt(undefined)
    setTransaction(undefined)
    setErrorMessage(undefined)
    setValue(undefined)
  }

  const { keyId, isObligation } = useDocumentContext()
  const sendFn = (async (params: any) => {
    if (!contract || !method) {
      setState('ERROR')
      setErrorMessage('Contract or method is not specified')
      return
    }
    resetState()

    try {
      const methodName = method as string
      const methodMap = isObligation ? obligationFunctions : trustvcFunctions
      const trustvcContractMethod = methodMap[methodName]

      if (!trustvcContractMethod) {
        throw new Error(
          `Unsupported method '${methodName}' for ${
            isObligation ? 'obligation' : 'title escrow'
          } trustvcFunctions mapping`
        )
      }

      const options = { id: keyId ?? '' }
      const resolvedOptions = isObligation
        ? toObligationContractOptions(contractOptions)
        : contractOptions
      const deferredTx = trustvcContractMethod(
        resolvedOptions,
        providerOrSigner,
        params,
        options
      )

      setState('INITIALIZED')
      const _transaction: ContractTransaction = await deferredTx
      setState('PENDING_CONFIRMATION')
      setTransaction(_transaction)
      const _receipt = await _transaction.wait()
      setState('CONFIRMED')
      setReceipt(_receipt)
    } catch (e) {
      setErrorMessage(getMetaMaskErrorMessage(e))
      setState('ERROR')
    }
  }) as TypedContractMethod<
    any[],
    ReturnType<T[S] extends (...args: any[]) => any ? T[S] : never>,
    'nonpayable'
  >

  const callFn = (async (...params: any[]) => {
    if (!contract || !method) {
      setState('ERROR')
      return
    }
    resetState()

    // @ts-ignore: check for v4 contracts support
    const contractMethod =
      contract?.functions?.[method as string] ?? contract[method]
    if (!contractMethod) return
    const deferredTx = contractMethod(...params)
    setState('INITIALIZED')
    try {
      const response = await deferredTx
      setState('CONFIRMED')
      setValue(response)
    } catch (e) {
      setErrorMessage(getMetaMaskErrorMessage(e))
      setState('ERROR')
    }
  }) as TypedContractMethod<
    any[],
    ReturnType<T[S] extends (...args: any[]) => any ? T[S] : never>,
    'nonpayable'
  >

  const transactionHash = transaction?.hash
  const events = receipt?.events

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const send = useCallback(sendFn, [
    contract,
    method,
    keyId,
    isObligation,
    contractOptions,
    providerOrSigner,
  ])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const call = useCallback(callFn, [contract, method])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reset = useCallback(resetState, [contract, method])

  return {
    state,
    call,
    events,
    send,
    receipt,
    transaction,
    transactionHash,
    errorMessage,
    value,
    reset,
  }
}
