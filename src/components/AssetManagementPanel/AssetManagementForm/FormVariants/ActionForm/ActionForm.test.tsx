import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ActionForm } from './ActionForm'
import { AssetManagementActions } from '../../../AssetManagementActions'
import { FormState } from '../../../../../utils/common/FormState'
import { OverlayProvider } from '../../../../common/contexts/OverlayContext'

const { mockShowOverlay, mockCloseOverlay } = vi.hoisted(() => ({
  mockShowOverlay: vi.fn(),
  mockCloseOverlay: vi.fn(),
}))

vi.mock('../../../../common/contexts/OverlayContext', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('../../../../common/contexts/OverlayContext')
    >()
  return {
    ...actual,
    useOverlayContext: () => ({
      showOverlay: mockShowOverlay,
      closeOverlay: mockCloseOverlay,
    }),
  }
})

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

    await waitFor(() => {
      const transferBtn = screen.getByTestId('transferBtn')
      fireEvent.click(transferBtn)
    })

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
        transferOwnersState={FormState.UNINITIALIZED}
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
        transferOwnersState={FormState.UNINITIALIZED}
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
        transferOwnersState={FormState.UNINITIALIZED}
      />
    )

    const inputs = screen.getAllByRole('textbox')
    const ownerInput = inputs[0] // First input is owner
    const newOwnerAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

    fireEvent.change(ownerInput, { target: { value: newOwnerAddress } })

    await waitFor(() => {
      const transferBtn = screen.getByTestId('transferBtn')
      fireEvent.click(transferBtn)
    })

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
        transferOwnersState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByText('Transferring..')).toBeInTheDocument()
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })
})

describe('ActionForm - TransferOwnerHolder', () => {
  const mockHandleTransferOwnerHolder = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders TransferOwnerHolder form correctly', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferOwnerHolder}
        handleTransferOwnerHolder={mockHandleTransferOwnerHolder}
        transferOwnerHoldersState={FormState.UNINITIALIZED}
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
        handleTransferOwnerHolder={mockHandleTransferOwnerHolder}
        transferOwnerHoldersState={FormState.UNINITIALIZED}
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
        handleTransferOwnerHolder={mockHandleTransferOwnerHolder}
        transferOwnerHoldersState={FormState.UNINITIALIZED}
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

  it('calls handleTransferOwnerHolder with correct parameters', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferOwnerHolder}
        handleTransferOwnerHolder={mockHandleTransferOwnerHolder}
        transferOwnerHoldersState={FormState.UNINITIALIZED}
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
      fireEvent.click(transferBtn)
    })

    expect(mockHandleTransferOwnerHolder).toHaveBeenCalledWith({
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
        handleTransferOwnerHolder={mockHandleTransferOwnerHolder}
        transferOwnerHoldersState={FormState.PENDING_CONFIRMATION}
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

describe('ActionForm - RejectTransferOwnerHolder', () => {
  const mockHandleRejectTransferOwnerHolder = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders previous owner and previous holder values', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevBeneficiary="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
        prevHolder="0x1111111111111111111111111111111111111111"
        type={AssetManagementActions.RejectTransferOwnerHolder}
        handleRejectTransferOwnerHolder={mockHandleRejectTransferOwnerHolder}
        rejectTransferOwnerHolderState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getByText('Previous Owner')).toBeInTheDocument()
    expect(screen.getByText('Previous Holder')).toBeInTheDocument()
    expect(
      screen.getAllByText('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd').length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText('0x1111111111111111111111111111111111111111').length
    ).toBeGreaterThan(0)
  })

  it('calls rejectTransferOwnerHolder with remarks when confirm is clicked', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevBeneficiary="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
        prevHolder="0x1111111111111111111111111111111111111111"
        type={AssetManagementActions.RejectTransferOwnerHolder}
        handleRejectTransferOwnerHolder={mockHandleRejectTransferOwnerHolder}
        rejectTransferOwnerHolderState={FormState.UNINITIALIZED}
      />
    )

    const remarkInput = screen.getByPlaceholderText('Enter remark')
    fireEvent.change(remarkInput, { target: { value: 'Reject reason' } })
    fireEvent.click(screen.getByTestId('rejectTransferOwnerHolderBtn'))

    expect(mockHandleRejectTransferOwnerHolder).toHaveBeenCalledWith({
      remarks: 'Reject reason',
    })
  })

  it('disables confirm and cancel buttons during pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevBeneficiary="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
        prevHolder="0x1111111111111111111111111111111111111111"
        type={AssetManagementActions.RejectTransferOwnerHolder}
        handleRejectTransferOwnerHolder={mockHandleRejectTransferOwnerHolder}
        rejectTransferOwnerHolderState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByText('Rejecting..')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByTestId('rejectTransferOwnerHolderBtn')).toBeDisabled()
  })

  it('shows success overlay and closes action form on confirmation', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevBeneficiary="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
        prevHolder="0x1111111111111111111111111111111111111111"
        type={AssetManagementActions.RejectTransferOwnerHolder}
        handleRejectTransferOwnerHolder={mockHandleRejectTransferOwnerHolder}
        rejectTransferOwnerHolderState={FormState.CONFIRMED}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })
    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Holdership Rejection Success')
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('still shows success overlay title when previous addresses are missing', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevBeneficiary={undefined}
        prevHolder={undefined}
        type={AssetManagementActions.RejectTransferOwnerHolder}
        handleRejectTransferOwnerHolder={mockHandleRejectTransferOwnerHolder}
        rejectTransferOwnerHolderState={FormState.CONFIRMED}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })
    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Holdership Rejection Success')
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })
})

