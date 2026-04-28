/* eslint-disable react-refresh/only-export-components */
// Types are now defined inline in the interface
import React, {
  createContext,
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  ContractFunctionState,
  useContractFunctionHook,
} from '../../../../hooks/useContractFunctionHook'
import { useProviderContext } from '../providerContext'
import { useTokenRegistryContract } from '../../../../hooks/useTokenRegistryContract'
import { useTitleEscrowContract } from '../../../../hooks/useTitleEscrowContract'
import { BurnAddress, ChainInfo } from '../../../../utils/chain-info'
import { useTokenRegistryVersion } from '../../../../hooks/useTokenRegistryVersion'
import { providers } from 'ethers'
import { CHAIN_ID } from '@trustvc/trustvc'
import { getRpcUrl } from '../../../../utils/helper'
import { getChainInfo } from '../../../../utils/chain-utils'

interface ITokenInformationContext {
  tokenRegistryAddress?: string
  tokenId?: string
  titleEscrowAddress?: string
  beneficiary?: string
  holder?: string
  prevBeneficiary?: string
  prevHolder?: string
  remark?: string
  documentOwner?: string
  approvedBeneficiary?: string
  changeHolder: (...args: any[]) => Promise<any>
  changeHolderState: ContractFunctionState
  returnToIssuer: (...args: any[]) => Promise<any>
  returnToIssuerState: ContractFunctionState
  endorseBeneficiary: (...args: any[]) => Promise<any>
  endorseBeneficiaryState: ContractFunctionState
  nominate: (...args: any[]) => Promise<any>
  nominateState: ContractFunctionState
  transferOwners: (...args: any[]) => Promise<any>
  transferOwnerHoldersState: ContractFunctionState
  rejectTransferOwner: (...args: any[]) => Promise<any>
  rejectTransferOwnerState: ContractFunctionState
  rejectTransferHolder: (...args: any[]) => Promise<any>
  rejectTransferHolderState: ContractFunctionState
  rejectTransferOwnerHolder: (...args: any[]) => Promise<any>
  rejectTransferOwnerHolderError?: Error
  rejectTransferOwnerHolderErrorMessage?: string
  rejectTransferOwnerHolderState: ContractFunctionState
  initialize: (
    tokenRegistryAddress: string,
    tokenId: string,
    chainId?: string
  ) => void
  isReturnedToIssuer: boolean
  isTokenBurnt: boolean
  isTitleEscrow?: boolean
  resetStates: () => void
  destroyToken: (...args: any[]) => Promise<any>
  destroyTokenState: ContractFunctionState
  restoreToken: (...args: any[]) => Promise<any>
  restoreTokenState: ContractFunctionState
  resetProviders: () => void
  errorMessage?: string
}

const contractFunctionStub: any = () => {
  return undefined as any
}

export const TokenInformationContext = createContext<ITokenInformationContext>({
  initialize: () => {},
  changeHolder: contractFunctionStub,
  changeHolderState: 'UNINITIALIZED',
  returnToIssuer: contractFunctionStub,
  returnToIssuerState: 'UNINITIALIZED',
  endorseBeneficiary: contractFunctionStub,
  endorseBeneficiaryState: 'UNINITIALIZED',
  isReturnedToIssuer: false,
  isTokenBurnt: false,
  documentOwner: '',
  nominate: contractFunctionStub,
  nominateState: 'UNINITIALIZED',
  transferOwners: contractFunctionStub,
  transferOwnerHoldersState: 'UNINITIALIZED',
  rejectTransferOwner: contractFunctionStub,
  rejectTransferOwnerState: 'UNINITIALIZED',
  rejectTransferOwnerHolderError: undefined,
  rejectTransferHolder: contractFunctionStub,
  rejectTransferHolderState: 'UNINITIALIZED',
  rejectTransferOwnerHolder: contractFunctionStub,
  rejectTransferOwnerHolderState: 'UNINITIALIZED',
  resetStates: () => {},
  destroyToken: contractFunctionStub,
  destroyTokenState: 'UNINITIALIZED',
  restoreToken: contractFunctionStub,
  restoreTokenState: 'UNINITIALIZED',
  resetProviders: () => {},
})

