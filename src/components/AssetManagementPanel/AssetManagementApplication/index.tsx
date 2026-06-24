import { v5RoleHash, v4RoleHash } from '@trustvc/trustvc'
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useProviderContext } from '../../common/contexts/providerContext'
import { useTokenInformationContext } from '../../common/contexts/TokenInformationContext'
import { useTokenRegistryContract } from '../../../hooks/useTokenRegistryContract'
import { useTokenRegistryRole } from '../../../hooks/useTokenRegistryRole'
import { AssetManagementActions } from '../AssetManagementActions'
import { AssetManagementForm } from '../AssetManagementForm'
import { Tag } from '../../common/Tag'
import { useTokenRegistryVersion } from '../../../hooks/useTokenRegistryVersion'
import {
  trackAssetActionInitiated,
  trackAssetActionCompleted,
  trackAssetActionFailed,
} from '../../../utils/analytics'
import { TokenRegistryVersions } from '../../../constants'

interface AssetManagementIsTransferableDocumentProps {
  isMagicDemo?: boolean
  tokenId: string
  tokenRegistryAddress: string
  chainId?: string
  setShowEndorsementChain: (payload: boolean) => void
  refreshEndorsementChain?: () => void
  isTransferableDocument: true
  isExpired?: boolean
}

interface AssetManagementIsNotTransferableDocumentProps {
  isMagicDemo?: boolean
  isTransferableDocument: false
  isExpired: boolean
}

type AssetManagementApplicationProps = (
  | AssetManagementIsNotTransferableDocumentProps
  | AssetManagementIsTransferableDocumentProps
) & {
  isSampleDocument: boolean
}

export const AssetManagementApplication: FunctionComponent<
  AssetManagementApplicationProps
