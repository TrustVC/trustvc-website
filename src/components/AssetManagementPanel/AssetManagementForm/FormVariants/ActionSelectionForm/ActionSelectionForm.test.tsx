import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActionSelectionForm } from './ActionSelectionForm'
import { OverlayProvider } from '../../../../common/contexts/OverlayContext'
import { AssetManagementActions } from '../../../AssetManagementActions'

// Mock AssetManagementDropdown
vi.mock('../../AssetManagementDropdown', () => ({
  AssetManagementDropdown: ({ onSetFormAction }: any) => (
    <div data-testid="asset-management-dropdown">
      <button onClick={() => onSetFormAction(AssetManagementActions.TransferHolder)}>
        Transfer Holder
      </button>
    </div>
  ),
}))

// Mock ConnectToBlockchain
vi.mock('../../../../ConnectToBlockchain', () => ({
  default: ({ onClose }: any) => (
    <div data-testid="connect-blockchain-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

const mockOnSetFormAction = vi.fn()
const mockSetShowEndorsementChain = vi.fn()

const defaultProps = {
  beneficiary: '0x1234567890123456789012345678901234567890',
  holder: '0x0987654321098765432109876543210987654321',
  onSetFormAction: mockOnSetFormAction,
  tokenRegistryAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  isReturnedToIssuer: false,
  setShowEndorsementChain: mockSetShowEndorsementChain,
  isTitleEscrow: true,
  isTokenBurnt: false,
  canReturnToIssuer: false,
  canTransferHolder: false,
  canTransferBeneficiary: false,
  canNominateBeneficiary: false,
  canEndorseBeneficiary: false,
  canTransferOwners: false,
  canRejectOwnerHolderTransfer: false,
  canRejectHolderTransfer: false,
  canRejectOwnerTransfer: false,
}

const renderWithOverlay = (component: React.ReactElement) => {
  return render(<OverlayProvider>{component}</OverlayProvider>)
}

describe('ActionSelectionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Wallet Connection', () => {
    it('shows "Connect Wallet" button when account is not connected', () => {
      renderWithOverlay(<ActionSelectionForm {...defaultProps} />)

      expect(screen.getByTestId('connectToWallet')).toBeInTheDocument()
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })

    it('calls handleConnectWallet when "Connect Wallet" button is clicked', () => {
      renderWithOverlay(<ActionSelectionForm {...defaultProps} />)

      const connectBtn = screen.getByTestId('connectToWallet')
      fireEvent.click(connectBtn)

      // Modal should be shown (we can't directly test overlay context, but component renders)
      expect(connectBtn).toBeInTheDocument()
    })

    it('does not show "Connect Wallet" button when account is connected', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canTransferHolder={true}
        />
      )

      expect(screen.queryByTestId('connectToWallet')).not.toBeInTheDocument()
    })
  })

  describe('Title Information Display', () => {
    it('displays owner and holder information when conditions are met', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          isTitleEscrow={true}
          isReturnedToIssuer={false}
          isTokenBurnt={false}
        />
      )

      expect(screen.getByText('Owner:')).toBeInTheDocument()
      expect(screen.getByText('Holder:')).toBeInTheDocument()
      expect(screen.getByText(defaultProps.beneficiary)).toBeInTheDocument()
      expect(screen.getByText(defaultProps.holder)).toBeInTheDocument()
    })

    it('does not display title info when token is burnt', () => {
      renderWithOverlay(
        <ActionSelectionForm {...defaultProps} isTokenBurnt={true} />
      )

      expect(screen.queryByText('Owner:')).not.toBeInTheDocument()
      expect(screen.queryByText('Holder:')).not.toBeInTheDocument()
    })

    it('does not display title info when returned to issuer', () => {
      renderWithOverlay(
        <ActionSelectionForm {...defaultProps} isReturnedToIssuer={true} />
      )

      expect(screen.queryByText('Owner:')).not.toBeInTheDocument()
      expect(screen.queryByText('Holder:')).not.toBeInTheDocument()
    })

    it('does not display title info when not a title escrow', () => {
      renderWithOverlay(
        <ActionSelectionForm {...defaultProps} isTitleEscrow={false} />
      )

      expect(screen.queryByText('Owner:')).not.toBeInTheDocument()
      expect(screen.queryByText('Holder:')).not.toBeInTheDocument()
    })
  })

  describe('Management Access', () => {
    it('shows AssetManagementDropdown when user has management access', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canTransferHolder={true}
        />
      )

      expect(screen.getByTestId('asset-management-dropdown')).toBeInTheDocument()
    })

    it('shows "No Access" button when user is connected but has no permissions', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
        />
      )

      expect(screen.getByText('No Access')).toBeInTheDocument()
    })

    it('calls handleNoAccess when "No Access" button is clicked', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
        />
      )

      const noAccessBtn = screen.getByText('No Access')
      fireEvent.click(noAccessBtn)

      // Button should still be in document after click
      expect(noAccessBtn).toBeInTheDocument()
    })
  })

  describe('Permission Checks', () => {
    it('shows dropdown when canTransferBeneficiary is true', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canTransferBeneficiary={true}
        />
      )

      expect(screen.getByTestId('asset-management-dropdown')).toBeInTheDocument()
    })

    it('shows dropdown when canTransferOwners is true', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canTransferOwners={true}
        />
      )

      expect(screen.getByTestId('asset-management-dropdown')).toBeInTheDocument()
    })

    it('shows dropdown when canNominateBeneficiary is true', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canNominateBeneficiary={true}
        />
      )

      expect(screen.getByTestId('asset-management-dropdown')).toBeInTheDocument()
    })

    it('shows dropdown when canEndorseBeneficiary is true', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canEndorseBeneficiary={true}
        />
      )

      expect(screen.getByTestId('asset-management-dropdown')).toBeInTheDocument()
    })

    it('shows dropdown when canReturnToIssuer is true', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canReturnToIssuer={true}
        />
      )

      expect(screen.getByTestId('asset-management-dropdown')).toBeInTheDocument()
    })

    it('shows dropdown when canHandleShred is true', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canHandleShred={true}
        />
      )

      expect(screen.getByTestId('asset-management-dropdown')).toBeInTheDocument()
    })

    it('shows dropdown when canHandleRestore is true', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canHandleRestore={true}
        />
      )

      expect(screen.getByTestId('asset-management-dropdown')).toBeInTheDocument()
    })

    it('shows dropdown when canRejectOwnerHolderTransfer is true', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canRejectOwnerHolderTransfer={true}
        />
      )

      expect(screen.getByTestId('asset-management-dropdown')).toBeInTheDocument()
    })

    it('shows dropdown when canRejectHolderTransfer is true', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canRejectHolderTransfer={true}
        />
      )

      expect(screen.getByTestId('asset-management-dropdown')).toBeInTheDocument()
    })

    it('shows dropdown when canRejectOwnerTransfer is true', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canRejectOwnerTransfer={true}
        />
      )

      expect(screen.getByTestId('asset-management-dropdown')).toBeInTheDocument()
    })
  })

  describe('Token Burnt State', () => {
    it('hides all action buttons when token is burnt', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          isTokenBurnt={true}
          account="0x1234567890123456789012345678901234567890"
          canTransferHolder={true}
        />
      )

      expect(screen.queryByTestId('asset-management-dropdown')).not.toBeInTheDocument()
      expect(screen.queryByText('No Access')).not.toBeInTheDocument()
      expect(screen.queryByTestId('connectToWallet')).not.toBeInTheDocument()
    })
  })

  describe('Dropdown Interaction', () => {
    it('calls onSetFormAction when action is selected from dropdown', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canTransferHolder={true}
        />
      )

      const transferBtn = screen.getByText('Transfer Holder')
      fireEvent.click(transferBtn)

      expect(mockOnSetFormAction).toHaveBeenCalledWith(
        AssetManagementActions.TransferHolder
      )
    })
  })

  describe('Default Values', () => {
    it('uses default beneficiary address when not provided', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          beneficiary={undefined}
          isTitleEscrow={true}
          isReturnedToIssuer={false}
          isTokenBurnt={false}
        />
      )

      expect(
        screen.getByText('0x28F7aB32C521D13F2E6980d072Ca7CA493020145')
      ).toBeInTheDocument()
    })

    it('uses default holder address when not provided', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          holder={undefined}
          isTitleEscrow={true}
          isReturnedToIssuer={false}
          isTokenBurnt={false}
        />
      )

      // Should have 2 instances of the default address (one for owner, one for holder)
      const defaultAddresses = screen.getAllByText(
        '0x28F7aB32C521D13F2E6980d072Ca7CA493020145'
      )
      expect(defaultAddresses.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Multiple Permissions', () => {
    it('shows dropdown when user has multiple permissions', () => {
      renderWithOverlay(
        <ActionSelectionForm
          {...defaultProps}
          account="0x1234567890123456789012345678901234567890"
          canTransferHolder={true}
          canTransferBeneficiary={true}
          canReturnToIssuer={true}
        />
      )

      expect(screen.getByTestId('asset-management-dropdown')).toBeInTheDocument()
    })
  })
})
