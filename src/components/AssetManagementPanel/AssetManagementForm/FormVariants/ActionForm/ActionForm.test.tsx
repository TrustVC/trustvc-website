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
    expect(overlayNode.props.title).toBe(
      'Holdership/Ownership Rejection Success'
    )
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
    expect(overlayNode.props.title).toBe(
      'Holdership/Ownership Rejection Success'
    )
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
    expect(overlayNode.props.title).toBe('Holder Rejection Success')
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })
})

describe('ActionForm - RejectTransferOwner', () => {
  const mockHandleRejectTransferOwner = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders previous owner and holder values', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevBeneficiary="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
        type={AssetManagementActions.RejectTransferOwner}
        handleRejectTransferOwner={mockHandleRejectTransferOwner}
        rejectTransferOwnerState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getByText('Previous Owner')).toBeInTheDocument()
    expect(screen.getByText('Holder')).toBeInTheDocument()
    expect(
      screen.getAllByText('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd').length
    ).toBeGreaterThan(0)
    expect(screen.getAllByText(defaultProps.holder).length).toBeGreaterThan(0)
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

  it('disables reject and cancel buttons during pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevBeneficiary="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
        type={AssetManagementActions.RejectTransferOwner}
        handleRejectTransferOwner={mockHandleRejectTransferOwner}
        rejectTransferOwnerState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByText('Rejecting..')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByTestId('rejectTransferOwnerBtn')).toBeDisabled()
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

describe('ActionForm - ReturnToIssuer', () => {
  const mockHandleReturnToIssuer = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders ReturnToIssuer form correctly', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.ReturnToIssuer}
        handleReturnToIssuer={mockHandleReturnToIssuer}
        returnToIssuerState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getAllByText('Remark').length).toBeGreaterThan(0)
    expect(screen.getByTestId('cancelSurrenderBtn')).toBeInTheDocument()
    expect(screen.getByTestId('surrenderBtn')).toBeInTheDocument()
  })

  it('displays only remark field without owner and holder', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.ReturnToIssuer}
        handleReturnToIssuer={mockHandleReturnToIssuer}
        returnToIssuerState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.queryByText('Owner')).not.toBeInTheDocument()
    expect(screen.queryByText('Holder')).not.toBeInTheDocument()
    expect(screen.getAllByText('Remark').length).toBeGreaterThan(0)
  })

  it('enables return button by default', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.ReturnToIssuer}
        handleReturnToIssuer={mockHandleReturnToIssuer}
        returnToIssuerState={FormState.UNINITIALIZED}
      />
    )

    const returnBtn = screen.getByTestId('surrenderBtn')
    expect(returnBtn).not.toBeDisabled()
  })

  it('calls handleReturnToIssuer with empty remarks when button is clicked without remark', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.ReturnToIssuer}
        handleReturnToIssuer={mockHandleReturnToIssuer}
        returnToIssuerState={FormState.UNINITIALIZED}
      />
    )

    const returnBtn = screen.getByTestId('surrenderBtn')
    fireEvent.click(returnBtn)

    expect(mockHandleReturnToIssuer).toHaveBeenCalledWith({
      remarks: '',
    })
  })

  it('calls handleReturnToIssuer with remarks when provided', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.ReturnToIssuer}
        handleReturnToIssuer={mockHandleReturnToIssuer}
        returnToIssuerState={FormState.UNINITIALIZED}
      />
    )

    const remarkInput = screen.getByPlaceholderText('Enter remark')
    fireEvent.change(remarkInput, {
      target: { value: 'Returning document to issuer' },
    })

    const returnBtn = screen.getByTestId('surrenderBtn')
    fireEvent.click(returnBtn)

    expect(mockHandleReturnToIssuer).toHaveBeenCalledWith({
      remarks: 'Returning document to issuer',
    })
  })

  it('shows loading state when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.ReturnToIssuer}
        handleReturnToIssuer={mockHandleReturnToIssuer}
        returnToIssuerState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByText('Returning..')).toBeInTheDocument()
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('disables buttons when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.ReturnToIssuer}
        handleReturnToIssuer={mockHandleReturnToIssuer}
        returnToIssuerState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByTestId('cancelSurrenderBtn')).toBeDisabled()
    expect(screen.getByTestId('surrenderBtn')).toBeDisabled()
  })

  it('disables buttons when state is initialized', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.ReturnToIssuer}
        handleReturnToIssuer={mockHandleReturnToIssuer}
        returnToIssuerState={FormState.INITIALIZED}
      />
    )

    expect(screen.getByTestId('cancelSurrenderBtn')).toBeDisabled()
    expect(screen.getByTestId('surrenderBtn')).toBeDisabled()
  })

  it('calls setFormActionNone when cancel button is clicked', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.ReturnToIssuer}
        handleReturnToIssuer={mockHandleReturnToIssuer}
        returnToIssuerState={FormState.UNINITIALIZED}
      />
    )

    const cancelBtn = screen.getByTestId('cancelSurrenderBtn')
    fireEvent.click(cancelBtn)

    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('shows success overlay and closes action form on confirmation', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.ReturnToIssuer}
        handleReturnToIssuer={mockHandleReturnToIssuer}
        returnToIssuerState={FormState.CONFIRMED}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })
    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Return of ETR Successful')
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('displays Return To Issuer button text correctly', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.ReturnToIssuer}
        handleReturnToIssuer={mockHandleReturnToIssuer}
        returnToIssuerState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getByText('Return To Issuer')).toBeInTheDocument()
  })

  it('applies correct opacity and pointer-events when pending', () => {
    const { container } = renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.ReturnToIssuer}
        handleReturnToIssuer={mockHandleReturnToIssuer}
        returnToIssuerState={FormState.PENDING_CONFIRMATION}
      />
    )

    const actionFormFrame = container.querySelector('.action-form-frame')
    expect(actionFormFrame).toHaveClass('opacity-[0.33]')
    expect(actionFormFrame).toHaveClass('pointer-events-none')
  })
})

