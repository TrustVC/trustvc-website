import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AssetManagementForm } from './AssetManagementForm'
import { AssetManagementActions } from '../AssetManagementActions'
import {
  TokenRegistryVersions,
  ObligationDocumentStatus,
} from '../../../constants'
import { FormState } from '../../../utils/common/FormState'
import { InitialAddress } from '../../../utils/chain-info'

const {
  mockUseTokenRegistryVersion,
  mockUseIsObligation,
  mockActionSelectionForm,
  mockActionForm,
} = vi.hoisted(() => ({
  mockUseTokenRegistryVersion: vi.fn(),
  mockUseIsObligation: vi.fn(() => false),
  mockActionSelectionForm: vi.fn(),
  mockActionForm: vi.fn(),
}))

vi.mock('../../../hooks/useTokenRegistryVersion', () => ({
  useTokenRegistryVersion: () => mockUseTokenRegistryVersion(),
}))

vi.mock('../../../hooks/useIsObligation', () => ({
  useIsObligation: () => mockUseIsObligation(),
}))

vi.mock('./FormVariants/ActionSelectionForm', () => ({
  ActionSelectionForm: (props: any) => {
    mockActionSelectionForm(props)
    return <div data-testid="action-selection-form" />
  },
}))

vi.mock('./FormVariants/ActionForm', () => ({
  ActionForm: (props: any) => {
    mockActionForm(props)
    return (
      <div data-testid="action-form">
        <button onClick={props.setFormActionNone}>
          Call setFormActionNone
        </button>
      </div>
    )
  },
}))