> = props => {
  const {
    // isMagicDemo,
    tokenId,
    tokenRegistryAddress,
    chainId,
    setShowEndorsementChain,
    refreshEndorsementChain,
    isTransferableDocument,
    isExpired,
  } = props as AssetManagementIsTransferableDocumentProps
  // const isSampleDocument = props.isSampleDocument
  const {
    initialize,
    approvedBeneficiary: nominee,
    holder,
    beneficiary,
    prevBeneficiary,
    prevHolder,
    isReturnedToIssuer,
    isTokenBurnt,
    isTitleEscrow,
    documentOwner,
    // nominate
    nominate,
    nominateState,
    // transferHolder
    changeHolder,
    changeHolderState,
    // endorseBeneficiary / transferBeneficiary
    endorseBeneficiary,
    endorseBeneficiaryState,
    // transferOwners
    transferOwners,
    transferOwnerHoldersState,
    // returnToIssuer
    returnToIssuer,
    returnToIssuerState,
    // reject return to issuer
    restoreToken,
    restoreTokenState,
    // accept return to issuer
    destroyToken,
    destroyTokenState,
    // reject transfer owner
    rejectTransferOwner,
    rejectTransferOwnerState,
    // reject transfer holder
    rejectTransferHolder,
    rejectTransferHolderState,
    // reject transfer owner holder
    rejectTransferOwnerHolder,
    rejectTransferOwnerHolderState,
    // reset providers
    resetProviders,
    //errorMessage
    errorMessage,
  } = useTokenInformationContext()
  const [assetManagementAction, setAssetManagementAction] =
    useState<AssetManagementActions>(AssetManagementActions.None)
  const tokenRegistryVersion = useTokenRegistryVersion()
  const { provider, account } = useProviderContext()
  const { tokenRegistry } = useTokenRegistryContract(
    tokenRegistryAddress,
    provider
  )
  const { hasRole: hasAccepterRole } = useTokenRegistryRole({
    tokenRegistry,
    account,
    role:
      tokenRegistryVersion === TokenRegistryVersions.V4
        ? v4RoleHash.AccepterRole
        : v5RoleHash.AccepterRole,
  })
  const { hasRole: hasRestorerRole } = useTokenRegistryRole({
    tokenRegistry,
    account,
    role:
      tokenRegistryVersion === TokenRegistryVersions.V4
        ? v4RoleHash.RestorerRole
        : v5RoleHash.RestorerRole,
  })

  const onDestroyToken = (
    { remarks }: { remarks: string } = { remarks: '0x' }
  ) => {
    destroyToken({ tokenId, remarks })
  }

  const onRestoreToken = (
    { remarks }: { remarks: string } = { remarks: '0x' }
  ) => {
    restoreToken({ tokenId, remarks })
  }

  const onSetFormAction = useCallback(
    (assetManagementActions: AssetManagementActions) => {
      resetProviders()
      setAssetManagementAction(assetManagementActions)
      if (assetManagementActions !== AssetManagementActions.None) {
        trackAssetActionInitiated(
          assetManagementActions,
          chainId,
          tokenRegistryVersion ?? undefined
        )
      }
    },
    [setAssetManagementAction, resetProviders, chainId, tokenRegistryVersion]
  )

  // Track on-chain outcome for the active asset action.
  // outcomeRef prevents double-firing; resets to null when the state cycles back
  // through UNINITIALIZED (which resetProviders() triggers on each new attempt).
  const outcomeRef = useRef<string | null>(null)
  useEffect(() => {
    if (assetManagementAction === AssetManagementActions.None) return
    const txState = (() => {
      switch (assetManagementAction) {
        case AssetManagementActions.NominateBeneficiary:
          return nominateState
        case AssetManagementActions.TransferHolder:
          return changeHolderState
        case AssetManagementActions.EndorseBeneficiary:
        case AssetManagementActions.TransferOwner:
          return endorseBeneficiaryState
        case AssetManagementActions.TransferOwnerHolder:
          return transferOwnerHoldersState
        case AssetManagementActions.ReturnToIssuer:
          return returnToIssuerState
        case AssetManagementActions.AcceptReturnToIssuer:
          return destroyTokenState
        case AssetManagementActions.RejectReturnToIssuer:
          return restoreTokenState
        case AssetManagementActions.RejectTransferOwner:
          return rejectTransferOwnerState
        case AssetManagementActions.RejectTransferHolder:
          return rejectTransferHolderState
        case AssetManagementActions.RejectTransferOwnerHolder:
          return rejectTransferOwnerHolderState
        default:
          return undefined
      }
    })()
    if (!txState) return
    if (txState === 'UNINITIALIZED' || txState === 'INITIALIZED') {
      outcomeRef.current = null
      return
    }
    if (txState !== 'CONFIRMED' && txState !== 'ERROR') return
    const key = `${assetManagementAction}:${txState}`
    if (outcomeRef.current === key) return
    outcomeRef.current = key
    if (txState === 'CONFIRMED') {
      trackAssetActionCompleted(assetManagementAction, chainId)
    } else {
      trackAssetActionFailed(
        assetManagementAction,
        errorMessage ?? 'TRANSACTION_ERROR',
        chainId
      )
    }
  }, [
    assetManagementAction,
    chainId,
    errorMessage,
    nominateState,
    changeHolderState,
    endorseBeneficiaryState,
    transferOwnerHoldersState,
    returnToIssuerState,
    destroyTokenState,
    restoreTokenState,
    rejectTransferOwnerState,
    rejectTransferHolderState,
    rejectTransferOwnerHolderState,
  ])

  // Initialize the token information context with tokenId, tokenRegistryAddress and chainId
  useEffect(() => {
    if (tokenId && tokenRegistryAddress) {
      initialize(tokenRegistryAddress, tokenId, chainId)
    }
  }, [tokenId, tokenRegistryAddress, chainId, initialize])

  useEffect(() => {
    onSetFormAction(AssetManagementActions.None)
  }, [account, onSetFormAction]) // unset action panel to none, whenever user change metamask account
  return (
    <>
      {isTransferableDocument && isTitleEscrow != undefined ? (
        <AssetManagementForm
          beneficiary={beneficiary}
          holder={holder}
          nominee={nominee}
          prevBeneficiary={prevBeneficiary}
          prevHolder={prevHolder}
          account={account}
          formAction={assetManagementAction}
          tokenRegistryAddress={tokenRegistryAddress}
          onSetFormAction={onSetFormAction}
          documentOwner={documentOwner}
          isRestorer={hasRestorerRole}
          isAcceptor={hasAccepterRole}
          isReturnedToIssuer={isReturnedToIssuer}
          isTitleEscrow={isTitleEscrow}
          setShowEndorsementChain={setShowEndorsementChain}
          refreshEndorsementChain={refreshEndorsementChain}
          isTokenBurnt={isTokenBurnt}
          onTransferHolder={changeHolder}
          holderTransferringState={changeHolderState}
          onEndorseBeneficiary={endorseBeneficiary}
          endorseBeneficiaryState={endorseBeneficiaryState}
          nominateBeneficiary={nominate}
          nominateBeneficiaryState={nominateState}
          transferOwners={transferOwners}
          transferOwnerHoldersState={transferOwnerHoldersState}
          rejectTransferOwner={rejectTransferOwner}
          rejectTransferOwnerState={rejectTransferOwnerState}
          rejectTransferHolder={rejectTransferHolder}
          rejectTransferHolderState={rejectTransferHolderState}
          rejectTransferOwnerHolder={rejectTransferOwnerHolder}
          rejectTransferOwnerHolderState={rejectTransferOwnerHolderState}
          onReturnToIssuer={returnToIssuer}
          returnToIssuerState={returnToIssuerState}
          onDestroyToken={onDestroyToken}
          destroyTokenState={destroyTokenState}
          onRestoreToken={onRestoreToken}
          restoreTokenState={restoreTokenState}
          isExpired={isExpired}
          errorMessage={errorMessage}
        />
      ) : (
        isExpired && (
          <div className="flex-1 content-center space-y-2 md:space-x-2 md:space-y-0 border-t border-gray-200 py-2">
            <Tag
              rounded="rounded-full"
              className="bg-[#FDDAE2] !p-2 min-w-[188px] max-w-[383px] text-center w-full flex-1"
            >
              <h4 className="bg-alert-20">Expired</h4>
            </Tag>
          </div>
        )
      )}
    </>
  )
}