describe('ActionForm - RejectReturnToIssuer', () => {
  const mockHandleRestoreToken = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders RejectReturnToIssuer form correctly', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.RejectReturnToIssuer}
        handleRestoreToken={mockHandleRestoreToken}
        restoreTokenState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Holder')).toBeInTheDocument()
    expect(screen.getAllByText('Remark').length).toBeGreaterThan(0)
    expect(screen.getByTestId('cancelSurrenderBtn')).toBeInTheDocument()
    expect(screen.getByTestId('rejectReturnToIssuerBtn')).toBeInTheDocument()
  })

  it('displays beneficiary and holder addresses as non-editable', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.RejectReturnToIssuer}
        handleRestoreToken={mockHandleRestoreToken}
        restoreTokenState={FormState.UNINITIALIZED}
      />
    )

    expect(
      screen.getAllByText(defaultProps.beneficiary).length
    ).toBeGreaterThan(0)
    expect(screen.getAllByText(defaultProps.holder).length).toBeGreaterThan(0)
  })

  it('enables reject button by default', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.RejectReturnToIssuer}
        handleRestoreToken={mockHandleRestoreToken}
        restoreTokenState={FormState.UNINITIALIZED}
      />
    )

    const rejectBtn = screen.getByTestId('rejectReturnToIssuerBtn')
    expect(rejectBtn).not.toBeDisabled()
  })

  it('calls handleRestoreToken with empty remarks when button is clicked without remark', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.RejectReturnToIssuer}
        handleRestoreToken={mockHandleRestoreToken}
        restoreTokenState={FormState.UNINITIALIZED}
      />
    )

    const rejectBtn = screen.getByTestId('rejectReturnToIssuerBtn')
    fireEvent.click(rejectBtn)

    expect(mockHandleRestoreToken).toHaveBeenCalledWith({ remarks: '' })
  })

  it('calls handleRestoreToken with remarks when provided', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.RejectReturnToIssuer}
        handleRestoreToken={mockHandleRestoreToken}
        restoreTokenState={FormState.UNINITIALIZED}
      />
    )

    const remarkInput = screen.getByPlaceholderText('Enter remark')
    fireEvent.change(remarkInput, {
      target: { value: 'Rejecting return to issuer' },
    })

    const rejectBtn = screen.getByTestId('rejectReturnToIssuerBtn')
    fireEvent.click(rejectBtn)

    expect(mockHandleRestoreToken).toHaveBeenCalledWith({
      remarks: 'Rejecting return to issuer',
    })
  })

  it('shows loading state when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.RejectReturnToIssuer}
        handleRestoreToken={mockHandleRestoreToken}
        restoreTokenState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByText('Rejecting..')).toBeInTheDocument()
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('disables buttons when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.RejectReturnToIssuer}
        handleRestoreToken={mockHandleRestoreToken}
        restoreTokenState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByTestId('cancelSurrenderBtn')).toBeDisabled()
    expect(screen.getByTestId('rejectReturnToIssuerBtn')).toBeDisabled()
  })

  it('disables buttons when state is initialized', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.RejectReturnToIssuer}
        handleRestoreToken={mockHandleRestoreToken}
        restoreTokenState={FormState.INITIALIZED}
      />
    )

    expect(screen.getByTestId('cancelSurrenderBtn')).toBeDisabled()
    expect(screen.getByTestId('rejectReturnToIssuerBtn')).toBeDisabled()
  })

  it('calls setFormActionNone when cancel button is clicked', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.RejectReturnToIssuer}
        handleRestoreToken={mockHandleRestoreToken}
        restoreTokenState={FormState.UNINITIALIZED}
      />
    )

    const cancelBtn = screen.getByTestId('cancelSurrenderBtn')
    fireEvent.click(cancelBtn)

    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('shows success overlay and closes action form on confirmation', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.RejectReturnToIssuer}
        handleRestoreToken={mockHandleRestoreToken}
        restoreTokenState={FormState.CONFIRMED}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })
    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Return of ETR Rejected')
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('displays Reject ETR Return button text correctly', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.RejectReturnToIssuer}
        handleRestoreToken={mockHandleRestoreToken}
        restoreTokenState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getByText('Reject ETR Return')).toBeInTheDocument()
  })

  it('applies correct opacity and pointer-events when pending', () => {
    const { container } = renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.RejectReturnToIssuer}
        handleRestoreToken={mockHandleRestoreToken}
        restoreTokenState={FormState.PENDING_CONFIRMATION}
      />
    )

    const actionFormFrame = container.querySelector('.action-form-frame')
    expect(actionFormFrame).toHaveClass('opacity-[0.33]')
    expect(actionFormFrame).toHaveClass('pointer-events-none')
  })

  it('shows error overlay and closes action form on error', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.RejectReturnToIssuer}
        handleRestoreToken={mockHandleRestoreToken}
        restoreTokenState={FormState.ERROR}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })
    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Return of ETR Rejection Failed')
    expect(overlayNode.props.isSuccess).toBe(false)
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })
})

