import { FunctionComponent } from 'react'

import { Dropdown, DropdownItem } from '../../../Dropdown'
import { AssetManagementActions } from './../../AssetManagementActions'
import Spinner from '../../../common/Spinner'
import { ButtonIcon } from '../../../common/Button'

interface AssetManagementDropdownProps {
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
      <Spinner data-testid={'loader'} />
      <div className="flex-grow">Rejecting</div>
    </ButtonIcon>
  ) : (
    <Dropdown
      data-testid="manageAssetDropdown"
      dropdownButtonText="Manage Assets"
      className="dropdown-menu-btn"
    >
      {canTransferHolder && (
        <DropdownItem
          className="active:bg-cloud-200 active:text-white"
          data-testid={'transferHolderDropdown'}
          onClick={() => onSetFormAction(AssetManagementActions.TransferHolder)}
        >
          <div className="dropdown-item-text">Transfer holdership</div>
        </DropdownItem>
      )}
      {canTransferBeneficiary && (
        <DropdownItem
          className="active:bg-cloud-200 active:text-white"
          data-testid={'transferOwnerDropdown'}
          onClick={() => {
            onSetFormAction(AssetManagementActions.TransferOwner)
          }}
        >
          <div className="dropdown-item-text">Transfer ownership</div>
        </DropdownItem>
      )}
      {canNominateBeneficiary && (
        <DropdownItem
          className="active:bg-cloud-200 active:text-white"
          data-testid={'nominateBeneficiaryHolderDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.NominateBeneficiary)
          }
        >
          <div className="dropdown-item-text">Nominate transfer ownership</div>
        </DropdownItem>
      )}
      {!canTransferBeneficiary && canEndorseBeneficiary && (
        <DropdownItem
          className="active:bg-cloud-200 active:text-white"
          data-testid={'endorseBeneficiaryDropdown'}
          onClick={() => {
            onSetFormAction(AssetManagementActions.EndorseBeneficiary)
          }}
        >
          <div className="dropdown-item-text">Endorse transfer ownership</div>
        </DropdownItem>
      )}
      {canTransferOwners && (
        <DropdownItem
          className="active:bg-cloud-200 active:text-white text-wrap"
          data-testid={'endorseTransferDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.TransferOwnerHolder)
          }
        >
          <div className="dropdown-item-text">
            Transfer ownership and holdership
          </div>
        </DropdownItem>
      )}
      {canReturnToIssuer && (
        <DropdownItem
          className="active:bg-cloud-200 active:text-white"
          data-testid={'surrenderDropdown'}
          onClick={() => onSetFormAction(AssetManagementActions.ReturnToIssuer)}
        >
          <div className="dropdown-item-text">Return ETR to issuer</div>
        </DropdownItem>
      )}
      {canHandleShred && (
        <DropdownItem
          className="active:bg-cloud-200 active:text-white"
          data-testid={'acceptSurrenderDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.AcceptReturnToIssuer)
          }
        >
          <div className="dropdown-item-text">Accept ETR return</div>
        </DropdownItem>
      )}
      {canHandleRestore && (
        <DropdownItem
          className="active:bg-cloud-200 active:text-white"
          data-testid={'rejectSurrenderDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.RejectReturnToIssuer)
          }
        >
          <div className="dropdown-item-text">Reject ETR return</div>
        </DropdownItem>
      )}
      {canRejectOwnerHolderTransfer && (
        <DropdownItem
          className="divide-y active:bg-cloud-200 active:text-white"
          data-testid={'rejectTransferOwnerHolderDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.RejectTransferOwnerHolder)
          }
        >
          <div className="dropdown-item-text">
            Reject ownership and holdership
          </div>
        </DropdownItem>
      )}
      {canRejectOwnerTransfer && (
        <DropdownItem
          className="divide-y active:bg-cloud-200 active:text-white"
          data-testid={'rejectTransferOwnerDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.RejectTransferOwner)
          }
        >
          <div className="dropdown-item-text">Reject ownership</div>
        </DropdownItem>
      )}
      {canRejectHolderTransfer && (
        <DropdownItem
          className="divide-y active:bg-cloud-200 active:text-white"
          data-testid={'rejectTransferHolderDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.RejectTransferHolder)
          }
        >
          <div className="dropdown-item-text">Reject holdership</div>
        </DropdownItem>
      )}
    </Dropdown>
  )
}
