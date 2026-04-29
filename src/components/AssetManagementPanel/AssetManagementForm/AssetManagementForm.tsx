import React, { FunctionComponent, useCallback } from 'react'
import { AssetManagementActions } from '../AssetManagementActions'
import { ActionForm } from './FormVariants/ActionForm'
import { ActionSelectionForm } from './FormVariants/ActionSelectionForm'
import { FormState } from '../../../utils/common/FormState'
import { InitialAddress } from '../../../utils/chain-info'
import { useTokenRegistryVersion } from '../../../hooks/useTokenRegistryVersion'
import { TokenRegistryVersions } from '../../../constants'

interface RejectTransferActions {
  rejectTransferOwnerHolder: ({ remarks }: { remarks: string }) => void
  rejectTransferOwnerHolderState: string
  rejectTransferOwner: ({ remarks }: { remarks: string }) => void
  rejectTransferOwnerState: string
  rejectTransferHolder: ({ remarks }: { remarks: string }) => void
  rejectTransferHolderState: string
}

interface TransferActions {
  onTransferHolder: ({
    holderAddress,
    remarks,
  }: {
    holderAddress: string
    remarks: string
  }) => void
  holderTransferringState: string
  onEndorseBeneficiary: ({
    newBeneficiaryAddress,
    remarks,
  }: {
    newBeneficiaryAddress: string
    remarks: string
  }) => void
  endorseBeneficiaryState: string
  nominateBeneficiary: ({
    newBeneficiaryAddress,
    remarks,
  }: {
    newBeneficiaryAddress: string
    remarks: string
  }) => void
  nominateBeneficiaryState: string
  transferOwners: ({
    newBeneficiaryAddress,
    newHolderAddress,
    remarks,
  }: {
    newBeneficiaryAddress: string
    newHolderAddress: string
    remarks: string
  }) => void
  transferOwnerHoldersState: string
}

interface ReturnToIssuerActions {
  onReturnToIssuer: ({ remarks }: { remarks: string }) => void
  returnToIssuerState: string
  onDestroyToken: ({ remarks }: { remarks: string }) => void
  destroyTokenState: string
  onRestoreToken: ({ remarks }: { remarks: string }) => void
  restoreTokenState: string
}

interface ContractState {
  beneficiary?: string
  holder?: string
  nominee?: string
  prevBeneficiary?: string
  prevHolder?: string
}

interface AssetManagementFormProps
  extends
    ContractState,
    RejectTransferActions,
    TransferActions,
    ReturnToIssuerActions {
  isRestorer?: boolean
  isAcceptor?: boolean
  isTitleEscrow: boolean
  isReturnedToIssuer: boolean
  isTokenBurnt: boolean
  isExpired?: boolean
  documentOwner?: string
  tokenRegistryAddress: string
  account?: string
  formAction: AssetManagementActions
  onSetFormAction: (nextFormAction: AssetManagementActions) => void
  setShowEndorsementChain: (payload: boolean) => void
  refreshEndorsementChain?: () => void
  errorMessage?: string
}

export const AssetManagementForm: FunctionComponent<
  AssetManagementFormProps