describe('ActionForm - AcceptReturnToIssuer', () => {
  const mockHandleDestroyToken = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders AcceptReturnToIssuer form correctly', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.AcceptReturnToIssuer}
        handleDestroyToken={mockHandleDestroyToken}
        destroyTokenState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getAllByText('Remark').length).toBeGreaterThan(0)
    expect(screen.getByTestId('cancelSurrenderBtn')).toBeInTheDocument()
    expect(screen.getByTestId('acceptReturnToIssuerBtn')).toBeInTheDocument()
  })

  it('displays only remark field', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.AcceptReturnToIssuer}
        handleDestroyToken={mockHandleDestroyToken}
        destroyTokenState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getAllByText('Remark').length).toBeGreaterThan(0)
  })

  it('enables accept button by default', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.AcceptReturnToIssuer}
        handleDestroyToken={mockHandleDestroyToken}
        destroyTokenState={FormState.UNINITIALIZED}
      />
    )

    const acceptBtn = screen.getByTestId('acceptReturnToIssuerBtn')
    expect(acceptBtn).not.toBeDisabled()
  })

  it('calls handleDestroyToken with empty remarks when button is clicked without remark', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.AcceptReturnToIssuer}
        handleDestroyToken={mockHandleDestroyToken}
        destroyTokenState={FormState.UNINITIALIZED}
      />
    )

    const acceptBtn = screen.getByTestId('acceptReturnToIssuerBtn')
    fireEvent.click(acceptBtn)

    expect(mockHandleDestroyToken).toHaveBeenCalledWith({ remarks: '' })
  })

  it('calls handleDestroyToken with remarks when provided', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.AcceptReturnToIssuer}
        handleDestroyToken={mockHandleDestroyToken}
        destroyTokenState={FormState.UNINITIALIZED}
      />
    )

    const remarkInput = screen.getByPlaceholderText('Enter remark')
    fireEvent.change(remarkInput, {
      target: { value: 'Accepting return to issuer' },
    })

    const acceptBtn = screen.getByTestId('acceptReturnToIssuerBtn')
    fireEvent.click(acceptBtn)

    expect(mockHandleDestroyToken).toHaveBeenCalledWith({
      remarks: 'Accepting return to issuer',
    })
  })

  it('shows loading state when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.AcceptReturnToIssuer}
        handleDestroyToken={mockHandleDestroyToken}
        destroyTokenState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByText('Accepting..')).toBeInTheDocument()
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('disables buttons when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.AcceptReturnToIssuer}
        handleDestroyToken={mockHandleDestroyToken}
        destroyTokenState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByTestId('cancelSurrenderBtn')).toBeDisabled()
    expect(screen.getByTestId('acceptReturnToIssuerBtn')).toBeDisabled()
  })

  it('disables buttons when state is initialized', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.AcceptReturnToIssuer}
        handleDestroyToken={mockHandleDestroyToken}
        destroyTokenState={FormState.INITIALIZED}
      />
    )

    expect(screen.getByTestId('cancelSurrenderBtn')).toBeDisabled()
    expect(screen.getByTestId('acceptReturnToIssuerBtn')).toBeDisabled()
  })

  it('calls setFormActionNone when cancel button is clicked', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.AcceptReturnToIssuer}
        handleDestroyToken={mockHandleDestroyToken}
        destroyTokenState={FormState.UNINITIALIZED}
      />
    )

    const cancelBtn = screen.getByTestId('cancelSurrenderBtn')
    fireEvent.click(cancelBtn)

    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('shows success overlay and closes action form on confirmation', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.AcceptReturnToIssuer}
        handleDestroyToken={mockHandleDestroyToken}
        destroyTokenState={FormState.CONFIRMED}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })
    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Return of ETR Accepted')
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('shows error overlay and closes action form on error', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.AcceptReturnToIssuer}
        handleDestroyToken={mockHandleDestroyToken}
        destroyTokenState={FormState.ERROR}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })
    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Return of ETR Acceptance Failed')
    expect(overlayNode.props.isSuccess).toBe(false)
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('displays Accept ETR Return button text correctly', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.AcceptReturnToIssuer}
        handleDestroyToken={mockHandleDestroyToken}
        destroyTokenState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getByText('Accept ETR Return')).toBeInTheDocument()
  })

  it('applies correct opacity and pointer-events when pending', () => {
    const { container } = renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.AcceptReturnToIssuer}
        handleDestroyToken={mockHandleDestroyToken}
        destroyTokenState={FormState.PENDING_CONFIRMATION}
      />
    )

    const actionFormFrame = container.querySelector('.action-form-frame')
    expect(actionFormFrame).toHaveClass('opacity-[0.33]')
    expect(actionFormFrame).toHaveClass('pointer-events-none')
  })
})

