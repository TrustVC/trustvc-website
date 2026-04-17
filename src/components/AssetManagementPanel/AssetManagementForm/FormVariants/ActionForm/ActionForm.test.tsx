import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ActionForm } from './ActionForm'
import { AssetManagementActions } from '../../../AssetManagementActions'
import { FormState } from '../../../../../utils/common/FormState'
import { OverlayProvider } from '../../../../common/contexts/OverlayContext'

// Mock EditableAssetTitle component
vi.mock('./../EditableAssetTitle', () => ({
  EditableAssetTitle: ({
    role,
    value,
    newValue,
    isEditable,
    onSetNewValue,
    isRemark,
  }: any) => (
    <div>
      <span>{role}</span>
      <span>{value}</span>
      {isEditable && onSetNewValue ? (
        <input
          type="text"
          value={newValue !== undefined ? newValue : value}
          onChange={e => onSetNewValue(e.target.value)}
          placeholder={isRemark ? 'Enter remark' : ''}
        />
      ) : (
        <span>{newValue !== undefined ? newValue : value}</span>
      )}
    </div>
  ),
}))

// Mock the helper functions
vi.mock('../../../../../utils/helper', () => ({
  isEthereumAddress: (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  },
}))

const mockSetFormActionNone = vi.fn()
const mockSetShowEndorsementChain = vi.fn()

const defaultProps = {
  beneficiary: '0x1234567890123456789012345678901234567890',
  holder: '0x0987654321098765432109876543210987654321',
  setFormActionNone: mockSetFormActionNone,
  setShowEndorsementChain: mockSetShowEndorsementChain,
}

const renderWithOverlay = (component: React.ReactElement) => {
  return render(<OverlayProvider>{component}</OverlayProvider>)
}

describe('ActionForm - TransferHolder', () => {
  const mockHandleTransfer = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders TransferHolder form correctly', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Holder')).toBeInTheDocument()
    expect(screen.getAllByText('Remark').length).toBeGreaterThan(0)
    expect(screen.getByTestId('cancelTransferBtn')).toBeInTheDocument()
    expect(screen.getByTestId('transferBtn')).toBeInTheDocument()
  })

  it('displays beneficiary and holder addresses', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.UNINITIALIZED}
      />
    )

    expect(
      screen.getAllByText(defaultProps.beneficiary).length
    ).toBeGreaterThan(0)
    expect(screen.getByDisplayValue(defaultProps.holder)).toBeInTheDocument()
  })

  it('disables transfer button when holder address is invalid', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.UNINITIALIZED}
      />
    )

    const transferBtn = screen.getByTestId('transferBtn')
    expect(transferBtn).toBeDisabled()
  })

  it('enables transfer button when valid holder address is entered', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.UNINITIALIZED}
      />
    )

    const holderInput = screen.getByDisplayValue(defaultProps.holder)
    const newHolderAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

    fireEvent.change(holderInput, { target: { value: newHolderAddress } })

    await waitFor(() => {
      const transferBtn = screen.getByTestId('transferBtn')
      expect(transferBtn).not.toBeDisabled()
    })
  })

  it('calls handleTransfer with correct parameters when transfer button is clicked', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.UNINITIALIZED}
      />
    )

    const holderInput = screen.getByDisplayValue(defaultProps.holder)
    const newHolderAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

    fireEvent.change(holderInput, { target: { value: newHolderAddress } })

    await waitFor(() => {
      const transferBtn = screen.getByTestId('transferBtn')
      expect(transferBtn).not.toBeDisabled()
    })

    const transferBtn = screen.getByTestId('transferBtn')
    fireEvent.click(transferBtn)

    expect(mockHandleTransfer).toHaveBeenCalledWith({
      holderAddress: newHolderAddress,
      remarks: '',
    })
  })

  it('shows loading state when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByText('Transferring..')).toBeInTheDocument()
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('disables buttons when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByTestId('cancelTransferBtn')).toBeDisabled()
    expect(screen.getByTestId('transferBtn')).toBeDisabled()
  })

  it('calls setFormActionNone when cancel button is clicked', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.UNINITIALIZED}
      />
    )

    const cancelBtn = screen.getByTestId('cancelTransferBtn')
    fireEvent.click(cancelBtn)

    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('includes remark when provided', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.UNINITIALIZED}
      />
    )

    const holderInput = screen.getByDisplayValue(defaultProps.holder)
    const newHolderAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

    fireEvent.change(holderInput, { target: { value: newHolderAddress } })

    // Find and update remark input
    const remarkInputs = screen.getAllByRole('textbox')
    const remarkInput = remarkInputs.find(
      input => input.getAttribute('placeholder') === 'Enter remark'
    )

    if (remarkInput) {
      fireEvent.change(remarkInput, { target: { value: 'Test remark' } })
    }

    const transferBtn = await waitFor(() => {
      const btn = screen.getByTestId('transferBtn')
      expect(btn).toBeEnabled()
      return btn
    })

    fireEvent.click(transferBtn)

    expect(mockHandleTransfer).toHaveBeenCalledWith({
      holderAddress: newHolderAddress,
      remarks: 'Test remark',
    })
  })
})

