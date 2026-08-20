import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActionSelectionForm } from './ActionSelectionForm'
import { OverlayProvider } from '../../../../common/contexts/OverlayContext'
import { ObligationDocumentStatus } from '../../../../../constants'

const mockUseIsObligation = vi.hoisted(() => vi.fn(() => false))

vi.mock('../../../../../hooks/useIsObligation', () => ({
  useIsObligation: () => mockUseIsObligation(),
}))

vi.mock('../../AssetManagementDropdown', () => ({
  AssetManagementDropdown: () => (
    <div data-testid="asset-management-dropdown">Manage</div>
  ),
}))

vi.mock('../../../../ConnectToBlockchain', () => ({
  default: () => <div data-testid="connect-blockchain-modal" />,
}))

const defaultProps = {
  beneficiary: '0x1234567890123456789012345678901234567890',
  holder: '0x0987654321098765432109876543210987654321',
  onSetFormAction: vi.fn(),
  tokenRegistryAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  account: '0x1234567890123456789012345678901234567890',
  isReturnedToIssuer: false,
  setShowEndorsementChain: vi.fn(),
  isTitleEscrow: true,
  isTokenBurnt: false,
  canReturnToIssuer: false,
  canTransferHolder: true,
  canTransferBeneficiary: false,
  canNominateBeneficiary: false,
  canEndorseBeneficiary: false,
  canTransferOwners: false,
  canRejectOwnerHolderTransfer: false,
  canRejectHolderTransfer: false,
  canRejectOwnerTransfer: false,
}

const renderWithOverlay = (ui: React.ReactElement) =>
  render(<OverlayProvider>{ui}</OverlayProvider>)

describe('ActionSelectionForm — BoE / obligation registry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsObligation.mockReturnValue(true)
  })

  it('shows obligation status for BoE documents', () => {
    renderWithOverlay(
      <ActionSelectionForm
        {...defaultProps}
        obligationStatus={ObligationDocumentStatus.Accepted}
      />
    )

    expect(screen.getByText('Status:')).toBeInTheDocument()
    expect(screen.getByTestId('asset-title-status')).toBeInTheDocument()
    expect(screen.getByTestId('obligationStatus')).toHaveTextContent('Accepted')
  })

  it('labels returned-to-issuer banner as BoE', () => {
    renderWithOverlay(
      <ActionSelectionForm
        {...defaultProps}
        isReturnedToIssuer={true}
        canTransferHolder={false}
      />
    )

    expect(screen.getByText('BoE Returned to Issuer')).toBeInTheDocument()
  })

  it('labels burnt banner as BoE for return-to-issuer shred', () => {
    renderWithOverlay(
      <ActionSelectionForm
        {...defaultProps}
        isTokenBurnt={true}
        canTransferHolder={false}
        obligationStatus={ObligationDocumentStatus.Accepted}
      />
    )

    expect(screen.getByText('BoE Taken Out of Circulation')).toBeInTheDocument()
  })

  it('labels burnt banner as Bill rejected after reject', () => {
    renderWithOverlay(
      <ActionSelectionForm
        {...defaultProps}
        isTokenBurnt={true}
        canTransferHolder={false}
        obligationStatus={ObligationDocumentStatus.Rejected}
      />
    )

    expect(screen.getByText('Bill rejected')).toBeInTheDocument()
    expect(
      screen.queryByText('BoE Taken Out of Circulation')
    ).not.toBeInTheDocument()
  })

  it('labels burnt banner as Bill discharged after discharge', () => {
    renderWithOverlay(
      <ActionSelectionForm
        {...defaultProps}
        isTokenBurnt={true}
        canTransferHolder={false}
        obligationStatus={ObligationDocumentStatus.Discharged}
      />
    )

    expect(screen.getByText('Bill discharged')).toBeInTheDocument()
  })

  it('does not show obligation status for classic ETR', () => {
    mockUseIsObligation.mockReturnValue(false)

    renderWithOverlay(
      <ActionSelectionForm
        {...defaultProps}
        obligationStatus={ObligationDocumentStatus.Accepted}
      />
    )

    expect(screen.queryByText('Status:')).not.toBeInTheDocument()
    expect(screen.queryByText('Accepted')).not.toBeInTheDocument()
  })
})
