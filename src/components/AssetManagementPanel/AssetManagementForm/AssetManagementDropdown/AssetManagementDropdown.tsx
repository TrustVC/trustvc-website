import { FunctionComponent } from 'react'

import { Dropdown, DropdownItem } from '../../../Dropdown'
import { AssetManagementActions } from './../../AssetManagementActions'
import Spinner from '../../../icons/Spinner'
import { ButtonIcon } from '../../../common/Button'

export interface AssetManagementDropdownProps {
  onSetFormAction: (nextFormAction: AssetManagementActions) => void
  canReturnToIssuer: boolean
  canHandleShred?: boolean
  canHandleRestore?: boolean
  canTransferHolder: boolean
  canTransferBeneficiary: boolean
  canNominateBeneficiary: boolean
  canEndorseBeneficiary: boolean
  canTransferOwners: boolean
  canRejectOwnerHolderTransfer: boolean
  canRejectOwnerTransfer: boolean
  canRejectHolderTransfer: boolean
  isRejectPendingConfirmation?: boolean
}

export const AssetManagementDropdown: FunctionComponent<
  AssetManagementDropdownProps
> = ({
  onSetFormAction,
  canReturnToIssuer,
  canHandleShred,
  canHandleRestore,
  canTransferHolder,
  canTransferBeneficiary,
  canNominateBeneficiary,
  canEndorseBeneficiary,
  canTransferOwners,
  canRejectOwnerHolderTransfer,
  canRejectHolderTransfer,
  canRejectOwnerTransfer,
  isRejectPendingConfirmation,
}) => {
  return isRejectPendingConfirmation ? (
    <ButtonIcon disabled data-testid={'rejectTransferBtn'}>
      <div className="flex flex-row items-center gap-2">
        <Spinner data-testid={'loader'} fill="white" /> Rejecting..
      </div>
    </ButtonIcon>
  ) : (
    <Dropdown
      data-testid="manageAssetDropdown"
      dropdownButtonText="Manage Assets"
    >
      {canTransferHolder && (
        <DropdownItem
          className="dropdown-item-btn"
          data-testid={'transferHolderDropdown'}
          onClick={() => onSetFormAction(AssetManagementActions.TransferHolder)}
        >
          Transfer holdership
        </DropdownItem>
      )}
      {canTransferBeneficiary && (
        <DropdownItem
          className="dropdown-item-btn"
          data-testid={'transferOwnerDropdown'}
          onClick={() => {
            onSetFormAction(AssetManagementActions.TransferOwner)
          }}
        >
          Transfer ownership
        </DropdownItem>
      )}
      {canNominateBeneficiary && (
        <DropdownItem
          className="dropdown-item-btn"
          data-testid={'nominateBeneficiaryHolderDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.NominateBeneficiary)
          }
        >
          Nominate transfer ownership
        </DropdownItem>
      )}
      {!canTransferBeneficiary && canEndorseBeneficiary && (
        <DropdownItem
          className="dropdown-item-btn"
          data-testid={'endorseBeneficiaryDropdown'}
          onClick={() => {
            onSetFormAction(AssetManagementActions.EndorseBeneficiary)
          }}
        >
          Endorse transfer ownership
        </DropdownItem>
      )}
      {canTransferOwners && (
        <DropdownItem
          className="dropdown-item-btn"
          data-testid={'endorseTransferDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.TransferOwnerHolder)
          }
        >
          Transfer ownership and holdership
        </DropdownItem>
      )}
      {canReturnToIssuer && (
        <DropdownItem
          className="dropdown-item-btn"
          data-testid={'returnToIssuerDropdown'}
          onClick={() => onSetFormAction(AssetManagementActions.ReturnToIssuer)}
        >
          Return ETR to issuer
        </DropdownItem>
      )}
      {canHandleShred && (
        <DropdownItem
          className="dropdown-item-btn"
          data-testid={'acceptReturnToIssuerDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.AcceptReturnToIssuer)
          }
        >
          Accept ETR return
        </DropdownItem>
      )}
      {canHandleRestore && (
        <DropdownItem
          className="dropdown-item-btn"
          data-testid={'rejectReturnToIssuerDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.RejectReturnToIssuer)
          }
        >
          Reject ETR return
        </DropdownItem>
      )}
      {canRejectOwnerHolderTransfer && (
        <DropdownItem
          className="dropdown-item-btn"
          data-testid={'rejectTransferOwnerHolderDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.RejectTransferOwnerHolder)
          }
        >
          Reject ownership and holdership
        </DropdownItem>
      )}
      {canRejectOwnerTransfer && (
        <DropdownItem
          className="dropdown-item-btn"
          data-testid={'rejectTransferOwnerDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.RejectTransferOwner)
          }
        >
          Reject ownership
        </DropdownItem>
      )}
      {canRejectHolderTransfer && (
        <DropdownItem
          className="dropdown-item-btn"
          data-testid={'rejectTransferHolderDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.RejectTransferHolder)
          }
        >
          Reject holdership
        </DropdownItem>
      )}
    </Dropdown>
  )
}
