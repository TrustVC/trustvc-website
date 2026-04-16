import { v5RoleHash, v4RoleHash } from '@trustvc/trustvc'
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { useProviderContext } from '../../common/contexts/providerContext'
import { useTokenInformationContext } from '../../common/contexts/TokenInformationContext'
import { useTokenRegistryContract } from '../../../hooks/useTokenRegistryContract'
import { useTokenRegistryRole } from '../../../hooks/useTokenRegistryRole'
import { AssetManagementActions } from '../AssetManagementActions'
import { AssetManagementForm } from '../AssetManagementForm'
import { TagBordered } from '../../common/Tag'
import { useTokenRegistryVersion } from '../../../hooks/useTokenRegistryVersion'
import { TokenRegistryVersions } from '../../../constants'

interface AssetManagementIsTransferableDocumentProps {
  isMagicDemo?: boolean
  tokenId: string
  tokenRegistryAddress: string
  setShowEndorsementChain: (payload: boolean) => void
  refreshEndorsementChain?: () => void
  isTransferableDocument: true
  isExpired: boolean
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
    transferOwnersState,
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

  const onDestroyToken = (remarks: string = '0x') => {
    destroyToken({ tokenId, remarks })
  }

  const onRestoreToken = (remarks: string = '0x') => {
    restoreToken({ tokenId, remarks })
  }

  const onSetFormAction = useCallback(
    (assetManagementActions: AssetManagementActions) => {
      setAssetManagementAction(assetManagementActions)
    },
    [setAssetManagementAction]
  )

  // Initialize the token information context with tokenId and tokenRegistryAddress
  useEffect(() => {
    if (tokenId && tokenRegistryAddress) {
      initialize(tokenRegistryAddress, tokenId)
    }
  }, [tokenId, tokenRegistryAddress, initialize])

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
          beneficiaryEndorseState={endorseBeneficiaryState}
          nominateBeneficiary={nominate}
          nominateBeneficiaryState={nominateState}
          transferOwners={transferOwners}
          transferOwnersState={transferOwnersState}
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
        />
      ) : (
        isExpired && (
          <div className="flex-1 content-center space-y-2 md:space-x-2 md:space-y-0">
            <TagBordered
              id="expired-sign"
              rounded="rounded-full"
              className="border-scarlet-100 bg-scarlet-100 text-scarlet-500 content-center justify-self-center w-full xs:w-auto h-10 px-4 py-2"
            >
              <h5 data-testid="expiredDoc" className="text-center break-keep">
                Expired
              </h5>
            </TagBordered>
          </div>
        )
      )}
    </>
  )
}
