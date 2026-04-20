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
  SurrenderFormProps,
  AcceptSurrenderedFormProps,
  RejectSurrenderedFormProps,
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
  | SurrenderFormProps
  | AcceptSurrenderedFormProps
  | RejectSurrenderedFormProps
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
  } = props
  const [remark, setRemark] = useState('')
  const { showOverlay } = useOverlayContext()

  // Additional state variables for different form types
  const [newHolder, setNewHolder] = useState(holder || '')
  const [newOwner, setNewOwner] = useState(holder || '')
  const [newBeneficiary, setNewBeneficiary] = useState('')

  // All useEffect hooks moved outside of the switch statement
  useEffect(() => {
    if (type === AssetManagementActions.TransferHolder) {
      const { holderTransferringState } = props
      const isConfirmed = holderTransferringState === FormState.CONFIRMED

      if (isConfirmed) {
        if (refreshEndorsementChain) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            MessageTitle.TRANSFER_HOLDER_SUCCESS,
            {
              isSuccess: true,
              holderAddress: newHolder,
            },
            setShowEndorsementChain
          )
        )
        setFormActionNone()
      }
    }
    // Handle EndorseTransferForm confirmation
    if (type === AssetManagementActions.TransferOwnerHolder) {
      const { transferOwnerHoldersState } = props
      const isConfirmed = transferOwnerHoldersState === FormState.CONFIRMED

      if (isConfirmed) {
        if (refreshEndorsementChain) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            MessageTitle.TRANSFER_OWNER_HOLDER_SUCCESS,
            {
              isSuccess: true,
              beneficiaryAddress: newOwner,
              holderAddress: newHolder,
            },
            setShowEndorsementChain
          )
        )
        setFormActionNone()
      }
    }

    if (type === AssetManagementActions.RejectTransferOwnerHolder) {
      const { rejectTransferOwnerHolderState } = props
      const isConfirmed = rejectTransferOwnerHolderState === FormState.CONFIRMED

      if (isConfirmed) {
        if (refreshEndorsementChain) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            'Holdership Rejection Success',
            {
              isSuccess: true,
              beneficiaryAddress: prevBeneficiary,
              holderAddress: prevHolder,
            },
            setShowEndorsementChain
          )
        )
        setFormActionNone()
      }
    }

    if (type === AssetManagementActions.RejectTransferHolder) {
      const { rejectTransferHolderState } = props
      const isConfirmed = rejectTransferHolderState === FormState.CONFIRMED

      if (isConfirmed) {
        if (refreshEndorsementChain) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            'Holdership Rejection Success',
            {
              isSuccess: true,
              holderAddress: prevHolder,
            },
            setShowEndorsementChain
          )
        )
        setFormActionNone()
      }
    }
    // Handle NominateBeneficiaryForm confirmation
    if (type === AssetManagementActions.NominateBeneficiary) {
      const { nominationState } = props
      const isConfirmed = nominationState === FormState.CONFIRMED

      if (isConfirmed) {
        showOverlay(
          showDocumentTransferMessage(
            MessageTitle.NOMINATE_BENEFICIARY_HOLDER_SUCCESS,
            {
              isSuccess: true,
            },
            setShowEndorsementChain
          )
        )
        setFormActionNone()
      }
    }
    // Handle EndorseBeneficiaryForm confirmation
    if (type === AssetManagementActions.EndorseBeneficiary) {
      const { nominee, endorseBeneficiaryState } = props
      const isConfirmed = endorseBeneficiaryState === FormState.CONFIRMED

      if (isConfirmed) {
        if (refreshEndorsementChain) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            MessageTitle.CHANGE_BENEFICIARY_SUCCESS,
            {
              isSuccess: true,
              beneficiaryAddress: nominee,
            },
            setShowEndorsementChain
          )
        )
        setFormActionNone()
      }
    }
    // Handle EndorseTransferForm confirmation
    if (type === AssetManagementActions.TransferOwner) {
      const { transferOwnersState } = props
      const isConfirmed = transferOwnersState === FormState.CONFIRMED

      if (isConfirmed) {
        if (refreshEndorsementChain) {
          refreshEndorsementChain()
        }
        showOverlay(
          showDocumentTransferMessage(
            MessageTitle.TRANSFER_OWNER_SUCCESS,
            {
              isSuccess: true,
              beneficiaryAddress: newOwner,
            },
            setShowEndorsementChain
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
                isError={holderTransferringState === FormState.ERROR}
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
                isError={transferOwnersState === FormState.ERROR}
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
        if (!newHolder || !newOwner) return false
        if (newHolder === holder) return false
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
                isError={transferOwnerHoldersState === FormState.ERROR}
              />
            </div>
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Holder"
                value={holder}
                newValue={newHolder}
                isEditable={isEditable}
                onSetNewValue={setNewHolder}
                isError={transferOwnerHoldersState === FormState.ERROR}
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
                isError={nominationState === FormState.ERROR}
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

    default:
      return null
  }
}