describe('ActionForm - NominateBeneficiary', () => {
  const mockHandleNomination = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders NominateBeneficiary form correctly', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.NominateBeneficiary}
        handleNomination={mockHandleNomination}
        nominationState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Holder')).toBeInTheDocument()
    expect(screen.getAllByText('Remark').length).toBeGreaterThan(0)
    expect(screen.getByTestId('cancelNominationBtn')).toBeInTheDocument()
    expect(screen.getByTestId('nominationBtn')).toBeInTheDocument()
  })

  it('disables nominate button when beneficiary address is invalid', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.NominateBeneficiary}
        handleNomination={mockHandleNomination}
        nominationState={FormState.UNINITIALIZED}
      />
    )

    const nominateBtn = screen.getByTestId('nominationBtn')
    expect(nominateBtn).toBeDisabled()
  })

  it('enables nominate button when valid beneficiary address is entered', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.NominateBeneficiary}
        handleNomination={mockHandleNomination}
        nominationState={FormState.UNINITIALIZED}
      />
    )

    const inputs = screen.getAllByRole('textbox')
    const beneficiaryInput = inputs[0]
    const newBeneficiaryAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

    fireEvent.change(beneficiaryInput, {
      target: { value: newBeneficiaryAddress },
    })

    await waitFor(() => {
      const nominateBtn = screen.getByTestId('nominationBtn')
      expect(nominateBtn).not.toBeDisabled()
    })
  })

  it('prevents nomination when new beneficiary is same as current beneficiary', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.NominateBeneficiary}
        handleNomination={mockHandleNomination}
        nominationState={FormState.UNINITIALIZED}
      />
    )

    const inputs = screen.getAllByRole('textbox')
    const beneficiaryInput = inputs[0]

    fireEvent.change(beneficiaryInput, {
      target: { value: defaultProps.beneficiary },
    })

    await waitFor(() => {
      const nominateBtn = screen.getByTestId('nominationBtn')
      expect(nominateBtn).toBeDisabled()
    })
  })

  it('calls handleNomination with correct parameters', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.NominateBeneficiary}
        handleNomination={mockHandleNomination}
        nominationState={FormState.UNINITIALIZED}
      />
    )

    const inputs = screen.getAllByRole('textbox')
    const beneficiaryInput = inputs[0]
    const newBeneficiaryAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

    fireEvent.change(beneficiaryInput, {
      target: { value: newBeneficiaryAddress },
    })

    await waitFor(() => {
      const nominateBtn = screen.getByTestId('nominationBtn')
      fireEvent.click(nominateBtn)
    })

    expect(mockHandleNomination).toHaveBeenCalledWith({
      newBeneficiaryAddress: newBeneficiaryAddress,
      remarks: '',
    })
  })

  it('shows loading state when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.NominateBeneficiary}
        handleNomination={mockHandleNomination}
        nominationState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByText('Nominating..')).toBeInTheDocument()
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('disables buttons when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.NominateBeneficiary}
        handleNomination={mockHandleNomination}
        nominationState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByTestId('cancelNominationBtn')).toBeDisabled()
    expect(screen.getByTestId('nominationBtn')).toBeDisabled()
  })

  it('calls setFormActionNone when cancel button is clicked', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.NominateBeneficiary}
        handleNomination={mockHandleNomination}
        nominationState={FormState.UNINITIALIZED}
      />
    )

    const cancelBtn = screen.getByTestId('cancelNominationBtn')
    fireEvent.click(cancelBtn)

    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('shows success overlay and closes action form on confirmation', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.NominateBeneficiary}
        handleNomination={mockHandleNomination}
        nominationState={FormState.CONFIRMED}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })
    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Nomination Success')
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('shows error overlay and closes action form on error', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.NominateBeneficiary}
        handleNomination={mockHandleNomination}
        nominationState={FormState.ERROR}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })
    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Nomination Failed')
    expect(overlayNode.props.isSuccess).toBe(false)
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('includes remark when provided', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.NominateBeneficiary}
        handleNomination={mockHandleNomination}
        nominationState={FormState.UNINITIALIZED}
      />
    )

    const inputs = screen.getAllByRole('textbox')
    const beneficiaryInput = inputs[0]
    const newBeneficiaryAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

    fireEvent.change(beneficiaryInput, {
      target: { value: newBeneficiaryAddress },
    })

    const remarkInput = screen.getByPlaceholderText('Enter remark')
    fireEvent.change(remarkInput, { target: { value: 'Nomination remark' } })

    await waitFor(() => {
      const nominateBtn = screen.getByTestId('nominationBtn')
      fireEvent.click(nominateBtn)
    })

    expect(mockHandleNomination).toHaveBeenCalledWith({
      newBeneficiaryAddress: newBeneficiaryAddress,
      remarks: 'Nomination remark',
    })
  })
})

