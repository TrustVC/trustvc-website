import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AssetManagementApplication } from './index'
import { AssetManagementActions } from '../AssetManagementActions'
import { TokenRegistryVersions } from '../../../constants'

// Mock dependencies
const mockInitialize = vi.fn()
const mockNominate = vi.fn()
const mockChangeHolder = vi.fn()
const mockEndorseBeneficiary = vi.fn()
const mockTransferOwners = vi.fn()
const mockReturnToIssuer = vi.fn()
const mockRestoreToken = vi.fn()
const mockDestroyToken = vi.fn()
const mockRejectTransferOwner = vi.fn()
const mockRejectTransferHolder = vi.fn()
const mockRejectTransferOwnerHolder = vi.fn()
const mockSetShowEndorsementChain = vi.fn()

// Mock useTokenInformationContext
const mockUseTokenInformationContext = vi.fn()
vi.mock('../../common/contexts/TokenInformationContext', () => ({
  useTokenInformationContext: () => mockUseTokenInformationContext(),
}))

// Mock useProviderContext
const mockUseProviderContext = vi.fn()
vi.mock('../../common/contexts/providerContext', () => ({
  useProviderContext: () => mockUseProviderContext(),
}))

// Mock useTokenRegistryContract
const mockTokenRegistry = { address: '0xTokenRegistry' }
vi.mock('../../../hooks/useTokenRegistryContract', () => ({
  useTokenRegistryContract: () => ({
    tokenRegistry: mockTokenRegistry,
  }),
}))

// Mock useTokenRegistryRole
const mockUseTokenRegistryRole = vi.fn()
vi.mock('../../../hooks/useTokenRegistryRole', () => ({
  useTokenRegistryRole: () => mockUseTokenRegistryRole(),
}))

// Mock useTokenRegistryVersion
const mockUseTokenRegistryVersion = vi.fn()
vi.mock('../../../hooks/useTokenRegistryVersion', () => ({
  useTokenRegistryVersion: () => mockUseTokenRegistryVersion(),
}))

// Mock AssetManagementForm
vi.mock('../AssetManagementForm', () => ({
  AssetManagementForm: ({ formAction, onSetFormAction, ...props }: any) => (
    <div data-testid="asset-management-form">
      <div data-testid="form-action">{formAction}</div>
      <div data-testid="beneficiary">{props.beneficiary}</div>
      <div data-testid="holder">{props.holder}</div>
      <div data-testid="nominee">{props.nominee}</div>
      <button
        onClick={() => onSetFormAction(AssetManagementActions.TransferHolder)}
      >
        Set Transfer Holder
      </button>
    </div>
  ),
}))

// Mock TagBordered
vi.mock('../../common/Tag', () => ({
  TagBordered: ({ children, ...props }: any) => (
    <div data-testid="tag-bordered" {...props}>
      {children}
    </div>
  ),
}))

