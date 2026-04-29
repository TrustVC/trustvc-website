import React, { FunctionComponent, useEffect, useState } from 'react'
import {
  MessageTitle,
  showDocumentTransferMessage,
} from '../../../../common/Overlay/OverlayContent'
import { AssetManagementActions } from '../../../AssetManagementActions'
import { EditableAssetTitle } from './../EditableAssetTitle'
import { useOverlayContext } from '../../../../common/contexts/OverlayContext'
import { isEthereumAddress } from '../../../../../utils/helper'
import Spinner from '../../../../icons/Spinner'
import { FormState } from '../../../../../utils/common/FormState'
import { Button, ButtonIcon, ButtonSize } from '../../../../common/Button'
import type {
  TransferHolderFormProps,
  TransferOwnerFormProps,
  TransferOwnerHolderFormProps,
  NominateBeneficiaryFormProps,
  EndorseBeneficiaryProps,
  ReturnToIssuerFormProps,
  AcceptReturnToIssuerFormProps,
  RejectReturnToIssuerFormProps,
  RejectTransferOwnerHolderFormProps,
  RejectTransferOwnerFormProps,
  RejectTransferHolderFormProps,
} from './types'

// Union type for all possible props
type ActionFormProps =
  | TransferHolderFormProps
  | TransferOwnerFormProps
  | TransferOwnerHolderFormProps
  | NominateBeneficiaryFormProps
  | EndorseBeneficiaryProps
  | ReturnToIssuerFormProps
  | AcceptReturnToIssuerFormProps
  | RejectReturnToIssuerFormProps
  | RejectTransferOwnerHolderFormProps
  | RejectTransferOwnerFormProps
  | RejectTransferHolderFormProps