describe('ActionForm - TransferOwner', () => {
  const mockHandleBeneficiaryTransfer = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders TransferOwner form correctly', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferOwner}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        beneficiaryEndorseState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Holder')).toBeInTheDocument()
    expect(screen.getByTestId('transferBtn')).toBeInTheDocument()
  })

  it('enables transfer button when valid owner address is entered', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferOwner}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        beneficiaryEndorseState={FormState.UNINITIALIZED}
      />
    )

    const inputs = screen.getAllByRole('textbox')
    const ownerInput = inputs[0] // First input is owner
    const newOwnerAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

    fireEvent.change(ownerInput, { target: { value: newOwnerAddress } })

    await waitFor(() => {
      const transferBtn = screen.getByTestId('transferBtn')
      expect(transferBtn).not.toBeDisabled()
    })
  })

  it('calls handleBeneficiaryTransfer with correct parameters', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferOwner}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        beneficiaryEndorseState={FormState.UNINITIALIZED}
      />
    )

    const inputs = screen.getAllByRole('textbox')
    const ownerInput = inputs[0] // First input is owner
    const newOwnerAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

    fireEvent.change(ownerInput, { target: { value: newOwnerAddress } })

    const transferBtn = await waitFor(() => {
      const btn = screen.getByTestId('transferBtn')
      expect(btn).toBeEnabled()
      return btn
    })

    fireEvent.click(transferBtn)

    expect(mockHandleBeneficiaryTransfer).toHaveBeenCalledWith({
      newBeneficiaryAddress: newOwnerAddress,
      remarks: '',
    })
  })

  it('shows loading state when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferOwner}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        beneficiaryEndorseState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByText('Transferring..')).toBeInTheDocument()
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })
})

describe('ActionForm - TransferOwnerHolder', () => {
  const mockHandleEndorseTransfer = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders TransferOwnerHolder form correctly', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferOwnerHolder}
        handleEndorseTransfer={mockHandleEndorseTransfer}
        transferOwnersState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Holder')).toBeInTheDocument()
    expect(screen.getByTestId('endorseTransferBtn')).toBeInTheDocument()
  })

  it('disables transfer button when addresses are invalid', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferOwnerHolder}
        handleEndorseTransfer={mockHandleEndorseTransfer}
        transferOwnersState={FormState.UNINITIALIZED}
      />
    )

    const transferBtn = screen.getByTestId('endorseTransferBtn')
    expect(transferBtn).toBeDisabled()
  })

  it('enables transfer button when both valid addresses are entered', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferOwnerHolder}
        handleEndorseTransfer={mockHandleEndorseTransfer}
        transferOwnersState={FormState.UNINITIALIZED}
      />
    )

    const inputs = screen.getAllByRole('textbox')
    const ownerInput = inputs[0] // First input is owner
    const holderInput = inputs[1] // Second input is holder

    const newOwnerAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    const newHolderAddress = '0x1111111111111111111111111111111111111111'

    fireEvent.change(ownerInput, { target: { value: newOwnerAddress } })
    fireEvent.change(holderInput, { target: { value: newHolderAddress } })

    await waitFor(() => {
      const transferBtn = screen.getByTestId('endorseTransferBtn')
      expect(transferBtn).not.toBeDisabled()
    })
  })

  it('calls handleEndorseTransfer with correct parameters', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferOwnerHolder}
        handleEndorseTransfer={mockHandleEndorseTransfer}
        transferOwnersState={FormState.UNINITIALIZED}
      />
    )

    const inputs = screen.getAllByRole('textbox')
    const ownerInput = inputs[0] // First input is owner
    const holderInput = inputs[1] // Second input is holder

    const newOwnerAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    const newHolderAddress = '0x1111111111111111111111111111111111111111'

    fireEvent.change(ownerInput, { target: { value: newOwnerAddress } })
    fireEvent.change(holderInput, { target: { value: newHolderAddress } })

    const transferBtn = await waitFor(() => {
      const btn = screen.getByTestId('endorseTransferBtn')
      expect(btn).toBeEnabled()
      return btn
    })

    fireEvent.click(transferBtn)

    expect(mockHandleEndorseTransfer).toHaveBeenCalledWith({
      newBeneficiaryAddress: newOwnerAddress,
      newHolderAddress: newHolderAddress,
      remarks: '',
    })
  })

  it('shows loading state when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferOwnerHolder}
        handleEndorseTransfer={mockHandleEndorseTransfer}
        transferOwnersState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByText('Transferring..')).toBeInTheDocument()
  })
})

describe('ActionForm - Edge Cases', () => {
  const mockHandleTransfer = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prevents transfer when new holder is same as current holder', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.UNINITIALIZED}
      />
    )

    // Holder input already has the same value
    const transferBtn = screen.getByTestId('transferBtn')
    expect(transferBtn).toBeDisabled()
  })

  it('prevents transfer with invalid Ethereum address format', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.UNINITIALIZED}
      />
    )

    const holderInput = screen.getByDisplayValue(defaultProps.holder)
    fireEvent.change(holderInput, { target: { value: 'invalid-address' } })

    await waitFor(() => {
      const transferBtn = screen.getByTestId('transferBtn')
      expect(transferBtn).toBeDisabled()
    })
  })

  it('handles empty address input', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.UNINITIALIZED}
      />
    )

    const holderInput = screen.getByDisplayValue(defaultProps.holder)
    fireEvent.change(holderInput, { target: { value: '' } })

    await waitFor(() => {
      const transferBtn = screen.getByTestId('transferBtn')
      expect(transferBtn).toBeDisabled()
    })
  })
})
