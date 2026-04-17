import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AssetManagementForm } from './AssetManagementForm'
import { AssetManagementActions } from '../AssetManagementActions'
import { TokenRegistryVersions } from '../../../constants'
import { FormState } from '../../../utils/common/FormState'
import { InitialAddress } from '../../../utils/chain-info'

const { mockUseTokenRegistryVersion, mockActionSelectionForm, mockActionForm } =
  vi.hoisted(() => ({
    mockUseTokenRegistryVersion: vi.fn(),
    mockActionSelectionForm: vi.fn(),
    mockActionForm: vi.fn(),
  }))

vi.mock('../../../hooks/useTokenRegistryVersion', () => ({
  useTokenRegistryVersion: () => mockUseTokenRegistryVersion(),
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
    beneficiaryEndorseState: FormState.UNINITIALIZED,
    nominateBeneficiary: vi.fn(),
    nominateBeneficiaryState: FormState.UNINITIALIZED,
    transferOwners: vi.fn(),
    transferOwnersState: FormState.UNINITIALIZED,
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

  it('enables reject holdership only for token registry v5 after holder transfer context', () => {
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
    render(<AssetManagementForm {...baseProps} prevBeneficiary={undefined} />)

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
})