> = ({
  beneficiary,
  holder,
  nominee,
  prevBeneficiary,
  prevHolder,

  account,
  formAction,
  tokenRegistryAddress,
  onSetFormAction,
  isRestorer,
  isAcceptor,
  isReturnedToIssuer,
  isTokenBurnt,
  setShowEndorsementChain,
  refreshEndorsementChain,
  isTitleEscrow,
  isExpired,

  onTransferHolder,
  holderTransferringState,
  onEndorseBeneficiary,
  endorseBeneficiaryState,
  nominateBeneficiary,
  nominateBeneficiaryState,
  transferOwners,
  transferOwnerHoldersState,
  rejectTransferOwnerHolder,
  rejectTransferOwnerHolderState,
  rejectTransferOwner,
  rejectTransferHolder,
  rejectTransferOwnerState,
  rejectTransferHolderState,
  onReturnToIssuer,
  returnToIssuerState,
  onDestroyToken,
  destroyTokenState,
  onRestoreToken,
  restoreTokenState,
  errorMessage,
}) => {
  const tokenRegistryVersion = useTokenRegistryVersion()
  const isTokenRegistryV5 = tokenRegistryVersion === TokenRegistryVersions.V5
  const isActiveTitleEscrow = isTitleEscrow && !isReturnedToIssuer
  const isHolder = isTitleEscrow && account === holder
  const isBeneficiary = isTitleEscrow && account === beneficiary
  const isHolderAndBeneficiary = isHolder && isBeneficiary
  const hasNominee = !!nominee && nominee !== InitialAddress
  const hasPreviousBeneficiary =
    !!prevBeneficiary && prevBeneficiary !== InitialAddress
  const hasPreviousHolder = !!prevHolder && prevHolder !== InitialAddress
  const canRejectAfterTransferOwners =
    hasPreviousHolder && hasPreviousBeneficiary

  const canReturnToIssuer = isBeneficiary && isHolder && !isReturnedToIssuer
  /*
    In order to shred we need to check 3 conditions
    - document is surrendered
    - documentOwner is the tokenRegistry
    - currentUser === tokenRegistryMinter
  */
  const canHandleRestore = isTitleEscrow && isRestorer && isReturnedToIssuer
  const canHandleShred = isTitleEscrow && isAcceptor && isReturnedToIssuer
  const canTransferHolder = isActiveTitleEscrow && isHolder
  const canTransferBeneficiary = isActiveTitleEscrow && isHolderAndBeneficiary
  const canTransferOwners = isActiveTitleEscrow && isHolder && isBeneficiary
  const canNominateBeneficiary =
    isActiveTitleEscrow && isBeneficiary && !isHolder
  const canEndorseBeneficiary = isActiveTitleEscrow && isHolder && hasNominee
  const canRejectOwnerHolderTransfer =
    isTokenRegistryV5 &&
    isActiveTitleEscrow &&
    isHolder &&
    isBeneficiary &&
    hasPreviousHolder &&
    hasPreviousBeneficiary &&
    canRejectAfterTransferOwners
  const canRejectHolderTransfer =
    !isHolderAndBeneficiary &&
    isTokenRegistryV5 &&
    isActiveTitleEscrow &&
    isHolder &&
    hasPreviousHolder &&
    !(isBeneficiary && hasPreviousBeneficiary)
  const canRejectOwnerTransfer =
    !isHolderAndBeneficiary &&
    isTokenRegistryV5 &&
    isActiveTitleEscrow &&
    isBeneficiary &&
    hasPreviousBeneficiary &&
    !(isHolder && hasPreviousHolder)

  const setFormActionNone = useCallback(() => {
    if (
      holderTransferringState === FormState.PENDING_CONFIRMATION ||
      endorseBeneficiaryState === FormState.PENDING_CONFIRMATION ||
      nominateBeneficiaryState === FormState.PENDING_CONFIRMATION ||
      rejectTransferOwnerHolderState === FormState.PENDING_CONFIRMATION ||
      rejectTransferOwnerState === FormState.PENDING_CONFIRMATION ||
      rejectTransferHolderState === FormState.PENDING_CONFIRMATION ||
      transferOwnerHoldersState === FormState.PENDING_CONFIRMATION ||
      destroyTokenState === FormState.PENDING_CONFIRMATION ||
      restoreTokenState === FormState.PENDING_CONFIRMATION ||
      returnToIssuerState === FormState.PENDING_CONFIRMATION
    )
      return
    onSetFormAction(AssetManagementActions.None)
  }, [
    holderTransferringState,
    endorseBeneficiaryState,
    nominateBeneficiaryState,
    transferOwnerHoldersState,
    rejectTransferOwnerHolderState,
    rejectTransferOwnerState,
    rejectTransferHolderState,
    destroyTokenState,
    restoreTokenState,
    returnToIssuerState,
    onSetFormAction,
  ])

  return (
    <>
      {formAction === AssetManagementActions.None && (
        <ActionSelectionForm
          onSetFormAction={onSetFormAction}
          tokenRegistryAddress={tokenRegistryAddress}
          beneficiary={beneficiary}
          holder={holder}
          nominee={nominee}
          account={account}
          canReturnToIssuer={canReturnToIssuer}
          canHandleRestore={canHandleRestore}
          canHandleShred={canHandleShred}
          canRejectOwnerHolderTransfer={canRejectOwnerHolderTransfer}
          canRejectHolderTransfer={canRejectHolderTransfer}
          canRejectOwnerTransfer={canRejectOwnerTransfer}
          canTransferHolder={canTransferHolder}
          canTransferBeneficiary={canTransferBeneficiary}
          canNominateBeneficiary={canNominateBeneficiary}
          canEndorseBeneficiary={canEndorseBeneficiary}
          canTransferOwners={canTransferOwners}
          isReturnedToIssuer={isReturnedToIssuer}
          isTokenBurnt={isTokenBurnt}
          setShowEndorsementChain={setShowEndorsementChain}
          isTitleEscrow={isTitleEscrow}
          isExpired={isExpired}
        />
      )}
      {(formAction === AssetManagementActions.TransferHolder ||
        formAction === AssetManagementActions.TransferOwner ||
        formAction === AssetManagementActions.TransferOwnerHolder ||
        formAction === AssetManagementActions.EndorseBeneficiary ||
        formAction === AssetManagementActions.NominateBeneficiary ||
        formAction === AssetManagementActions.ReturnToIssuer ||
        formAction === AssetManagementActions.AcceptReturnToIssuer ||
        formAction === AssetManagementActions.RejectReturnToIssuer ||
        formAction === AssetManagementActions.RejectTransferOwnerHolder ||
        formAction === AssetManagementActions.RejectTransferOwner ||
        formAction === AssetManagementActions.RejectTransferHolder) && (
        <ActionForm
          type={formAction}
          beneficiary={beneficiary!}
          holder={holder!}
          nominee={nominee}
          prevBeneficiary={prevBeneficiary}
          prevHolder={prevHolder}
          isExpired={isExpired}
          setFormActionNone={setFormActionNone}
          setShowEndorsementChain={setShowEndorsementChain}
          refreshEndorsementChain={refreshEndorsementChain}
          // nominate
          handleNomination={nominateBeneficiary}
          nominationState={nominateBeneficiaryState}
          // transfer beneficiary / endorse beneficiary
          handleBeneficiaryTransfer={onEndorseBeneficiary}
          endorseBeneficiaryState={endorseBeneficiaryState}
          // transfer owner
          //the transfer owner state is same as endorse beneficiary state as the function onEndorseBeneficiary is used for both
          transferOwnersState={endorseBeneficiaryState}
          // transfer holder
          handleTransfer={onTransferHolder}
          holderTransferringState={holderTransferringState}
          // reject transfer ownership and holdership
          handleRejectTransferOwnerHolder={rejectTransferOwnerHolder}
          rejectTransferOwnerHolderState={rejectTransferOwnerHolderState}
          // reject transfer ownership
          handleRejectTransferOwner={rejectTransferOwner}
          rejectTransferOwnerState={rejectTransferOwnerState}
          // reject transfer holdership
          handleRejectTransferHolder={rejectTransferHolder}
          rejectTransferHolderState={rejectTransferHolderState}
          // transfer owners
          handleTransferOwnerHolder={transferOwners}
          transferOwnerHoldersState={transferOwnerHoldersState}
          // return to issuer
          handleReturnToIssuer={onReturnToIssuer}
          returnToIssuerState={returnToIssuerState}
          // accept return to issuer
          handleDestroyToken={onDestroyToken}
          destroyTokenState={destroyTokenState}
          // reject return to issuer
          handleRestoreToken={onRestoreToken}
          restoreTokenState={restoreTokenState}
          //error message
          errorMessage={errorMessage}
        />
      )}
    </>
  )
}