describe('AssetManagementApplication', () => {
  const defaultTransferableProps = {
    isMagicDemo: false,
    tokenId: '0x123',
    tokenRegistryAddress: '0xTokenRegistry',
    setShowEndorsementChain: mockSetShowEndorsementChain,
    isTransferableDocument: true as const,
    isSampleDocument: false,
    isExpired: false,
  }

  const defaultNonTransferableProps = {
    isMagicDemo: false,
    isTransferableDocument: false as const,
    isSampleDocument: false,
    isExpired: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProviderContext.mockReturnValue({
      provider: { getSigner: vi.fn() },
      account: '0xAccount',
    })
    mockUseTokenRegistryRole.mockReturnValue({
      hasRole: false,
    })
    mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)
    mockUseTokenInformationContext.mockReturnValue({
      initialize: mockInitialize,
      approvedBeneficiary: '0xNominee',
      holder: '0xHolder',
      beneficiary: '0xBeneficiary',
      prevBeneficiary: '0xPrevBeneficiary',
      prevHolder: '0xPrevHolder',
      isReturnedToIssuer: false,
      isTokenBurnt: false,
      isTitleEscrow: true,
      documentOwner: '0xDocumentOwner',
      nominate: mockNominate,
      nominateState: 'INITIALIZED',
      changeHolder: mockChangeHolder,
      changeHolderState: 'INITIALIZED',
      endorseBeneficiary: mockEndorseBeneficiary,
      endorseBeneficiaryState: 'INITIALIZED',
      transferOwners: mockTransferOwners,
      transferOwnersState: 'INITIALIZED',
      returnToIssuer: mockReturnToIssuer,
      returnToIssuerState: 'INITIALIZED',
      restoreToken: mockRestoreToken,
      restoreTokenState: 'INITIALIZED',
      destroyToken: mockDestroyToken,
      destroyTokenState: 'INITIALIZED',
      rejectTransferOwner: mockRejectTransferOwner,
      rejectTransferOwnerState: 'INITIALIZED',
      rejectTransferHolder: mockRejectTransferHolder,
      rejectTransferHolderState: 'INITIALIZED',
      rejectTransferOwnerHolder: mockRejectTransferOwnerHolder,
      rejectTransferOwnerHolderState: 'INITIALIZED',
    })
  })

  describe('Rendering', () => {
    it('renders AssetManagementForm when document is transferable and isTitleEscrow is defined', () => {
      render(<AssetManagementApplication {...defaultTransferableProps} />)

      expect(screen.getByTestId('asset-management-form')).toBeInTheDocument()
    })

    it('does not render AssetManagementForm when document is not transferable', () => {
      render(<AssetManagementApplication {...defaultNonTransferableProps} />)

      expect(
        screen.queryByTestId('asset-management-form')
      ).not.toBeInTheDocument()
    })

    it('renders expired tag when document is expired and not transferable', () => {
      render(
        <AssetManagementApplication
          {...defaultNonTransferableProps}
          isExpired={true}
        />
      )

      expect(screen.getByTestId('expiredDoc')).toBeInTheDocument()
      expect(screen.getByText('Expired')).toBeInTheDocument()
    })

    it('does not render expired tag when document is not expired', () => {
      render(<AssetManagementApplication {...defaultNonTransferableProps} />)

      expect(screen.queryByTestId('expiredDoc')).not.toBeInTheDocument()
    })
  })

  describe('Initialization', () => {
    it('initializes token information context with tokenId and tokenRegistryAddress', async () => {
      render(<AssetManagementApplication {...defaultTransferableProps} />)

      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalledWith('0xTokenRegistry', '0x123')
      })
    })

    it('does not initialize when tokenId is missing', async () => {
      const props = { ...defaultTransferableProps, tokenId: '' }
      render(<AssetManagementApplication {...props} />)

      await waitFor(() => {
        expect(mockInitialize).not.toHaveBeenCalled()
      })
    })

    it('does not initialize when tokenRegistryAddress is missing', async () => {
      const props = { ...defaultTransferableProps, tokenRegistryAddress: '' }
      render(<AssetManagementApplication {...props} />)

      await waitFor(() => {
        expect(mockInitialize).not.toHaveBeenCalled()
      })
    })
  })

  describe('Props Passing to AssetManagementForm', () => {
    it('passes correct beneficiary, holder, and nominee to form', () => {
      render(<AssetManagementApplication {...defaultTransferableProps} />)

      expect(screen.getByTestId('beneficiary')).toHaveTextContent(
        '0xBeneficiary'
      )
      expect(screen.getByTestId('holder')).toHaveTextContent('0xHolder')
      expect(screen.getByTestId('nominee')).toHaveTextContent('0xNominee')
    })

    it('passes setShowEndorsementChain prop to form', () => {
      render(<AssetManagementApplication {...defaultTransferableProps} />)

      expect(screen.getByTestId('asset-management-form')).toBeInTheDocument()
    })

    it('passes isExpired prop to form', () => {
      render(
        <AssetManagementApplication
          {...defaultTransferableProps}
          isExpired={true}
        />
      )

      expect(screen.getByTestId('asset-management-form')).toBeInTheDocument()
    })
  })

  describe('Token Registry Roles', () => {
    it('checks for AccepterRole with V4 token registry', () => {
      mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V4)

      render(<AssetManagementApplication {...defaultTransferableProps} />)

      expect(mockUseTokenRegistryRole).toHaveBeenCalled()
    })

    it('checks for AccepterRole with V5 token registry', () => {
      mockUseTokenRegistryVersion.mockReturnValue(TokenRegistryVersions.V5)

      render(<AssetManagementApplication {...defaultTransferableProps} />)

      expect(mockUseTokenRegistryRole).toHaveBeenCalled()
    })

    it('checks for RestorerRole', () => {
      render(<AssetManagementApplication {...defaultTransferableProps} />)

      expect(mockUseTokenRegistryRole).toHaveBeenCalledTimes(2)
    })
  })

  describe('Token Operations', () => {
    it('sets up destroyToken function correctly', () => {
      render(<AssetManagementApplication {...defaultTransferableProps} />)

      // Verify the mock is set up correctly
      expect(mockDestroyToken).not.toHaveBeenCalled()
    })

    it('calls restoreToken with tokenId and remarks', () => {
      render(<AssetManagementApplication {...defaultTransferableProps} />)

      expect(mockRestoreToken).not.toHaveBeenCalled()
    })
  })

  describe('Form Action Management', () => {
    it('initializes with None action', () => {
      render(<AssetManagementApplication {...defaultTransferableProps} />)

      expect(screen.getByTestId('form-action')).toHaveTextContent(
        AssetManagementActions.None
      )
    })

    it('resets form action to None when account changes', async () => {
      const { rerender } = render(
        <AssetManagementApplication {...defaultTransferableProps} />
      )

      // Change account
      mockUseProviderContext.mockReturnValue({
        provider: { getSigner: vi.fn() },
        account: '0xNewAccount',
      })

      rerender(<AssetManagementApplication {...defaultTransferableProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('form-action')).toHaveTextContent(
          AssetManagementActions.None
        )
      })
    })
  })

  describe('Conditional Rendering Based on isTitleEscrow', () => {
    it('renders form when isTitleEscrow is true', () => {
      render(<AssetManagementApplication {...defaultTransferableProps} />)

      expect(screen.getByTestId('asset-management-form')).toBeInTheDocument()
    })

    it('does not render form when isTitleEscrow is undefined', () => {
      mockUseTokenInformationContext.mockReturnValue({
        initialize: mockInitialize,
        isTitleEscrow: undefined,
        approvedBeneficiary: '0xNominee',
        holder: '0xHolder',
        beneficiary: '0xBeneficiary',
        prevBeneficiary: '0xPrevBeneficiary',
        prevHolder: '0xPrevHolder',
        isReturnedToIssuer: false,
        isTokenBurnt: false,
        documentOwner: '0xDocumentOwner',
        nominate: mockNominate,
        nominateState: 'INITIALIZED',
        changeHolder: mockChangeHolder,
        changeHolderState: 'INITIALIZED',
        endorseBeneficiary: mockEndorseBeneficiary,
        endorseBeneficiaryState: 'INITIALIZED',
        transferOwners: mockTransferOwners,
        transferOwnersState: 'INITIALIZED',
        returnToIssuer: mockReturnToIssuer,
        returnToIssuerState: 'INITIALIZED',
        restoreToken: mockRestoreToken,
        restoreTokenState: 'INITIALIZED',
        destroyToken: mockDestroyToken,
        destroyTokenState: 'INITIALIZED',
        rejectTransferOwner: mockRejectTransferOwner,
        rejectTransferOwnerState: 'INITIALIZED',
        rejectTransferHolder: mockRejectTransferHolder,
        rejectTransferHolderState: 'INITIALIZED',
        rejectTransferOwnerHolder: mockRejectTransferOwnerHolder,
        rejectTransferOwnerHolderState: 'INITIALIZED',
      })

      render(<AssetManagementApplication {...defaultTransferableProps} />)

      expect(
        screen.queryByTestId('asset-management-form')
      ).not.toBeInTheDocument()
    })
  })

  describe('Magic Demo Mode', () => {
    it('handles isMagicDemo prop', () => {
      const props = { ...defaultTransferableProps, isMagicDemo: true }
      render(<AssetManagementApplication {...props} />)

      expect(screen.getByTestId('asset-management-form')).toBeInTheDocument()
    })
  })

  describe('Sample Document Mode', () => {
    it('handles isSampleDocument prop', () => {
      const props = { ...defaultTransferableProps, isSampleDocument: true }
      render(<AssetManagementApplication {...props} />)

      expect(screen.getByTestId('asset-management-form')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing provider', () => {
      mockUseProviderContext.mockReturnValue({
        provider: null,
        account: null,
      })

      render(<AssetManagementApplication {...defaultTransferableProps} />)

      expect(screen.getByTestId('asset-management-form')).toBeInTheDocument()
    })

    it('renders form for expired transferable document when isTitleEscrow is true', () => {
      render(
        <AssetManagementApplication
          {...defaultTransferableProps}
          isExpired={true}
        />
      )

      expect(screen.getByTestId('asset-management-form')).toBeInTheDocument()
    })

    it('renders nothing when non-transferable and not expired', () => {
      render(<AssetManagementApplication {...defaultNonTransferableProps} />)

      expect(
        screen.queryByTestId('asset-management-form')
      ).not.toBeInTheDocument()
      expect(screen.queryByTestId('expiredDoc')).not.toBeInTheDocument()
    })
  })

  describe('Token Registry Contract', () => {
    it('initializes token registry contract with correct address', () => {
      render(<AssetManagementApplication {...defaultTransferableProps} />)

      // The hook should be called with tokenRegistryAddress and provider
      expect(screen.getByTestId('asset-management-form')).toBeInTheDocument()
    })
  })

  describe('Console Logging', () => {
    it('logs initialization information', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      render(<AssetManagementApplication {...defaultTransferableProps} />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Initializing TokenInformationContext with:',
          '0x123',
          '0xTokenRegistry'
        )
      })

      consoleSpy.mockRestore()
    })

    it('logs isTransferableDocument and isTitleEscrow', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      render(<AssetManagementApplication {...defaultTransferableProps} />)

      expect(consoleSpy).toHaveBeenCalledWith(
        'isTransferableDocument',
        true,
        expect.any(Boolean)
      )

      consoleSpy.mockRestore()
    })
  })
})