describe('ActionForm - EndorseBeneficiary', () => {
  const mockHandleBeneficiaryTransfer = vi.fn()
  const nomineeAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders EndorseBeneficiary form correctly', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.EndorseBeneficiary}
        nominee={nomineeAddress}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        endorseBeneficiaryState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getByText('Nominee')).toBeInTheDocument()
    expect(screen.getByText('Holder')).toBeInTheDocument()
    expect(screen.getAllByText('Remark').length).toBeGreaterThan(0)
    expect(screen.getByTestId('cancelEndorseBtn')).toBeInTheDocument()
    expect(screen.getByTestId('endorseBtn')).toBeInTheDocument()
  })

  it('displays nominee address as non-editable', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.EndorseBeneficiary}
        nominee={nomineeAddress}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        endorseBeneficiaryState={FormState.UNINITIALIZED}
      />
    )

    expect(screen.getAllByText(nomineeAddress).length).toBeGreaterThan(0)
    expect(screen.getAllByText(defaultProps.holder).length).toBeGreaterThan(0)
  })

  it('enables endorse button when nominee is valid', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.EndorseBeneficiary}
        nominee={nomineeAddress}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        endorseBeneficiaryState={FormState.UNINITIALIZED}
      />
    )

    const endorseBtn = screen.getByTestId('endorseBtn')
    expect(endorseBtn).not.toBeDisabled()
  })

  it('disables endorse button when nominee is invalid', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.EndorseBeneficiary}
        nominee="invalid-address"
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        endorseBeneficiaryState={FormState.UNINITIALIZED}
      />
    )

    const endorseBtn = screen.getByTestId('endorseBtn')
    expect(endorseBtn).toBeDisabled()
  })

  it('calls handleBeneficiaryTransfer with correct parameters', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.EndorseBeneficiary}
        nominee={nomineeAddress}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        endorseBeneficiaryState={FormState.UNINITIALIZED}
      />
    )

    const endorseBtn = screen.getByTestId('endorseBtn')
    fireEvent.click(endorseBtn)

    expect(mockHandleBeneficiaryTransfer).toHaveBeenCalledWith({
      newBeneficiaryAddress: nomineeAddress,
      remarks: '',
    })
  })

  it('shows loading state when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.EndorseBeneficiary}
        nominee={nomineeAddress}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        endorseBeneficiaryState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByText('Endorsing transfer..')).toBeInTheDocument()
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('disables buttons when pending confirmation', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.EndorseBeneficiary}
        nominee={nomineeAddress}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        endorseBeneficiaryState={FormState.PENDING_CONFIRMATION}
      />
    )

    expect(screen.getByTestId('cancelEndorseBtn')).toBeDisabled()
    expect(screen.getByTestId('endorseBtn')).toBeDisabled()
  })

  it('calls setFormActionNone when cancel button is clicked', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.EndorseBeneficiary}
        nominee={nomineeAddress}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        endorseBeneficiaryState={FormState.UNINITIALIZED}
      />
    )

    const cancelBtn = screen.getByTestId('cancelEndorseBtn')
    fireEvent.click(cancelBtn)

    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('shows success overlay and closes action form on confirmation', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.EndorseBeneficiary}
        nominee={nomineeAddress}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        endorseBeneficiaryState={FormState.CONFIRMED}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })
    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Endorse Beneficiary Success')
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('shows error overlay and closes action form on error', async () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.EndorseBeneficiary}
        nominee={nomineeAddress}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        endorseBeneficiaryState={FormState.ERROR}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })
    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Endorsement Failed')
    expect(overlayNode.props.isSuccess).toBe(false)
    expect(mockSetFormActionNone).toHaveBeenCalled()
  })

  it('includes remark when provided', () => {
    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.EndorseBeneficiary}
        nominee={nomineeAddress}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        endorseBeneficiaryState={FormState.UNINITIALIZED}
      />
    )

    const remarkInput = screen.getByPlaceholderText('Enter remark')
    fireEvent.change(remarkInput, {
      target: { value: 'Endorsement remark' },
    })

    const endorseBtn = screen.getByTestId('endorseBtn')
    fireEvent.click(endorseBtn)

    expect(mockHandleBeneficiaryTransfer).toHaveBeenCalledWith({
      newBeneficiaryAddress: nomineeAddress,
      remarks: 'Endorsement remark',
    })
  })
})