export const ActionForm: FunctionComponent<ActionFormProps> = props => {
  const {
    type,
    beneficiary,
    holder,
    prevBeneficiary,
    prevHolder,
    setFormActionNone,
    setShowEndorsementChain,
    refreshEndorsementChain,
    errorMessage,
  } = props
  const [remark, setRemark] = useState('')
  const { showOverlay } = useOverlayContext()

  // Additional state variables for different form types
  const [newHolder, setNewHolder] = useState(holder || '')
  const [newOwner, setNewOwner] = useState(beneficiary || '')
  const [newBeneficiary, setNewBeneficiary] = useState('')

  // All useEffect hooks moved outside of the switch statement
  useEffect(() => {
    // Handle TransferHolderForm confirmation/ failure
    if (type === AssetManagementActions.TransferHolder) {
      const { holderTransferringState } = props
      const isConfirmed = holderTransferringState === FormState.CONFIRMED
      const isFailed = holderTransferringState === FormState.ERROR
      const title = isConfirmed
        ? MessageTitle.TRANSFER_HOLDER_SUCCESS
        : MessageTitle.TRANSFER_HOLDER_FAILED

      if (isConfirmed || isFailed) {
        if (refreshEndorsementChain && isConfirmed) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            title,
            {
              isSuccess: isConfirmed,
              holderAddress: isConfirmed ? newHolder : holder,
            },
            setShowEndorsementChain,
            errorMessage
          )
        )
        setFormActionNone()
      }
    }
    // Handle EndorseTransferForm confirmation/ failure
    if (type === AssetManagementActions.TransferOwnerHolder) {
      const { transferOwnerHoldersState } = props
      const isConfirmed = transferOwnerHoldersState === FormState.CONFIRMED
      const isFailed = transferOwnerHoldersState === FormState.ERROR
      const title = isConfirmed
        ? MessageTitle.TRANSFER_OWNER_HOLDER_SUCCESS
        : MessageTitle.TRANSFER_OWNER_HOLDER_FAILED
      const beneficiaryAddress = isConfirmed ? newOwner : beneficiary
      const holderAddress = isConfirmed ? newHolder : holder

      if (isConfirmed || isFailed) {
        if (refreshEndorsementChain && isConfirmed) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            title,
            {
              isSuccess: isConfirmed,
              beneficiaryAddress,
              holderAddress,
            },
            setShowEndorsementChain,
            errorMessage
          )
        )
        setFormActionNone()
      }
    }
    // Handle RejectTransferOwnerHolderForm confirmation/ failure
    if (type === AssetManagementActions.RejectTransferOwnerHolder) {
      const { rejectTransferOwnerHolderState } = props
      const isConfirmed = rejectTransferOwnerHolderState === FormState.CONFIRMED
      const isFailed = rejectTransferOwnerHolderState === FormState.ERROR
      const title = isConfirmed
        ? MessageTitle.REJECT_TRANSFER_OWNER_HOLDER_SUCCESS
        : MessageTitle.REJECT_TRANSFER_OWNER_HOLDER_FAILED
      const beneficiaryAddress = isConfirmed ? prevBeneficiary : beneficiary
      const holderAddress = isConfirmed ? prevHolder : holder

      if (isConfirmed || isFailed) {
        if (refreshEndorsementChain && isConfirmed) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            title,
            {
              isSuccess: isConfirmed,
              beneficiaryAddress,
              holderAddress,
            },
            setShowEndorsementChain,
            errorMessage
          )
        )
        setFormActionNone()
      }
    }
    // Handle RejectTransferHolderForm confirmation/ failure
    if (type === AssetManagementActions.RejectTransferHolder) {
      const { rejectTransferHolderState } = props
      const isConfirmed = rejectTransferHolderState === FormState.CONFIRMED
      const isFailed = rejectTransferHolderState === FormState.ERROR
      const title = isConfirmed
        ? MessageTitle.REJECT_TRANSFER_HOLDER_SUCCESS
        : MessageTitle.REJECT_TRANSFER_HOLDER_FAILED
      const holderAddress = isConfirmed ? prevHolder : holder
      if (isConfirmed || isFailed) {
        if (refreshEndorsementChain && isConfirmed) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            title,
            {
              isSuccess: isConfirmed,
              holderAddress,
            },
            setShowEndorsementChain,
            errorMessage
          )
        )
        setFormActionNone()
      }
    }
    // Handle RejectTransferOwnerForm confirmation/ failure
    if (type === AssetManagementActions.RejectTransferOwner) {
      const { rejectTransferOwnerState } = props
      const isConfirmed = rejectTransferOwnerState === FormState.CONFIRMED
      const isFailed = rejectTransferOwnerState === FormState.ERROR
      const title = isConfirmed
        ? MessageTitle.REJECT_TRANSFER_OWNER_SUCCESS
        : MessageTitle.REJECT_TRANSFER_OWNER_FAILED
      const beneficiaryAddress = isConfirmed ? prevBeneficiary : beneficiary

      if (isConfirmed || isFailed) {
        if (refreshEndorsementChain && isConfirmed) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            title,
            {
              isSuccess: isConfirmed,
              beneficiaryAddress,
            },
            setShowEndorsementChain,
            errorMessage
          )
        )
        setFormActionNone()
      }
    }
    // Handle NominateBeneficiaryForm confirmation/ failure
    if (type === AssetManagementActions.NominateBeneficiary) {
      const { nominationState } = props
      const isConfirmed = nominationState === FormState.CONFIRMED
      const isFailed = nominationState === FormState.ERROR
      const title = isConfirmed
        ? MessageTitle.NOMINATE_BENEFICIARY_SUCCESS
        : MessageTitle.NOMINATE_BENEFICIARY_FAILED

      if (isConfirmed || isFailed) {
        showOverlay(
          showDocumentTransferMessage(
            title,
            {
              isSuccess: isConfirmed,
            },
            setShowEndorsementChain,
            errorMessage
          )
        )
        setFormActionNone()
      }
    }
    // Handle EndorseBeneficiaryForm confirmation/ failure
    if (type === AssetManagementActions.EndorseBeneficiary) {
      const { nominee, endorseBeneficiaryState } = props
      const isConfirmed = endorseBeneficiaryState === FormState.CONFIRMED
      const isFailed = endorseBeneficiaryState === FormState.ERROR
      const title = isConfirmed
        ? MessageTitle.ENDORSE_BENEFICIARY_SUCCESS
        : MessageTitle.ENDORSE_BENEFICIARY_FAILED
      const beneficiaryAddress = isConfirmed ? nominee : beneficiary

      if (isConfirmed || isFailed) {
        if (refreshEndorsementChain && isConfirmed) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            title,
            {
              isSuccess: isConfirmed,
              beneficiaryAddress,
            },
            setShowEndorsementChain,
            errorMessage
          )
        )
        setFormActionNone()
      }
    }
    // Handle EndorseTransferForm confirmation/ failure
    if (type === AssetManagementActions.TransferOwner) {
      const { transferOwnersState } = props
      const isConfirmed = transferOwnersState === FormState.CONFIRMED
      const isFailed = transferOwnersState === FormState.ERROR
      const title = isConfirmed
        ? MessageTitle.TRANSFER_OWNER_SUCCESS
        : MessageTitle.TRANSFER_OWNER_FAILED
      const beneficiaryAddress = isConfirmed ? newOwner : beneficiary

      if (isConfirmed || isFailed) {
        if (refreshEndorsementChain && isConfirmed) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            title,
            {
              isSuccess: isConfirmed,
              beneficiaryAddress,
            },
            setShowEndorsementChain,
            errorMessage
          )
        )
        setFormActionNone()
      }
    }
    // Handle SurrenderForm/ReturnToIssuer confirmation/ failure
    if (type === AssetManagementActions.ReturnToIssuer) {
      const { returnToIssuerState } = props
      const isConfirmed = returnToIssuerState === FormState.CONFIRMED
      const isFailed = returnToIssuerState === FormState.ERROR
      const title = isConfirmed
        ? MessageTitle.RETURN_TO_ISSUER_DOCUMENT_SUCCESS
        : MessageTitle.RETURN_TO_ISSUER_DOCUMENT_FAILED
      const beneficiaryAddress = isConfirmed ? '' : beneficiary
      const holderAddress = isConfirmed ? '' : holder

      if (isConfirmed || isFailed) {
        if (refreshEndorsementChain && isConfirmed) {
          refreshEndorsementChain()
        }

        showOverlay(
          showDocumentTransferMessage(
            title,
            {
              isSuccess: isConfirmed,
              beneficiaryAddress,
              holderAddress,
            },
            setShowEndorsementChain,
            errorMessage
          )
        )
        setFormActionNone()
      }
    }
    // Handle RejectSurrenderedForm confirmation/ failure
    if (type === AssetManagementActions.RejectReturnToIssuer) {
      const { restoreTokenState } = props
      const isConfirmed = restoreTokenState === FormState.CONFIRMED
      const isFailed = restoreTokenState === FormState.ERROR
      const title = isConfirmed
        ? MessageTitle.REJECT_RETURN_TO_ISSUER_DOCUMENT_SUCCESS
        : MessageTitle.REJECT_RETURN_TO_ISSUER_DOCUMENT_FAILED
      const beneficiaryAddress = isConfirmed ? beneficiary : ''
      const holderAddress = isConfirmed ? holder : ''

      if (isConfirmed || isFailed) {
        if (refreshEndorsementChain && isConfirmed) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            title,
            {
              isSuccess: isConfirmed,
              beneficiaryAddress,
              holderAddress,
            },
            setShowEndorsementChain,
            errorMessage
          )
        )
        setFormActionNone()
      }
    }
    // Handle AcceptSurrenderedForm confirmation/ failure
    if (type === AssetManagementActions.AcceptReturnToIssuer) {
      const { destroyTokenState } = props
      const isConfirmed = destroyTokenState === FormState.CONFIRMED
      const isFailed = destroyTokenState === FormState.ERROR
      const title = isConfirmed
        ? MessageTitle.ACCEPT_RETURN_TO_ISSUER_DOCUMENT_SUCCESS
        : MessageTitle.ACCEPT_RETURN_TO_ISSUER_DOCUMENT_FAILED

      if (isConfirmed || isFailed) {
        if (refreshEndorsementChain && isConfirmed) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            title,
            { isSuccess: isConfirmed },
            setShowEndorsementChain,
            errorMessage
          )
        )
        setFormActionNone()
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props,
    showOverlay,
    setFormActionNone,
    beneficiary,
    holder,
    newHolder,
    newOwner,
    remark,
    prevBeneficiary,
    prevHolder,
    type,
  ])

  // Switch based on form type to handle specific UI rendering
  switch (type) {
    case AssetManagementActions.TransferHolder: {
      const { handleTransfer, holderTransferringState } = props
      const isPendingConfirmation =
        holderTransferringState === FormState.PENDING_CONFIRMATION ||
        holderTransferringState === FormState.INITIALIZED
      const isEditable =
        holderTransferringState !== FormState.PENDING_CONFIRMATION &&
        holderTransferringState !== FormState.CONFIRMED

      const isValidTransfer = () => {
        if (!newHolder) return false
        if (newHolder?.toLowerCase() === holder?.toLowerCase()) return false
        if (!isEthereumAddress(newHolder)) return false
        return true
      }

      return (
        <>
          <div
            className={`action-form-frame ${isPendingConfirmation ? 'opacity-[0.33] pointer-events-none' : ''}`}
          >
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Owner"
                value={beneficiary}
                isEditable={false}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Holder"
                value={holder}
                newValue={newHolder}
                isEditable={isEditable}
                onSetNewValue={setNewHolder}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Remark"
                value="Remark"
                newValue={remark}
                onSetNewValue={setRemark}
                isEditable={true}
                isRemark={true}
                isSubmitted={isPendingConfirmation}
              />
            </div>
          </div>
          <div className="form-action-btn-outer-frame">
            <div className="form-action-btn-inner-frame">
              <Button
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={setFormActionNone}
                disabled={isPendingConfirmation}
                data-testid={'cancelTransferBtn'}
                btnType="transparent"
                size={ButtonSize.SM}
              >
                Cancel
              </Button>

              <ButtonIcon
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                disabled={!isValidTransfer() || isPendingConfirmation}
                onClick={() =>
                  handleTransfer({
                    holderAddress: newHolder,
                    remarks: remark,
                  })
                }
                data-testid={'transferBtn'}
                size={ButtonSize.SM}
              >
                {isPendingConfirmation ? (
                  <div className="flex flex-row items-center gap-2">
                    <Spinner data-testid={'loader'} fill="white" />
                    Transferring..
                  </div>
                ) : (
                  'Transfer'
                )}
              </ButtonIcon>
            </div>
          </div>
        </>
      )
    }

    case AssetManagementActions.TransferOwner: {
      const { handleBeneficiaryTransfer, transferOwnersState } = props
      const isPendingConfirmation =
        transferOwnersState === FormState.PENDING_CONFIRMATION ||
        transferOwnersState === FormState.INITIALIZED
      const isEditable =
        transferOwnersState !== FormState.PENDING_CONFIRMATION &&
        transferOwnersState !== FormState.CONFIRMED

      const isValidTransfer = () => {
        if (!newOwner) return false
        if (newOwner?.toLowerCase() === beneficiary?.toLowerCase()) return false
        if (!isEthereumAddress(newOwner)) return false
        return true
      }

      return (
        <>
          <div
            className={`action-form-frame ${isPendingConfirmation ? 'opacity-[0.33] pointer-events-none' : ''}`}
          >
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Owner"
                value={beneficiary}
                newValue={newOwner}
                isEditable={isEditable}
                onSetNewValue={setNewOwner}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Holder"
                value={holder}
                isEditable={false}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Remark"
                value="Remark"
                newValue={remark}
                onSetNewValue={setRemark}
                isEditable={true}
                isRemark={true}
                isSubmitted={isPendingConfirmation}
              />
            </div>
          </div>
          <div className="form-action-btn-outer-frame">
            <div className="form-action-btn-inner-frame">
              <Button
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={setFormActionNone}
                disabled={isPendingConfirmation}
                data-testid={'cancelTransferBtn'}
                btnType="transparent"
                size={ButtonSize.SM}
              >
                Cancel
              </Button>

              <ButtonIcon
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                disabled={!isValidTransfer() || isPendingConfirmation}
                onClick={() =>
                  handleBeneficiaryTransfer({
                    newBeneficiaryAddress: newOwner,
                    remarks: remark,
                  })
                }
                data-testid={'transferBtn'}
                size={ButtonSize.SM}
              >
                {isPendingConfirmation ? (
                  <div className="flex flex-row items-center gap-2">
                    <Spinner data-testid={'loader'} fill="white" />
                    Transferring..
                  </div>
                ) : (
                  'Transfer'
                )}
              </ButtonIcon>
            </div>
          </div>
        </>
      )
    }

    case AssetManagementActions.TransferOwnerHolder: {
      const { handleTransferOwnerHolder, transferOwnerHoldersState } = props
      const isPendingConfirmation =
        transferOwnerHoldersState === FormState.PENDING_CONFIRMATION ||
        transferOwnerHoldersState === FormState.INITIALIZED
      const isEditable =
        transferOwnerHoldersState !== FormState.PENDING_CONFIRMATION &&
        transferOwnerHoldersState !== FormState.CONFIRMED
      const isValidEndorseTransfer = (): boolean => {
        if (!newHolder?.toLowerCase() || !newOwner?.toLowerCase()) return false
        if (newHolder?.toLowerCase() === holder?.toLowerCase()) return false
        if (!isEthereumAddress(newHolder) || !isEthereumAddress(newOwner))
          return false

        return true
      }

      return (
        <>
          <div
            className={`action-form-frame ${isPendingConfirmation ? 'opacity-[0.33] pointer-events-none' : ''}`}
          >
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Owner"
                value={beneficiary}
                newValue={newOwner}
                isEditable={isEditable}
                onSetNewValue={setNewOwner}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Holder"
                value={holder}
                newValue={newHolder}
                isEditable={isEditable}
                onSetNewValue={setNewHolder}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Remark"
                value="Remark"
                newValue={remark}
                onSetNewValue={setRemark}
                isEditable={true}
                isRemark={true}
                isSubmitted={isPendingConfirmation}
              />
            </div>
          </div>
          <div className="form-action-btn-outer-frame">
            <div className="form-action-btn-inner-frame">
              <Button
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={setFormActionNone}
                disabled={isPendingConfirmation}
                btnType="transparent"
                size={ButtonSize.SM}
              >
                Cancel
              </Button>

              <ButtonIcon
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                disabled={!isValidEndorseTransfer() || isPendingConfirmation}
                onClick={() => {
                  handleTransferOwnerHolder({
                    newBeneficiaryAddress: newOwner || '',
                    newHolderAddress: newHolder || '',
                    remarks: remark,
                  })
                }}
                data-testid={'endorseTransferBtn'}
                size={ButtonSize.SM}
              >
                {isPendingConfirmation ? (
                  <div className="flex flex-row items-center gap-2">
                    <Spinner fill="white" /> Transferring..
                  </div>
                ) : (
                  'Transfer'
                )}
              </ButtonIcon>
            </div>
          </div>
        </>
      )
    }

    case AssetManagementActions.NominateBeneficiary: {
      const { handleNomination, nominationState } = props
      const isPendingConfirmation =
        nominationState === FormState.PENDING_CONFIRMATION ||
        nominationState === FormState.INITIALIZED
      const isEditable =
        nominationState !== FormState.PENDING_CONFIRMATION &&
        nominationState !== FormState.CONFIRMED

      const isInvalidNomination =
        !newBeneficiary ||
        !holder ||
        newBeneficiary?.toLowerCase() === beneficiary?.toLowerCase() ||
        !isEthereumAddress(newBeneficiary)

      return (
        <>
          <div
            className={`action-form-frame ${isPendingConfirmation ? 'opacity-[0.33] pointer-events-none' : ''}`}
          >
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Owner"
                value={beneficiary}
                newValue={newBeneficiary}
                isEditable={isEditable}
                onSetNewValue={setNewBeneficiary}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Holder"
                value={holder}
                isEditable={false}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Remark"
                value="Remark"
                newValue={remark}
                onSetNewValue={setRemark}
                isEditable={true}
                isRemark={true}
                isSubmitted={isPendingConfirmation}
              />
            </div>
          </div>
          <div className="form-action-btn-outer-frame">
            <div className="form-action-btn-inner-frame">
              <Button
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={setFormActionNone}
                disabled={isPendingConfirmation}
                data-testid={'cancelNominationBtn'}
                size={ButtonSize.SM}
                btnType="transparent"
              >
                Cancel
              </Button>

              <ButtonIcon
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                disabled={isInvalidNomination || isPendingConfirmation}
                onClick={() => {
                  handleNomination({
                    newBeneficiaryAddress: newBeneficiary,
                    remarks: remark,
                  })
                }}
                data-testid={'nominationBtn'}
                size={ButtonSize.SM}
              >
                {isPendingConfirmation ? (
                  <div className="flex flex-row items-center gap-2">
                    <Spinner data-testid={'loader'} fill="white" />
                    Nominating..
                  </div>
                ) : (
                  'Nominate'
                )}
              </ButtonIcon>
            </div>
          </div>
        </>
      )
    }

    case AssetManagementActions.EndorseBeneficiary: {
      const { nominee, handleBeneficiaryTransfer, endorseBeneficiaryState } =
        props
      const isPendingConfirmation =
        endorseBeneficiaryState === FormState.PENDING_CONFIRMATION ||
        endorseBeneficiaryState === FormState.INITIALIZED

      const isValidEndorse = () => {
        if (!nominee) return false
        // if (nominee === beneficiary) return false;
        if (!isEthereumAddress(nominee)) return false
        return true
      }

      return (
        <>
          <div
            className={`action-form-frame ${isPendingConfirmation ? 'opacity-[0.33] pointer-events-none' : ''}`}
          >
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Nominee"
                value={nominee}
                isEditable={false}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Holder"
                value={holder}
                isEditable={false}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Remark"
                value="Remark"
                newValue={remark}
                onSetNewValue={setRemark}
                isEditable={true}
                isRemark={true}
                isSubmitted={isPendingConfirmation}
              />
            </div>
          </div>

          <div className="form-action-btn-outer-frame">
            <div className="form-action-btn-inner-frame">
              <Button
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={setFormActionNone}
                disabled={isPendingConfirmation}
                data-testid={'cancelEndorseBtn'}
                btnType="transparent"
                size={ButtonSize.SM}
              >
                Cancel
              </Button>

              <ButtonIcon
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                disabled={!isValidEndorse() || isPendingConfirmation}
                onClick={() =>
                  handleBeneficiaryTransfer({
                    newBeneficiaryAddress: nominee || '',
                    remarks: remark,
                  })
                }
                data-testid={'endorseBtn'}
                size={ButtonSize.SM}
              >
                {isPendingConfirmation ? (
                  <div className="flex flex-row items-center gap-2">
                    <Spinner data-testid={'loader'} fill="white" />
                    Endorsing transfer..
                  </div>
                ) : (
                  'Endorse'
                )}
              </ButtonIcon>
            </div>
          </div>
        </>
      )
    }

    case AssetManagementActions.RejectTransferOwnerHolder: {
      const {
        handleRejectTransferOwnerHolder,
        rejectTransferOwnerHolderState,
      } = props
      const isPendingConfirmation =
        rejectTransferOwnerHolderState === FormState.PENDING_CONFIRMATION ||
        rejectTransferOwnerHolderState === FormState.INITIALIZED

      return (
        <>
          <div
            className={`action-form-frame ${isPendingConfirmation ? 'opacity-[0.33] pointer-events-none' : ''}`}
          >
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Previous Owner"
                value={prevBeneficiary}
                isEditable={false}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Previous Holder"
                value={prevHolder}
                isEditable={false}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Remark"
                value="Remark"
                newValue={remark}
                onSetNewValue={setRemark}
                isEditable={true}
                isRemark={true}
                isSubmitted={isPendingConfirmation}
              />
            </div>
          </div>
          <div className="form-action-btn-outer-frame">
            <div className="form-action-btn-inner-frame">
              <Button
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={setFormActionNone}
                disabled={isPendingConfirmation}
                btnType="transparent"
                size={ButtonSize.SM}
              >
                Cancel
              </Button>

              <ButtonIcon
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={() =>
                  handleRejectTransferOwnerHolder({
                    remarks: remark,
                  })
                }
                disabled={isPendingConfirmation}
                data-testid={'rejectTransferOwnerHolderBtn'}
                size={ButtonSize.SM}
              >
                {isPendingConfirmation ? (
                  <div className="flex flex-row items-center gap-2">
                    <Spinner fill="white" /> Rejecting..
                  </div>
                ) : (
                  'Confirm'
                )}
              </ButtonIcon>
            </div>
          </div>
        </>
      )
    }

    case AssetManagementActions.RejectTransferOwner: {
      const { handleRejectTransferOwner, rejectTransferOwnerState } = props
      const isPendingConfirmation =
        rejectTransferOwnerState === FormState.PENDING_CONFIRMATION ||
        rejectTransferOwnerState === FormState.INITIALIZED

      return (
        <>
          <div
            className={`action-form-frame ${isPendingConfirmation ? 'opacity-[0.33] pointer-events-none' : ''}`}
          >
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Previous Owner"
                value={prevBeneficiary}
                isEditable={false}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Holder"
                value={holder}
                isEditable={false}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Remark"
                value="Remark"
                newValue={remark}
                onSetNewValue={setRemark}
                isEditable={true}
                isRemark={true}
                isSubmitted={isPendingConfirmation}
              />
            </div>
          </div>
          <div className="form-action-btn-outer-frame">
            <div className="form-action-btn-inner-frame">
              <Button
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={setFormActionNone}
                disabled={isPendingConfirmation}
                btnType="transparent"
                size={ButtonSize.SM}
              >
                Cancel
              </Button>

              <ButtonIcon
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={() =>
                  handleRejectTransferOwner({
                    remarks: remark,
                  })
                }
                disabled={isPendingConfirmation}
                data-testid={'rejectTransferOwnerBtn'}
                size={ButtonSize.SM}
              >
                {isPendingConfirmation ? (
                  <div className="flex flex-row items-center gap-2">
                    <Spinner fill="white" /> Rejecting..
                  </div>
                ) : (
                  'Reject'
                )}
              </ButtonIcon>
            </div>
          </div>
        </>
      )
    }

    case AssetManagementActions.RejectTransferHolder: {
      const { handleRejectTransferHolder, rejectTransferHolderState } = props
      const isPendingConfirmation =
        rejectTransferHolderState === FormState.PENDING_CONFIRMATION ||
        rejectTransferHolderState === FormState.INITIALIZED

      return (
        <>
          <div
            className={`action-form-frame ${isPendingConfirmation ? 'opacity-[0.33] pointer-events-none' : ''}`}
          >
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Owner"
                value={beneficiary}
                isEditable={false}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Previous Holder"
                value={prevHolder}
                isEditable={false}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Remark"
                value="Remark"
                newValue={remark}
                onSetNewValue={setRemark}
                isEditable={true}
                isRemark={true}
                isSubmitted={isPendingConfirmation}
              />
            </div>
          </div>
          <div className="form-action-btn-outer-frame">
            <div className="form-action-btn-inner-frame">
              <Button
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={setFormActionNone}
                disabled={isPendingConfirmation}
                btnType="transparent"
                size={ButtonSize.SM}
              >
                Cancel
              </Button>

              <ButtonIcon
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={() =>
                  handleRejectTransferHolder({
                    remarks: remark,
                  })
                }
                disabled={isPendingConfirmation}
                data-testid={'rejectTransferHolderBtn'}
                size={ButtonSize.SM}
              >
                {isPendingConfirmation ? (
                  <div className="flex flex-row items-center gap-2">
                    <Spinner fill="white" /> Rejecting..
                  </div>
                ) : (
                  'Reject'
                )}
              </ButtonIcon>
            </div>
          </div>
        </>
      )
    }

    case AssetManagementActions.ReturnToIssuer: {
      const { handleReturnToIssuer, returnToIssuerState } = props
      const isPendingConfirmation =
        returnToIssuerState === FormState.PENDING_CONFIRMATION ||
        returnToIssuerState === FormState.INITIALIZED

      return (
        <>
          <div
            className={`justify-end action-form-frame ${isPendingConfirmation ? 'opacity-[0.33] pointer-events-none' : ''}`}
          >
            <div className="editable-asset-title max-w-[100%] lg:max-w-[383px]">
              <EditableAssetTitle
                role="Remark"
                value="Remark"
                newValue={remark}
                onSetNewValue={setRemark}
                isEditable={true}
                isRemark={true}
                isSubmitted={isPendingConfirmation}
              />
            </div>
          </div>
          <div className="form-action-btn-outer-frame">
            <div className="form-action-btn-inner-frame">
              <Button
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={setFormActionNone}
                disabled={isPendingConfirmation}
                data-testid={'cancelSurrenderBtn'}
                btnType="transparent"
                size={ButtonSize.SM}
              >
                Cancel
              </Button>

              <ButtonIcon
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={() => handleReturnToIssuer({ remarks: remark })}
                disabled={isPendingConfirmation}
                data-testid={'surrenderBtn'}
                size={ButtonSize.SM}
              >
                {isPendingConfirmation ? (
                  <div className="flex flex-row items-center gap-2">
                    <Spinner data-testid={'loader'} fill="white" />
                    Returning..
                  </div>
                ) : (
                  'Return To Issuer'
                )}
              </ButtonIcon>
            </div>
          </div>
        </>
      )
    }

    case AssetManagementActions.RejectReturnToIssuer: {
      const { restoreTokenState, handleRestoreToken } = props
      const isRestoreTokenPendingConfirmation =
        restoreTokenState === FormState.PENDING_CONFIRMATION ||
        restoreTokenState === FormState.INITIALIZED

      return (
        <>
          <div
            className={`action-form-frame ${isRestoreTokenPendingConfirmation ? 'opacity-[0.33] pointer-events-none' : ''}`}
          >
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Owner"
                value={beneficiary}
                isEditable={false}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Holder"
                value={holder}
                isEditable={false}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Remark"
                value="Remark"
                newValue={remark}
                onSetNewValue={setRemark}
                isEditable={true}
                isRemark={true}
                isSubmitted={isRestoreTokenPendingConfirmation}
              />
            </div>
          </div>
          <div className="form-action-btn-outer-frame">
            <div className="form-action-btn-inner-frame">
              <Button
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={setFormActionNone}
                disabled={isRestoreTokenPendingConfirmation}
                data-testid={'cancelSurrenderBtn'}
                btnType="transparent"
                size={ButtonSize.SM}
              >
                Cancel
              </Button>

              <ButtonIcon
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={() => handleRestoreToken({ remarks: remark })}
                disabled={isRestoreTokenPendingConfirmation}
                data-testid={'rejectReturnToIssuerBtn'}
                size={ButtonSize.SM}
              >
                {isRestoreTokenPendingConfirmation ? (
                  <div className="flex flex-row items-center gap-2">
                    <Spinner data-testid={'loader'} fill="white" />
                    Rejecting..
                  </div>
                ) : (
                  'Reject ETR Return'
                )}
              </ButtonIcon>
            </div>
          </div>
        </>
      )
    }

    case AssetManagementActions.AcceptReturnToIssuer: {
      const { handleDestroyToken, destroyTokenState } = props
      const isDestroyTokenPendingConfirmation =
        destroyTokenState === FormState.PENDING_CONFIRMATION ||
        destroyTokenState === FormState.INITIALIZED

      return (
        <>
          <div
            className={`justify-end action-form-frame ${isDestroyTokenPendingConfirmation ? 'opacity-[0.33] pointer-events-none' : ''}`}
          >
            <div className="editable-asset-title max-w-[100%] lg:max-w-[383px]">
              <EditableAssetTitle
                role="Remark"
                value="Remark"
                newValue={remark}
                onSetNewValue={setRemark}
                isEditable={true}
                isRemark={true}
                isSubmitted={isDestroyTokenPendingConfirmation}
              />
            </div>
          </div>
          <div className="form-action-btn-outer-frame">
            <div className="form-action-btn-inner-frame">
              <Button
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={setFormActionNone}
                disabled={isDestroyTokenPendingConfirmation}
                data-testid={'cancelSurrenderBtn'}
                btnType="transparent"
                size={ButtonSize.SM}
              >
                Cancel
              </Button>

              <ButtonIcon
                className="!flex-1 !min-w-[188px] !max-w-[383px]"
                onClick={() => handleDestroyToken({ remarks: remark })}
                disabled={isDestroyTokenPendingConfirmation}
                data-testid={'acceptReturnToIssuerBtn'}
                size={ButtonSize.SM}
              >
                {isDestroyTokenPendingConfirmation ? (
                  <div className="flex flex-row items-center gap-2">
                    <Spinner data-testid={'loader'} fill="white" />
                    Accepting..
                  </div>
                ) : (
                  'Accept ETR Return'
                )}
              </ButtonIcon>
            </div>
          </div>
        </>
      )
    }
    default:
      return null
  }
}
