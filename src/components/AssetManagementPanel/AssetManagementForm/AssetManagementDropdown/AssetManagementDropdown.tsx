import { ButtonHTMLAttributes, FunctionComponent } from 'react'

import { Dropdown, DropdownItem } from '../../../Dropdown'
import { AssetManagementActions } from './../../AssetManagementActions'
import Spinner from '../../../icons/Spinner'
import { ButtonIcon } from '../../../common/Button'

// DropdownItem (shared with classic ETR actions) renders a non-focusable <div>.
// Render the additive BoE lifecycle actions as real buttons so they're
// keyboard-operable (Tab to focus, Enter/Space to activate) without touching
// the shared component or any existing ETR dropdown item.
interface ObligationDropdownItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'type'
> {
  onClick: () => void
}

const ObligationDropdownItem: FunctionComponent<
  ObligationDropdownItemProps
> = ({ className, children, onClick, ...rest }) => (
  <button
    type="button"
    className={`truncate cursor-pointer text-left ${className ?? ''}`}
    onClick={onClick}
    {...rest}
  >
    <div className="dropdown-item-frame">
      <div className="dropdown-item-text-frame">
        <h5>{children}</h5>
      </div>
    </div>
  </button>
)

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
  canAcceptObligation?: boolean
  canRejectObligation?: boolean
  canDischargeObligation?: boolean
  /** Defaults to classic ETR copy; pass "BoE" for obligation documents. */
  documentLabel?: string
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
  canAcceptObligation,
  canRejectObligation,
  canDischargeObligation,
  documentLabel = 'ETR',
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
      {/* Additive BoE lifecycle actions (shown only when allowed) */}
      {canAcceptObligation && (
        <ObligationDropdownItem
          className="dropdown-item-btn"
          data-testid={'acceptObligationDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.AcceptObligation)
          }
        >
          Accept the bill
        </ObligationDropdownItem>
      )}
      {canRejectObligation && (
        <ObligationDropdownItem
          className="dropdown-item-btn"
          data-testid={'rejectObligationDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.RejectObligation)
          }
        >
          Reject the bill
        </ObligationDropdownItem>
      )}
      {canDischargeObligation && (
        <ObligationDropdownItem
          className="dropdown-item-btn"
          data-testid={'dischargeObligationDropdown'}
          onClick={() =>
            onSetFormAction(AssetManagementActions.DischargeObligation)
          }
        >
          Discharge the bill
        </ObligationDropdownItem>
      )}
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
          Return {documentLabel} to issuer
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
          Accept {documentLabel} return
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
          Reject {documentLabel} return
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
