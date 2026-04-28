import { AssetManagementActions } from '../../../AssetManagementActions'

// Base Props shared by all form variants
export interface BaseActionFormProps {
  beneficiary: string
  holder: string
  nominee?: string
  prevBeneficiary?: string
  prevHolder?: string
  isExpired?: boolean
  setFormActionNone: () => void
  setShowEndorsementChain: (payload: boolean) => void
  refreshEndorsementChain?: () => void
  errorMessage?: string
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
  transferOwnersState: string
}

// Props for TransferOwnerHolderForm
export interface TransferOwnerHolderFormProps extends BaseActionFormProps {
  type: AssetManagementActions.TransferOwnerHolder
  handleTransferOwnerHolder: ({
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
  endorseBeneficiaryState: string
}

// Props for ReturnToIssuerForm
export interface ReturnToIssuerFormProps extends BaseActionFormProps {
  type: AssetManagementActions.ReturnToIssuer
  handleReturnToIssuer: ({ remarks }: { remarks: string }) => void
  returnToIssuerState: string
}

// Props for AcceptReturnToIssuerForm
export interface AcceptReturnToIssuerFormProps extends BaseActionFormProps {
  type: AssetManagementActions.AcceptReturnToIssuer
  handleDestroyToken: ({ remarks }: { remarks: string }) => void
  destroyTokenState: string
}

// Props for RejectReturnToIssuerForm
export interface RejectReturnToIssuerFormProps extends BaseActionFormProps {
  type: AssetManagementActions.RejectReturnToIssuer
  handleRestoreToken: ({ remarks }: { remarks: string }) => void
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
