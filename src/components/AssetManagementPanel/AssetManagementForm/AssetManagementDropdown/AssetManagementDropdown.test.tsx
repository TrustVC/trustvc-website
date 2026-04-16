import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AssetManagementDropdown } from './AssetManagementDropdown'
import { AssetManagementActions } from '../../AssetManagementActions'

// Mock the Dropdown component
vi.mock('../../../Dropdown', () => ({
  Dropdown: ({ children, dropdownButtonText, 'data-testid': testId }: any) => (
    <div data-testid={testId}>
      <button data-testid="dropdown-button">{dropdownButtonText}</button>
      <div data-testid="dropdown-items">{children}</div>
    </div>
  ),
  DropdownItem: ({
    children,
    onClick,
    className,
    'data-testid': testId,
  }: any) => (
    <button data-testid={testId} onClick={onClick} className={className}>
      {children}
    </button>
  ),
}))

// Mock Spinner component
vi.mock('../../../common/Spinner', () => ({
  default: ({ label, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{label}</div>
  ),
}))

// Mock ButtonIcon component
vi.mock('../../../common/Button', () => ({
  ButtonIcon: ({ children, disabled, 'data-testid': testId }: any) => (
    <button data-testid={testId} disabled={disabled}>
      {children}
    </button>
  ),
}))

describe('AssetManagementDropdown', () => {
  const mockOnSetFormAction = vi.fn()

  const defaultProps = {
    onSetFormAction: mockOnSetFormAction,
    canReturnToIssuer: false,
    canHandleShred: false,
    canHandleRestore: false,
    canTransferHolder: false,
    canTransferBeneficiary: false,
    canNominateBeneficiary: false,
    canEndorseBeneficiary: false,
    canTransferOwners: false,
    canRejectOwnerHolderTransfer: false,
    canRejectOwnerTransfer: false,
    canRejectHolderTransfer: false,
    isRejectPendingConfirmation: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the dropdown with "Manage Assets" button', () => {
      render(<AssetManagementDropdown {...defaultProps} />)

      expect(screen.getByTestId('manageAssetDropdown')).toBeInTheDocument()
      expect(screen.getByTestId('dropdown-button')).toHaveTextContent(
        'Manage Assets'
      )
    })

    it('renders spinner when reject is pending confirmation', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          isRejectPendingConfirmation={true}
        />
      )

      expect(screen.getByTestId('rejectTransferBtn')).toBeInTheDocument()
      expect(screen.getByTestId('loader')).toBeInTheDocument()
      expect(screen.getByText(/Rejecting/)).toBeInTheDocument()
    })

    it('disables button when reject is pending confirmation', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          isRejectPendingConfirmation={true}
        />
      )

      const button = screen.getByTestId('rejectTransferBtn')
      expect(button).toBeDisabled()
    })
  })

  describe('Transfer Holder Actions', () => {
    it('renders transfer holder option when canTransferHolder is true', () => {
      render(
        <AssetManagementDropdown {...defaultProps} canTransferHolder={true} />
      )

      expect(screen.getByTestId('transferHolderDropdown')).toBeInTheDocument()
      expect(screen.getByText('Transfer holdership')).toBeInTheDocument()
    })

    it('does not render transfer holder option when canTransferHolder is false', () => {
      render(<AssetManagementDropdown {...defaultProps} />)

      expect(
        screen.queryByTestId('transferHolderDropdown')
      ).not.toBeInTheDocument()
    })

    it('calls onSetFormAction with TransferHolder when clicked', () => {
      render(
        <AssetManagementDropdown {...defaultProps} canTransferHolder={true} />
      )

      fireEvent.click(screen.getByTestId('transferHolderDropdown'))

      expect(mockOnSetFormAction).toHaveBeenCalledWith(
        AssetManagementActions.TransferHolder
      )
      expect(mockOnSetFormAction).toHaveBeenCalledTimes(1)
    })
  })

  describe('Transfer Beneficiary Actions', () => {
    it('renders transfer ownership option when canTransferBeneficiary is true', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canTransferBeneficiary={true}
        />
      )

      expect(screen.getByTestId('transferOwnerDropdown')).toBeInTheDocument()
      expect(screen.getByText('Transfer ownership')).toBeInTheDocument()
    })

    it('calls onSetFormAction with TransferOwner when clicked', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canTransferBeneficiary={true}
        />
      )

      fireEvent.click(screen.getByTestId('transferOwnerDropdown'))

      expect(mockOnSetFormAction).toHaveBeenCalledWith(
        AssetManagementActions.TransferOwner
      )
    })
  })

  describe('Nominate Beneficiary Actions', () => {
    it('renders nominate beneficiary option when canNominateBeneficiary is true', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canNominateBeneficiary={true}
        />
      )

      expect(
        screen.getByTestId('nominateBeneficiaryHolderDropdown')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Nominate transfer ownership')
      ).toBeInTheDocument()
    })

    it('calls onSetFormAction with NominateBeneficiary when clicked', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canNominateBeneficiary={true}
        />
      )

      fireEvent.click(screen.getByTestId('nominateBeneficiaryHolderDropdown'))

      expect(mockOnSetFormAction).toHaveBeenCalledWith(
        AssetManagementActions.NominateBeneficiary
      )
    })
  })

  describe('Endorse Beneficiary Actions', () => {
    it('renders endorse beneficiary option when canEndorseBeneficiary is true and canTransferBeneficiary is false', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canEndorseBeneficiary={true}
          canTransferBeneficiary={false}
        />
      )

      expect(
        screen.getByTestId('endorseBeneficiaryDropdown')
      ).toBeInTheDocument()
      expect(screen.getByText('Endorse transfer ownership')).toBeInTheDocument()
    })

    it('does not render endorse beneficiary option when canTransferBeneficiary is true', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canEndorseBeneficiary={true}
          canTransferBeneficiary={true}
        />
      )

      expect(
        screen.queryByTestId('endorseBeneficiaryDropdown')
      ).not.toBeInTheDocument()
    })

    it('calls onSetFormAction with EndorseBeneficiary when clicked', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canEndorseBeneficiary={true}
          canTransferBeneficiary={false}
        />
      )

      fireEvent.click(screen.getByTestId('endorseBeneficiaryDropdown'))

      expect(mockOnSetFormAction).toHaveBeenCalledWith(
        AssetManagementActions.EndorseBeneficiary
      )
    })
  })

  describe('Transfer Owners Actions', () => {
    it('renders transfer ownership and holdership option when canTransferOwners is true', () => {
      render(
        <AssetManagementDropdown {...defaultProps} canTransferOwners={true} />
      )

      expect(screen.getByTestId('endorseTransferDropdown')).toBeInTheDocument()
      expect(
        screen.getByText('Transfer ownership and holdership')
      ).toBeInTheDocument()
    })

    it('calls onSetFormAction with TransferOwnerHolder when clicked', () => {
      render(
        <AssetManagementDropdown {...defaultProps} canTransferOwners={true} />
      )

      fireEvent.click(screen.getByTestId('endorseTransferDropdown'))

      expect(mockOnSetFormAction).toHaveBeenCalledWith(
        AssetManagementActions.TransferOwnerHolder
      )
    })
  })

  describe('Return to Issuer Actions', () => {
    it('renders return to issuer option when canReturnToIssuer is true', () => {
      render(
        <AssetManagementDropdown {...defaultProps} canReturnToIssuer={true} />
      )

      expect(screen.getByTestId('surrenderDropdown')).toBeInTheDocument()
      expect(screen.getByText('Return ETR to issuer')).toBeInTheDocument()
    })

    it('calls onSetFormAction with ReturnToIssuer when clicked', () => {
      render(
        <AssetManagementDropdown {...defaultProps} canReturnToIssuer={true} />
      )

      fireEvent.click(screen.getByTestId('surrenderDropdown'))

      expect(mockOnSetFormAction).toHaveBeenCalledWith(
        AssetManagementActions.ReturnToIssuer
      )
    })
  })

  describe('Accept Return Actions', () => {
    it('renders accept return option when canHandleShred is true', () => {
      render(
        <AssetManagementDropdown {...defaultProps} canHandleShred={true} />
      )

      expect(screen.getByTestId('acceptSurrenderDropdown')).toBeInTheDocument()
      expect(screen.getByText('Accept ETR return')).toBeInTheDocument()
    })

    it('calls onSetFormAction with AcceptReturnToIssuer when clicked', () => {
      render(
        <AssetManagementDropdown {...defaultProps} canHandleShred={true} />
      )

      fireEvent.click(screen.getByTestId('acceptSurrenderDropdown'))

      expect(mockOnSetFormAction).toHaveBeenCalledWith(
        AssetManagementActions.AcceptReturnToIssuer
      )
    })
  })

  describe('Reject Return Actions', () => {
    it('renders reject return option when canHandleRestore is true', () => {
      render(
        <AssetManagementDropdown {...defaultProps} canHandleRestore={true} />
      )

      expect(screen.getByTestId('rejectSurrenderDropdown')).toBeInTheDocument()
      expect(screen.getByText('Reject ETR return')).toBeInTheDocument()
    })

    it('calls onSetFormAction with RejectReturnToIssuer when clicked', () => {
      render(
        <AssetManagementDropdown {...defaultProps} canHandleRestore={true} />
      )

      fireEvent.click(screen.getByTestId('rejectSurrenderDropdown'))

      expect(mockOnSetFormAction).toHaveBeenCalledWith(
        AssetManagementActions.RejectReturnToIssuer
      )
    })
  })

  describe('Reject Transfer Actions', () => {
    it('renders reject ownership and holdership option when canRejectOwnerHolderTransfer is true', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canRejectOwnerHolderTransfer={true}
        />
      )

      expect(
        screen.getByTestId('rejectTransferOwnerHolderDropdown')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Reject ownership and holdership')
      ).toBeInTheDocument()
    })

    it('calls onSetFormAction with RejectTransferOwnerHolder when clicked', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canRejectOwnerHolderTransfer={true}
        />
      )

      fireEvent.click(screen.getByTestId('rejectTransferOwnerHolderDropdown'))

      expect(mockOnSetFormAction).toHaveBeenCalledWith(
        AssetManagementActions.RejectTransferOwnerHolder
      )
    })

    it('renders reject ownership option when canRejectOwnerTransfer is true', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canRejectOwnerTransfer={true}
        />
      )

      expect(
        screen.getByTestId('rejectTransferOwnerDropdown')
      ).toBeInTheDocument()
      expect(screen.getByText('Reject ownership')).toBeInTheDocument()
    })

    it('calls onSetFormAction with RejectTransferOwner when clicked', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canRejectOwnerTransfer={true}
        />
      )

      fireEvent.click(screen.getByTestId('rejectTransferOwnerDropdown'))

      expect(mockOnSetFormAction).toHaveBeenCalledWith(
        AssetManagementActions.RejectTransferOwner
      )
    })

    it('renders reject holdership option when canRejectHolderTransfer is true', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canRejectHolderTransfer={true}
        />
      )

      expect(
        screen.getByTestId('rejectTransferHolderDropdown')
      ).toBeInTheDocument()
      expect(screen.getByText('Reject holdership')).toBeInTheDocument()
    })

    it('calls onSetFormAction with RejectTransferHolder when clicked', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canRejectHolderTransfer={true}
        />
      )

      fireEvent.click(screen.getByTestId('rejectTransferHolderDropdown'))

      expect(mockOnSetFormAction).toHaveBeenCalledWith(
        AssetManagementActions.RejectTransferHolder
      )
    })
  })

  describe('Multiple Options Rendering', () => {
    it('renders multiple options when multiple permissions are true', () => {
      render(
        <AssetManagementDropdown
          {...defaultProps}
          canTransferHolder={true}
          canTransferBeneficiary={true}
          canReturnToIssuer={true}
        />
      )

      expect(screen.getByTestId('transferHolderDropdown')).toBeInTheDocument()
      expect(screen.getByTestId('transferOwnerDropdown')).toBeInTheDocument()
      expect(screen.getByTestId('surrenderDropdown')).toBeInTheDocument()
    })

    it('renders no dropdown items when all permissions are false', () => {
      render(<AssetManagementDropdown {...defaultProps} />)

      expect(
        screen.queryByTestId('transferHolderDropdown')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('transferOwnerDropdown')
      ).not.toBeInTheDocument()
      expect(screen.queryByTestId('surrenderDropdown')).not.toBeInTheDocument()
    })
  })

  describe('CSS Classes', () => {
    it('applies correct className to dropdown items', () => {
      render(
        <AssetManagementDropdown {...defaultProps} canTransferHolder={true} />
      )

      const dropdownItem = screen.getByTestId('transferHolderDropdown')
      expect(dropdownItem).toHaveClass('dropdown-item-btn')
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid clicks on dropdown items', () => {
      render(
        <AssetManagementDropdown {...defaultProps} canTransferHolder={true} />
      )

      const dropdownItem = screen.getByTestId('transferHolderDropdown')

      fireEvent.click(dropdownItem)
      fireEvent.click(dropdownItem)
      fireEvent.click(dropdownItem)

      expect(mockOnSetFormAction).toHaveBeenCalledTimes(3)
    })

    it('renders all action types when all permissions are enabled', () => {
      const allPermissionsProps = {
        ...defaultProps,
        canReturnToIssuer: true,
        canHandleShred: true,
        canHandleRestore: true,
        canTransferHolder: true,
        canTransferBeneficiary: true,
        canNominateBeneficiary: true,
        canTransferOwners: true,
        canRejectOwnerHolderTransfer: true,
        canRejectOwnerTransfer: true,
        canRejectHolderTransfer: true,
      }

      render(<AssetManagementDropdown {...allPermissionsProps} />)

      expect(screen.getByTestId('transferHolderDropdown')).toBeInTheDocument()
      expect(screen.getByTestId('transferOwnerDropdown')).toBeInTheDocument()
      expect(
        screen.getByTestId('nominateBeneficiaryHolderDropdown')
      ).toBeInTheDocument()
      expect(screen.getByTestId('endorseTransferDropdown')).toBeInTheDocument()
      expect(screen.getByTestId('surrenderDropdown')).toBeInTheDocument()
      expect(screen.getByTestId('acceptSurrenderDropdown')).toBeInTheDocument()
      expect(screen.getByTestId('rejectSurrenderDropdown')).toBeInTheDocument()
      expect(
        screen.getByTestId('rejectTransferOwnerHolderDropdown')
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('rejectTransferOwnerDropdown')
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('rejectTransferHolderDropdown')
      ).toBeInTheDocument()
    })
  })
})
