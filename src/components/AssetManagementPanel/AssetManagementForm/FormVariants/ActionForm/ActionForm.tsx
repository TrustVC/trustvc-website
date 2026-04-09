import React, { FunctionComponent, useEffect, useState } from 'react'
import {
  MessageTitle,
  showDocumentTransferMessage,
} from '../../../../common/Overlay/OverlayContent'
import { AssetManagementActions } from '../../../AssetManagementActions'
import { FooterActionButtons } from '../../FooterActionButtons'
import { EditableAssetTitle } from './../EditableAssetTitle'
import { useOverlayContext } from '../../../../common/contexts/OverlayContext'
import { isEthereumAddress } from '../../../../../utils/helper'
import Spinner from '../../../../common/Spinner'
import { FormState } from '../../../../../utils/common/FormState'
import { Button, ButtonIcon, ButtonSize } from '../../../../common/Button'

// Base Props shared by all form variants
export interface BaseActionFormProps {
  beneficiary: string
  holder: string
  nominee?: string
  isExpired?: boolean
  setFormActionNone: () => void
  setShowEndorsementChain: (payload: boolean) => void
}

// Props for TransferHolderForm
export interface TransferHolderFormProps extends BaseActionFormProps {
  type: AssetManagementActions.TransferHolder
  handleTransfer: ({
    holderAddress,
    remarks,
  }: {
    holderAddress: string
    remarks: string
  }) => void
  holderTransferringState: string
}

// Props for TransferOwnerForm
export interface TransferOwnerFormProps extends BaseActionFormProps {
  type: AssetManagementActions.TransferOwner
  handleBeneficiaryTransfer: ({
    newBeneficiaryAddress,
    remarks,
  }: {
    newBeneficiaryAddress: string
    remarks: string
  }) => void
  beneficiaryEndorseState: string
}

// Props for TransferOwnerHolderForm
export interface TransferOwnerHolderFormProps extends BaseActionFormProps {
  type: AssetManagementActions.TransferOwnerHolder
  handleEndorseTransfer: ({
    newBeneficiaryAddress,
    newHolderAddress,
    remarks,
  }: {
    newBeneficiaryAddress: string
    newHolderAddress: string
    remarks: string
  }) => void
  transferOwnersState: string
}

// Props for NominateBeneficiaryForm
export interface NominateBeneficiaryFormProps extends BaseActionFormProps {
  type: AssetManagementActions.NominateBeneficiary
  handleNomination: ({
    newBeneficiaryAddress,
    remarks,
  }: {
    newBeneficiaryAddress: string
    remarks: string
  }) => void
  nominationState: string
}

// Props for EndorseBeneficiaryForm
export interface EndorseBeneficiaryProps extends BaseActionFormProps {
  type: AssetManagementActions.EndorseBeneficiary
  nominee?: string
  handleBeneficiaryTransfer: ({
    newBeneficiaryAddress,
    remarks,
  }: {
    newBeneficiaryAddress: string
    remarks: string
  }) => void
  beneficiaryEndorseState: string
}

// Props for SurrenderForm
export interface SurrenderFormProps extends BaseActionFormProps {
  type: AssetManagementActions.ReturnToIssuer
  handleReturnToIssuer: ({ remarks }: { remarks: string }) => void
  returnToIssuerState: string
}

// Props for AcceptSurrenderedForm
export interface AcceptSurrenderedFormProps extends BaseActionFormProps {
  type: AssetManagementActions.AcceptReturnToIssuer
  handleDestroyToken: (remarks: string) => void
  destroyTokenState: string
}

// Props for RejectSurrenderedForm
export interface RejectSurrenderedFormProps extends BaseActionFormProps {
  type: AssetManagementActions.RejectReturnToIssuer
  handleRestoreToken: (remarks: string) => void
  restoreTokenState: string
}

// Props for RejectTransferOwnerHolderForm
export interface RejectTransferOwnerHolderFormProps extends BaseActionFormProps {
  type: AssetManagementActions.RejectTransferOwnerHolder
  handleRejectTransferOwnerHolder: ({ remarks }: { remarks: string }) => void
  rejectTransferOwnerHolderState: string
}

// Props for RejectTransferOwnerForm
export interface RejectTransferOwnerFormProps extends BaseActionFormProps {
  type: AssetManagementActions.RejectTransferOwner
  handleRejectTransferOwner: ({ remarks }: { remarks: string }) => void
  rejectTransferOwnerState: string
}