describe('ActionForm - errorMessage prop passthrough', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes errorMessage to overlay when TransferHolder fails', async () => {
    const mockHandleTransfer = vi.fn()

    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.ERROR}
        errorMessage="User Rejected Transaction"
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })

    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Transfer Holder Failed')
    expect(overlayNode.props.isSuccess).toBe(false)
    expect(overlayNode.props.errorMessage).toBe('User Rejected Transaction')
  })

  it('passes errorMessage to overlay when TransferOwnerHolder fails', async () => {
    const mockHandleTransferOwnerHolder = vi.fn()

    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferOwnerHolder}
        handleTransferOwnerHolder={mockHandleTransferOwnerHolder}
        transferOwnerHoldersState={FormState.ERROR}
        errorMessage="Insufficient Funds"
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })

    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Transfer Ownership/Holdership Failed')
    expect(overlayNode.props.errorMessage).toBe('Insufficient Funds')
  })

  it('passes errorMessage to overlay when NominateBeneficiary fails', async () => {
    const mockHandleNomination = vi.fn()

    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.NominateBeneficiary}
        handleNomination={mockHandleNomination}
        nominationState={FormState.ERROR}
        errorMessage="Network Error"
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })

    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Nomination Failed')
    expect(overlayNode.props.errorMessage).toBe('Network Error')
  })

  it('passes errorMessage to overlay when RejectTransferOwnerHolder fails', async () => {
    const mockHandleRejectTransferOwnerHolder = vi.fn()

    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        prevBeneficiary="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
        prevHolder="0x1111111111111111111111111111111111111111"
        type={AssetManagementActions.RejectTransferOwnerHolder}
        handleRejectTransferOwnerHolder={mockHandleRejectTransferOwnerHolder}
        rejectTransferOwnerHolderState={FormState.ERROR}
        errorMessage="Transaction Rejected"
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })

    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe(
      'Holdership/Ownership Rejection Failed'
    )
    expect(overlayNode.props.errorMessage).toBe('Transaction Rejected')
  })

  it('passes errorMessage to overlay when ReturnToIssuer fails', async () => {
    const mockHandleReturnToIssuer = vi.fn()

    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.ReturnToIssuer}
        handleReturnToIssuer={mockHandleReturnToIssuer}
        returnToIssuerState={FormState.ERROR}
        errorMessage="Contract Call Failed"
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })

    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Return of ETR Failed')
    expect(overlayNode.props.errorMessage).toBe('Contract Call Failed')
  })

  it('passes errorMessage to overlay on successful TransferOwner', async () => {
    const mockHandleBeneficiaryTransfer = vi.fn()

    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferOwner}
        handleBeneficiaryTransfer={mockHandleBeneficiaryTransfer}
        transferOwnersState={FormState.CONFIRMED}
        errorMessage="Some Error"
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })

    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.title).toBe('Transfer Owner Success')
    expect(overlayNode.props.isSuccess).toBe(true)
    expect(overlayNode.props.errorMessage).toBe('Some Error')
  })

  it('passes undefined errorMessage when prop is not provided', async () => {
    const mockHandleTransfer = vi.fn()

    renderWithOverlay(
      <ActionForm
        {...defaultProps}
        type={AssetManagementActions.TransferHolder}
        handleTransfer={mockHandleTransfer}
        holderTransferringState={FormState.ERROR}
      />
    )

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalled()
    })

    const overlayNode = mockShowOverlay.mock.calls[0][0] as any
    expect(overlayNode.props.errorMessage).toBeUndefined()
  })
})