describe('ActionForm - RejectTransferHolder', () => {
  const mockHandleRejectTransferHolder = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders owner and previous holder values', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevHolder="0x1111111111111111111111111111111111111111"
        type={AssetManagementActions.RejectTransferHolder}
        handleRejectTransferHolder={mockHandleRejectTransferHolder}
        rejectTransferHolderState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Previous Holder')).toBeInTheDocument()
    expect(
      screen.getAllByText('0x1111111111111111111111111111111111111111').length
    ).toBeGreaterThan(0)
  })

  it('calls rejectTransferHolder with remarks when reject is clicked', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevHolder="0x1111111111111111111111111111111111111111"
        type={AssetManagementActions.RejectTransferHolder}
        handleRejectTransferHolder={mockHandleRejectTransferHolder}
        rejectTransferHolderState={FormState.UNINITIALIZED}
      />
    )

    const remarkInput = screen.getByPlaceholderText('Enter remark')
    fireEvent.change(remarkInput, {
      target: { value: 'Reject holder transfer' },
    })
    fireEvent.click(screen.getByTestId('rejectTransferHolderBtn'))

    expect(mockHandleRejectTransferHolder).toHaveBeenCalledWith({
      remarks: 'Reject holder transfer',
    })
  })

  it('disables reject and cancel buttons during pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevHolder="0x1111111111111111111111111111111111111111"
        type={AssetManagementActions.RejectTransferHolder}
        handleRejectTransferHolder={mockHandleRejectTransferHolder}
        rejectTransferHolderState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByText('Rejecting..')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByTestId('rejectTransferHolderBtn')).toBeDisabled()
  })

  it('shows success overlay and closes action form on confirmation', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevHolder="0x1111111111111111111111111111111111111111"
        type={AssetManagementActions.RejectTransferHolder}
        handleRejectTransferHolder={mockHandleRejectTransferHolder}
        rejectTransferHolderState={FormState.CONFIRMED}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })
    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Holdership Rejection Success')
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })
})

describe('ActionForm - RejectTransferOwner', () => {
  const mockHandleRejectTransferOwner = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls rejectTransferOwner with remarks when reject is clicked', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevBeneficiary="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
        type={AssetManagementActions.RejectTransferOwner}
        handleRejectTransferOwner={mockHandleRejectTransferOwner}
        rejectTransferOwnerState={FormState.UNINITIALIZED}
      />
    )

    const remarkInput = screen.getByPlaceholderText('Enter remark')
    fireEvent.change(remarkInput, { target: { value: 'Reject owner reason' } })
    fireEvent.click(screen.getByTestId('rejectTransferOwnerBtn'))

    expect(mockHandleRejectTransferOwner).toHaveBeenCalledWith({
      remarks: 'Reject owner reason',
    })
  })

  it('shows success overlay and closes action form on confirmation', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevBeneficiary="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
        type={AssetManagementActions.RejectTransferOwner}
        handleRejectTransferOwner={mockHandleRejectTransferOwner}
        rejectTransferOwnerState={FormState.CONFIRMED}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })
    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Ownership Rejection Success')
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })
})