interface TokenInformationContextProviderProps {
  children: React.ReactNode
}

export const TokenInformationContextProvider: FunctionComponent<
  TokenInformationContextProviderProps
> = ({ children }) => {
  const [tokenId, setTokenId] = useState<string>()
  const [tokenRegistryAddress, setTokenRegistryAddress] = useState<string>()
  const [documentChainId, setDocumentChainId] = useState<string>()
  const { providerOrSigner } = useProviderContext()

  // Create a dedicated v5 provider for the document's chain
  const [documentProvider, setDocumentProvider] = useState<providers.Provider>()
  useEffect(() => {
    if (!documentChainId) {
      setDocumentProvider(undefined)
      return
    }
    const chainNum = Number(documentChainId)
    const rpcUrl =
      getRpcUrl(documentChainId) ??
      (ChainInfo as Record<number, { rpcUrl?: string }>)[chainNum]?.rpcUrl
    if (rpcUrl) {
      let chainName = `chain-${documentChainId}`
      try {
        chainName =
          getChainInfo(chainNum as unknown as CHAIN_ID)?.name ?? chainName
      } catch {
        /* ignore */
      }
      setDocumentProvider(
        new providers.StaticJsonRpcProvider(rpcUrl, {
          chainId: Number(documentChainId),
          name: chainName,
        })
      )
    } else {
      // Clear provider when chain has no RPC URL to prevent using stale provider from previous chain
      setDocumentProvider(undefined)
    }
  }, [documentChainId])

  const readProvider = documentProvider ?? providerOrSigner

  const { tokenRegistry } = useTokenRegistryContract(
    tokenRegistryAddress,
    readProvider
  )
  const { titleEscrow, titleEscrowAddress, updateTitleEscrow, documentOwner } =
    useTitleEscrowContract(readProvider, tokenRegistry, tokenId)
  const isReturnedToIssuer =
    documentOwner?.toLowerCase() === tokenRegistryAddress?.toLowerCase()
  const isTokenBurnt =
    documentOwner?.toLowerCase() === BurnAddress?.toLowerCase() // check if the token belongs to burn address.
  const isTitleEscrow = !!useTokenRegistryVersion() || undefined

  // First check whether Contract is TitleEscrow
  // Contract Read Functions
  const { call: getHolder, value: holder } = useContractFunctionHook(
    titleEscrow,
    'holder'
  )
  const { call: getBeneficiary, value: beneficiary } = useContractFunctionHook(
    titleEscrow,
    'beneficiary'
  )
  const { call: getApprovedBeneficiary, value: approvedBeneficiary } =
    useContractFunctionHook(titleEscrow, 'nominee')
  const { call: getPrevBeneficiary, value: prevBeneficiary } =
    useContractFunctionHook(titleEscrow, 'prevBeneficiary')
  const { call: getPrevHolder, value: prevHolder } = useContractFunctionHook(
    titleEscrow,
    'prevHolder'
  )
  const { call: getRemark, value: remark } = useContractFunctionHook(
    titleEscrow,
    'remark'
  )

  const {
    send: changeHolder,
    state: changeHolderState,
    reset: resetChangeHolder,
    errorMessage: changeHolderErrorMessage,
  } = useContractFunctionHook(
    titleEscrow,
    'transferHolder',
    { titleEscrowAddress, tokenRegistryAddress, tokenId },
    providerOrSigner // move to hook itself
  )

  const {
    send: destroyToken,
    state: destroyTokenState,
    reset: resetDestroyingTokenState,
    errorMessage: destroyTokenErrorMessage,
  } = useContractFunctionHook(
    tokenRegistry,
    'acceptReturned',
    { titleEscrowAddress, tokenRegistryAddress, tokenId },
    providerOrSigner
  )

  const {
    send: endorseBeneficiary,
    state: endorseBeneficiaryState,
    reset: resetEndorseBeneficiary,
    errorMessage: endorseBeneficiaryErrorMessage,
  } = useContractFunctionHook(
    titleEscrow,
    'transferBeneficiary',
    { titleEscrowAddress, tokenRegistryAddress, tokenId },
    providerOrSigner
  )

  const {
    send: nominate,
    state: nominateState,
    reset: resetNominate,
    errorMessage: nominateErrorMessage,
  } = useContractFunctionHook(
    titleEscrow,
    'nominate',
    { titleEscrowAddress, tokenRegistryAddress, tokenId },
    providerOrSigner
  )

  const {
    send: rejectTransferHolder,
    state: rejectTransferHolderState,
    reset: resetRejectTransferHolder,
    errorMessage: rejectTransferHolderErrorMessage,
  } = useContractFunctionHook(
    titleEscrow,
    'rejectTransferHolder',
    { titleEscrowAddress, tokenRegistryAddress, tokenId },
    providerOrSigner
  )

  const {
    send: rejectTransferOwner,
    state: rejectTransferOwnerState,
    reset: resetRejectTransferOwner,
    errorMessage: rejectTransferOwnerErrorMessage,
  } = useContractFunctionHook(
    titleEscrow,
    'rejectTransferBeneficiary',
    { titleEscrowAddress, tokenRegistryAddress, tokenId },
    providerOrSigner
  )

  const {
    send: rejectTransferOwnerHolder,
    state: rejectTransferOwnerHolderState,
    reset: resetRejectTransferOwnerHolder,
    errorMessage: rejectTransferOwnerHolderErrorMessage,
  } = useContractFunctionHook(
    titleEscrow,
    'rejectTransferOwners',
    { titleEscrowAddress, tokenRegistryAddress, tokenId },
    providerOrSigner
  )

  const {
    send: restoreToken, // restoreToken function does not return any value
    state: restoreTokenState,
    reset: resetRestoreTokenState,
    errorMessage: restoreTokenErrorMessage,
  } = useContractFunctionHook(
    tokenRegistry,
    'rejectReturned',
    { titleEscrowAddress, tokenRegistryAddress, tokenId },
    providerOrSigner
  )

  const {
    send: returnToIssuer,
    state: returnToIssuerState,
    reset: resetReturnToIssuer,
    errorMessage: returnToIssuerErrorMessage,
  } = useContractFunctionHook(
    titleEscrow,
    'returnToIssuer',
    { titleEscrowAddress, tokenRegistryAddress, tokenId },
    providerOrSigner
  )

  const {
    send: transferOwners,
    state: transferOwnerHoldersState,
    reset: resetTransferOwners,
    errorMessage: transferOwnersErrorMessage,
  } = useContractFunctionHook(
    titleEscrow,
    'transferOwners',
    { titleEscrowAddress, tokenRegistryAddress, tokenId },
    providerOrSigner
  )

  const resetProviders = useCallback(() => {
    resetChangeHolder()
    resetDestroyingTokenState()
    resetEndorseBeneficiary()
    resetNominate()
    resetRejectTransferHolder()
    resetRejectTransferOwner()
    resetRejectTransferOwnerHolder()
    resetRestoreTokenState()
    resetReturnToIssuer()
    resetTransferOwners()
  }, [
    resetChangeHolder,
    resetDestroyingTokenState,
    resetEndorseBeneficiary,
    resetNominate,
    resetRejectTransferHolder,
    resetRejectTransferOwner,
    resetRejectTransferOwnerHolder,
    resetRestoreTokenState,
    resetReturnToIssuer,
    resetTransferOwners,
  ])

  const resetStates = useCallback(() => {
    setTokenId(undefined)
    setTokenRegistryAddress(undefined)
  }, [])

  const initialize = useCallback(
    (address: string, id: string, chainId?: string) => {
      setTokenId(id)
      setTokenRegistryAddress(address)
      setDocumentChainId(chainId)
    },
    []
  )

  // Fetch all new information when title escrow is initialized or updated (due to actions)
  useEffect(() => {
    if (isTitleEscrow) {
      // only fetch TitleEscrow info after we determine owner is a Title Escrow contract
      getHolder()
      getBeneficiary()
      getApprovedBeneficiary()
      getPrevBeneficiary()
      getPrevHolder()
      getRemark()
    }
  }, [
    getApprovedBeneficiary,
    getBeneficiary,
    getHolder,
    getPrevBeneficiary,
    getPrevHolder,
    getRemark,
    isTitleEscrow,
  ])

  // Update holder whenever holder transfer is successful
  useEffect(() => {
    if (changeHolderState === 'CONFIRMED') getHolder()
  }, [changeHolderState, getHolder])

  useEffect(() => {
    if (nominateState === 'CONFIRMED') getApprovedBeneficiary()
  }, [nominateState, getApprovedBeneficiary])

  // Update entire title escrow whenever endorse is successful
  useEffect(() => {
    if (endorseBeneficiaryState === 'CONFIRMED') updateTitleEscrow()
  }, [endorseBeneficiaryState, updateTitleEscrow])

  // Update entire title escrow whenever transferTo is successful
  useEffect(() => {
    if (returnToIssuerState === 'CONFIRMED') updateTitleEscrow()
  }, [returnToIssuerState, updateTitleEscrow])

  // Update entire title escrow whenever token is burnt
  useEffect(() => {
    if (destroyTokenState === 'CONFIRMED') updateTitleEscrow()
  }, [destroyTokenState, updateTitleEscrow])

  useEffect(() => {
    if (restoreTokenState === 'CONFIRMED') updateTitleEscrow()
  }, [restoreTokenState, updateTitleEscrow])

  // Update entire title escrow whenever endorse transfer to beneficiary and holder is successful
  useEffect(() => {
    if (transferOwnerHoldersState === 'CONFIRMED') updateTitleEscrow()
  }, [transferOwnerHoldersState, updateTitleEscrow])

  // Update entire title escrow whenever reject transfer to holder is successful
  useEffect(() => {
    if (rejectTransferOwnerState === 'CONFIRMED') updateTitleEscrow()
  }, [rejectTransferOwnerState, updateTitleEscrow])

  // Update entire title escrow whenever reject transfer holder is successful
  useEffect(() => {
    if (rejectTransferHolderState === 'CONFIRMED') updateTitleEscrow()
  }, [rejectTransferHolderState, updateTitleEscrow])

  // Update entire title escrow whenever reject transfer owners is successful
  useEffect(() => {
    if (rejectTransferOwnerHolderState === 'CONFIRMED') updateTitleEscrow()
  }, [rejectTransferOwnerHolderState, updateTitleEscrow])

  // Reset states for all write functions when provider changes to allow methods to be called again without refreshing
  useEffect(resetProviders, [resetProviders, providerOrSigner])

  const errorMessage =
    changeHolderErrorMessage ||
    destroyTokenErrorMessage ||
    endorseBeneficiaryErrorMessage ||
    transferOwnersErrorMessage ||
    nominateErrorMessage ||
    rejectTransferOwnerErrorMessage ||
    rejectTransferHolderErrorMessage ||
    rejectTransferOwnerHolderErrorMessage ||
    restoreTokenErrorMessage ||
    returnToIssuerErrorMessage

  return (
    <TokenInformationContext.Provider
      value={{
        tokenId,
        tokenRegistryAddress,
        titleEscrowAddress,
        initialize,
        holder: holder,
        beneficiary: beneficiary,
        approvedBeneficiary: approvedBeneficiary,
        prevBeneficiary: prevBeneficiary,
        prevHolder: prevHolder,
        remark: remark,
        changeHolder,
        endorseBeneficiary,
        returnToIssuer,
        changeHolderState,
        endorseBeneficiaryState,
        returnToIssuerState,
        destroyTokenState,
        destroyToken,
        isReturnedToIssuer,
        isTokenBurnt,
        isTitleEscrow,
        documentOwner,
        nominate,
        nominateState,
        transferOwners,
        transferOwnerHoldersState,
        rejectTransferOwner,
        rejectTransferOwnerState,
        rejectTransferHolder,
        rejectTransferHolderState,
        rejectTransferOwnerHolder,
        rejectTransferOwnerHolderState,
        resetStates,
        restoreToken,
        restoreTokenState,
        resetProviders,
        errorMessage,
      }}
    >
      {children}
    </TokenInformationContext.Provider>
  )
}

export const useTokenInformationContext = (): ITokenInformationContext =>
  useContext<ITokenInformationContext>(TokenInformationContext)