// Props for RejectTransferHolderForm
export interface RejectTransferHolderFormProps extends BaseActionFormProps {
  type: AssetManagementActions.RejectTransferHolder
  handleRejectTransferHolder: ({ remarks }: { remarks: string }) => void
  rejectTransferHolderState: string
}

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
    setFormActionNone,
    setShowEndorsementChain,
  } = props
  const [remark, setRemark] = useState('')
  const { closeOverlay, showOverlay } = useOverlayContext()

  // Additional state variables for different form types
  const [newHolder, setNewHolder] = useState(holder || '')
  const [newOwner, setNewOwner] = useState(holder || '')

  // All useEffect hooks moved outside of the switch statement
  useEffect(() => {
    // Handle TransferHolderForm confirmation
    if (type === AssetManagementActions.TransferHolder) {
      const { holderTransferringState } = props
      const isConfirmed = holderTransferringState === FormState.CONFIRMED

      if (isConfirmed) {
        showOverlay(
          showDocumentTransferMessage(
            MessageTitle.TRANSFER_HOLDER_SUCCESS,
            {
              isSuccess: true,
              holderAddress: newHolder,
            },
            <FooterActionButtons
              setShowEndorsementChain={setShowEndorsementChain}
              closeOverlay={closeOverlay}
            />
          )
        )
        setFormActionNone()
      }
    }

    // Handle EndorseTransferForm confirmation
    if (type === AssetManagementActions.TransferOwnerHolder) {
      const { transferOwnersState } = props
      const isConfirmed = transferOwnersState === FormState.CONFIRMED

      if (isConfirmed) {
        showOverlay(
          showDocumentTransferMessage(
            MessageTitle.ENDORSE_TRANSFER_SUCCESS,
            {
              isSuccess: true,
              beneficiaryAddress: newOwner,
              holderAddress: newHolder,
            },
            <FooterActionButtons
              setShowEndorsementChain={setShowEndorsementChain}
              closeOverlay={closeOverlay}
            />
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
    type,
  ])

  // Switch based on form type to handle specific UI rendering
  switch (type) {
    case AssetManagementActions.TransferHolder: {
      const { handleTransfer, holderTransferringState } = props
      console.log('🚀 ~ holderTransferringState:', holderTransferringState)
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
          <div className="action-form-frame">
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
                  <Spinner data-testid={'loader'} />
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
      const { handleBeneficiaryTransfer, beneficiaryEndorseState } = props
      const isPendingConfirmation =
        beneficiaryEndorseState === FormState.PENDING_CONFIRMATION ||
        beneficiaryEndorseState === FormState.INITIALIZED
      const isEditable =
        beneficiaryEndorseState !== FormState.PENDING_CONFIRMATION &&
        beneficiaryEndorseState !== FormState.CONFIRMED

      const isValidTransfer = () => {
        if (!newOwner) return false
        if (newOwner?.toLowerCase() === beneficiary?.toLowerCase()) return false
        if (!isEthereumAddress(newOwner)) return false
        return true
      }

      return (
        <>
          <div className="action-form-frame">
            <div className="editable-asset-title">
              <EditableAssetTitle
                role="Owner"
                value={beneficiary}
                newValue={newOwner}
                isEditable={isEditable}
                onSetNewValue={setNewOwner}
                isError={beneficiaryEndorseState === FormState.ERROR}
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
                  <Spinner data-testid={'loader'} />
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
      const { handleEndorseTransfer, transferOwnersState } = props
      const isPendingConfirmation =
        transferOwnersState === FormState.PENDING_CONFIRMATION ||
        transferOwnersState === FormState.INITIALIZED
      const isEditable =
        transferOwnersState !== FormState.PENDING_CONFIRMATION &&
        transferOwnersState !== FormState.CONFIRMED
      console.log('isEditable', newHolder, newOwner, transferOwnersState)
      const isValidEndorseTransfer = (): boolean => {
        if (!newHolder || !newOwner) return false
        if (newHolder === holder) return false
        if (!isEthereumAddress(newHolder) || !isEthereumAddress(newOwner))
          return false

        return true
      }

      return (
        <>
          <div className="action-form-frame">
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
                newValue={newHolder}
                isEditable={isEditable}
                onSetNewValue={setNewHolder}
                isError={transferOwnersState === FormState.ERROR}
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
                  handleEndorseTransfer({
                    newBeneficiaryAddress: newOwner || '',
                    newHolderAddress: newHolder || '',
                    remarks: remark,
                  })
                }}
                data-testid={'endorseTransferBtn'}
                size={ButtonSize.SM}
              >
                {isPendingConfirmation ? (
                  <Spinner data-testid={'loader'} />
                ) : (
                  'Transfer'
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