describe('AssetManagementForm', () => {
  const mockOnSetFormAction = vi.fn()
  const mockSetShowEndorsementChain = vi.fn()
  const mockRejectTransferOwnerHolder = vi.fn()

  const baseProps = {
    beneficiary: '0x1234567890123456789012345678901234567890',
    holder: '0x1234567890123456789012345678901234567890',
    nominee: undefined,
    prevBeneficiary: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    prevHolder: '0x1111111111111111111111111111111111111111',
    account: '0x1234567890123456789012345678901234567890',
    formAction: AssetManagementActions.None,
    tokenRegistryAddress: '0xTokenRegistry',
    onSetFormAction: mockOnSetFormAction,
    isRestorer: false,
    isAcceptor: false,
    isReturnedToIssuer: false,
    isTokenBurnt: false,
    setShowEndorsementChain: mockSetShowEndorsementChain,
    refreshEndorsementChain: vi.fn(),
    isTitleEscrow: true,
    isExpired: false,
    onTransferHolder: vi.fn(),
    holderTransferringState: FormState.UNINITIALIZED,
    onEndorseBeneficiary: vi.fn(),
    endorseBeneficiaryState: FormState.UNINITIALIZED,
    nominateBeneficiary: vi.fn(),
    nominateBeneficiaryState: FormState.UNINITIALIZED,
    transferOwners: vi.fn(),
    transferOwnerHoldersState: FormState.UNINITIALIZED,
    rejectTransferOwnerHolder: mockRejectTransferOwnerHolder,
    rejectTransferOwnerHolderState: FormState.UNINITIALIZED,
    rejectTransferOwner: vi.fn(),
    rejectTransferOwnerState: FormState.UNINITIALIZED,
    rejectTransferHolder: vi.fn(),
    rejectTransferHolderState: FormState.UNINITIALIZED,
    onReturnToIssuer: vi.fn(),
    returnToIssuerState: FormState.UNINITIALIZED,
    onDestroyToken: vi.fn(),
    destroyTokenState: FormState.UNINITIALIZED,
    onRestoreToken: vi.fn(),
    restoreTokenState: FormState.UNINITIALIZED,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsObligation.mockReturnValue(false)
  })

  it('enables reject ownership and holdership only for token registry v5', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
    render(<AssetManagementForm {...baseProps} />)

    expect(mockActionSelectionForm).toHaveBeenCalledWith(
      expect.objectContaining({
        canRejectOwnerHolderTransfer: true,
      })
    )
  })

  it('disables reject holdership when holder and beneficiary are the same account (isHolderAndBeneficiary)', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
    // baseProps has beneficiary === holder === account, so isHolderAndBeneficiary=true
    render(<AssetManagementForm {...baseProps} prevBeneficiary={undefined} />)

    expect(mockActionSelectionForm).toHaveBeenCalledWith(
      expect.objectContaining({
        canRejectHolderTransfer: false,
      })
    )
  })

  it('enables reject holdership for token registry v5 when holder differs from beneficiary', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
    // Different beneficiary means isHolderAndBeneficiary=false, so canRejectHolderTransfer can be true
    render(
      <AssetManagementForm
        {...baseProps}
        beneficiary="0xDEADBEEFdeadbeefdeadbeefdeadbeefdeadbeef"
        prevBeneficiary={undefined}
      />
    )

    expect(mockActionSelectionForm).toHaveBeenCalledWith(
      expect.objectContaining({
        canRejectHolderTransfer: true,
      })
    )
  })

  it('disables reject holdership for token registry v4', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V4)
    render(<AssetManagementForm {...baseProps} prevBeneficiary={undefined} />)

    expect(mockActionSelectionForm).toHaveBeenCalledWith(
      expect.objectContaining({
        canRejectHolderTransfer: false,
      })
    )
  })

  it('disables reject ownership and holdership for token registry v4', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V4)
    render(<AssetManagementForm {...baseProps} />)

    expect(mockActionSelectionForm).toHaveBeenCalledWith(
      expect.objectContaining({
        canRejectOwnerHolderTransfer: false,
      })
    )
  })

  it('disables reject ownership and holdership when previous addresses are missing', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
    render(
      <AssetManagementForm
        {...baseProps}
        prevBeneficiary={undefined}
        prevHolder={undefined}
      />
    )

    expect(mockActionSelectionForm).toHaveBeenCalledWith(
      expect.objectContaining({
        canRejectOwnerHolderTransfer: false,
      })
    )
  })

  it('disables reject ownership and holdership when previous addresses are initial address', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
    render(
      <AssetManagementForm
        {...baseProps}
        prevBeneficiary={InitialAddress}
        prevHolder={InitialAddress}
      />
    )

    expect(mockActionSelectionForm).toHaveBeenCalledWith(
      expect.objectContaining({
        canRejectOwnerHolderTransfer: false,
      })
    )
  })

  it('disables reject holdership when previous holder is missing', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
    render(
      <AssetManagementForm
        {...baseProps}
        prevBeneficiary={undefined}
        prevHolder={undefined}
      />
    )

    expect(mockActionSelectionForm).toHaveBeenCalledWith(
      expect.objectContaining({
        canRejectHolderTransfer: false,
      })
    )
  })

  it('renders reject owner and holder action form with previous accounts', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
    render(
      <AssetManagementForm
        {...baseProps}
        formAction={AssetManagementActions.RejectTransferOwnerHolder}
      />
    )

    expect(screen.getByTestId('action-form')).toBeInTheDocument()
    expect(mockActionForm).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AssetManagementActions.RejectTransferOwnerHolder,
        prevBeneficiary: baseProps.prevBeneficiary,
        prevHolder: baseProps.prevHolder,
        handleRejectTransferOwnerHolder: mockRejectTransferOwnerHolder,
        rejectTransferOwnerHolderState: FormState.UNINITIALIZED,
      })
    )
  })

  it('renders reject holder action form with previous holder account', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
    render(
      <AssetManagementForm
        {...baseProps}
        prevBeneficiary={undefined}
        formAction={AssetManagementActions.RejectTransferHolder}
      />
    )

    expect(screen.getByTestId('action-form')).toBeInTheDocument()
    expect(mockActionForm).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AssetManagementActions.RejectTransferHolder,
        prevHolder: baseProps.prevHolder,
        rejectTransferHolderState: FormState.UNINITIALIZED,
      })
    )
  })

  it('renders reject owner action form with previous owner account', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
    const mockRejectTransferOwner = vi.fn()
    render(
      <AssetManagementForm
        {...baseProps}
        rejectTransferOwner={mockRejectTransferOwner}
        formAction={AssetManagementActions.RejectTransferOwner}
      />
    )

    expect(screen.getByTestId('action-form')).toBeInTheDocument()
    expect(mockActionForm).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AssetManagementActions.RejectTransferOwner,
        prevBeneficiary: baseProps.prevBeneficiary,
        handleRejectTransferOwner: mockRejectTransferOwner,
        rejectTransferOwnerState: FormState.UNINITIALIZED,
      })
    )
  })

  it('prevents setFormActionNone while reject owner and holder is pending confirmation', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
    render(
      <AssetManagementForm
        {...baseProps}
        formAction={AssetManagementActions.RejectTransferOwnerHolder}
        rejectTransferOwnerHolderState={FormState.PENDING_CONFIRMATION}
      />
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Call setFormActionNone' })
    )
    expect(mockOnSetFormAction).not.toHaveBeenCalled()
  })

  it('allows setFormActionNone when reject owner and holder is not pending', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
    render(
      <AssetManagementForm
        {...baseProps}
        formAction={AssetManagementActions.RejectTransferOwnerHolder}
        rejectTransferOwnerHolderState={FormState.UNINITIALIZED}
      />
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Call setFormActionNone' })
    )
    expect(mockOnSetFormAction).toHaveBeenCalledWith(
      AssetManagementActions.None
    )
  })

  // BoE Issued — same Manage Assets options as classic TitleEscrow
  // (master Storybook: BeneficiaryAndHolder / Holder / Beneficiary).
  describe('BoE Issued state (classic ETR parity)', () => {
    const dualRole = '0x1234567890123456789012345678901234567890'
    const other = '0xDEADBEEFdeadbeefdeadbeefdeadbeefdeadbeef'

    beforeEach(() => {
      mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
      mockUseIsObligation.mockReturnValue(true)
    })

    it('Issued dual-role matches BeneficiaryAndHolder: transfer + return, no accept/reject', () => {
      render(
        <AssetManagementForm
          {...baseProps}
          account={dualRole}
          beneficiary={dualRole}
          holder={dualRole}
          obligationStatus={ObligationDocumentStatus.Issued}
        />
      )

      expect(mockActionSelectionForm).toHaveBeenCalledWith(
        expect.objectContaining({
          canTransferHolder: true,
          canTransferBeneficiary: true,
          canTransferOwners: true,
          canReturnToIssuer: true,
          canNominateBeneficiary: false,
          canAcceptObligation: false,
          canRejectObligation: false,
          canDischargeObligation: false,
        })
      )
    })

    it('Issued holder-only matches Holder: transfer holdership + accept/reject', () => {
      render(
        <AssetManagementForm
          {...baseProps}
          account={dualRole}
          beneficiary={other}
          holder={dualRole}
          obligationStatus={ObligationDocumentStatus.Issued}
        />
      )

      expect(mockActionSelectionForm).toHaveBeenCalledWith(
        expect.objectContaining({
          canTransferHolder: true,
          canTransferBeneficiary: false,
          canTransferOwners: false,
          canReturnToIssuer: false,
          canAcceptObligation: true,
          canRejectObligation: true,
          canDischargeObligation: false,
        })
      )
    })

    it('Issued beneficiary-only matches Beneficiary: nominate ownership', () => {
      render(
        <AssetManagementForm
          {...baseProps}
          account={dualRole}
          beneficiary={dualRole}
          holder={other}
          obligationStatus={ObligationDocumentStatus.Issued}
        />
      )

      expect(mockActionSelectionForm).toHaveBeenCalledWith(
        expect.objectContaining({
          canNominateBeneficiary: true,
          canTransferHolder: false,
          canReturnToIssuer: false,
          canAcceptObligation: false,
          canRejectObligation: false,
          canDischargeObligation: false,
        })
      )
    })

    it('matches dual-role when account checksum casing differs from escrow addresses', () => {
      render(
        <AssetManagementForm
          {...baseProps}
          account={dualRole.toUpperCase()}
          beneficiary={dualRole.toLowerCase()}
          holder={dualRole.toLowerCase()}
          obligationStatus={ObligationDocumentStatus.Issued}
        />
      )

      expect(mockActionSelectionForm).toHaveBeenCalledWith(
        expect.objectContaining({
          canTransferHolder: true,
          canTransferOwners: true,
          canReturnToIssuer: true,
        })
      )
    })
  })
})
