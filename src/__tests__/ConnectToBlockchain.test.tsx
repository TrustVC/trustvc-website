import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConnectToBlockchainModel from '../components/ConnectToBlockchain'
import { SIGNER_TYPE } from '../components/common/contexts/providerContext'

// Mock the provider context
const mockUpgradeToMetaMaskSigner = vi.fn()
const mockDisconnectWallet = vi.fn()
const mockUseProviderContext = vi.fn()

vi.mock('../components/common/contexts/providerContext', async () => {
  const actual = await vi.importActual(
    '../components/common/contexts/providerContext'
  )
  return {
    ...actual,
    useProviderContext: () => mockUseProviderContext(),
  }
})

// Mock the Overlay component
vi.mock('../components/common/Overlay', () => ({
  default: ({ children }: any) => <div data-testid="overlay">{children}</div>,
}))

// Mock PrimaryButton component
vi.mock('../components/common/PrimaryButton', () => ({
  default: ({ children, onClick, 'data-testid': testId, ...props }: any) => (
    <button data-testid={testId} onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

// Mock ConnectToMetamask component
vi.mock('../components/ConnectToMetamask', () => ({
  ConnectToMetamaskModelComponent: ({
    handleContinue,
    showOnNewConnectWarningMessage,
  }: any) => (
    <div data-testid="connect-metamask-component">
      <div>Metamask Component</div>
      {showOnNewConnectWarningMessage && <div>Warning Message</div>}
      <button onClick={handleContinue} data-testid="continue-btn">
        Continue
      </button>
    </div>
  ),
}))

describe('ConnectToBlockchainModel', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Set default mock return value
    mockUseProviderContext.mockReturnValue({
      providerType: SIGNER_TYPE.NONE,
      account: null,
      upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
      disconnectWallet: mockDisconnectWallet,
    })
  })

  describe('Rendering', () => {
    it('renders the modal with correct title when not connected', () => {
      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      expect(
        screen.getByText('Connect to Blockchain Wallet')
      ).toBeInTheDocument()
      expect(screen.getByText('Login via:')).toBeInTheDocument()
    })

    it('renders the modal with "Active Wallet Address" title when connected', () => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.METAMASK,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      expect(screen.getByText('Active Wallet Address')).toBeInTheDocument()
    })

    it('renders the cancel button', () => {
      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      const cancelButton = screen.getByTestId('connect-blockchain-cancel')
      expect(cancelButton).toBeInTheDocument()
      expect(cancelButton).toHaveTextContent('Cancel')
    })

    it('renders wallet type tabs', () => {
      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      expect(screen.getByTestId('connect-metamask-header')).toBeInTheDocument()
      expect(screen.getByTestId('connect-magic-header')).toBeInTheDocument()
    })

    it('renders the ConnectToMetamask component by default', () => {
      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      expect(
        screen.getByTestId('connect-metamask-component')
      ).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('calls onClose when cancel button is clicked', () => {
      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      const cancelButton = screen.getByTestId('connect-blockchain-cancel')
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('switches to Metamask tab when clicked', () => {
      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      const metamaskTab = screen.getByTestId('connect-metamask-header')
      fireEvent.click(metamaskTab)

      expect(
        screen.getByTestId('connect-metamask-component')
      ).toBeInTheDocument()
    })

    it('applies selected styling to the active tab', () => {
      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      const metamaskTab = screen.getByTestId('connect-metamask-header')
      expect(metamaskTab).toHaveClass('border-b-white')
    })
  })

  describe('Wallet Connection State', () => {
    it('shows connected state for Metamask when wallet is connected', () => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.METAMASK,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      const metamaskTab = screen.getByTestId('connect-metamask-header')
      expect(metamaskTab).toHaveTextContent('Connected')
    })

    it('initializes with Metamask tab when connected to Metamask', () => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.METAMASK,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      expect(
        screen.getByTestId('connect-metamask-component')
      ).toBeInTheDocument()
    })

    it('defaults to Metamask tab when no wallet is connected', () => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.NONE,
        account: null,
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      expect(
        screen.getByTestId('connect-metamask-component')
      ).toBeInTheDocument()
    })
  })

  describe('Continue Functionality', () => {
    it('calls onClose when continue is clicked without nextStep', () => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.METAMASK,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      const continueButton = screen.getByTestId('continue-btn')
      fireEvent.click(continueButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not close modal when continue is clicked with nextStep', () => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.METAMASK,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      const nextStep = <div>Next Step</div>

      render(
        <ConnectToBlockchainModel onClose={mockOnClose} nextStep={nextStep} />
      )

      const continueButton = screen.getByTestId('continue-btn')
      fireEvent.click(continueButton)

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Props Handling', () => {
    it('passes showNetworkSection prop to ConnectToMetamask component', () => {
      render(
        <ConnectToBlockchainModel onClose={mockOnClose} showNetworkSection />
      )

      expect(
        screen.getByTestId('connect-metamask-component')
      ).toBeInTheDocument()
    })

    it('passes nextStep prop to ConnectToMetamask component', () => {
      const nextStep = <div>Next Step Content</div>

      render(
        <ConnectToBlockchainModel onClose={mockOnClose} nextStep={nextStep} />
      )

      expect(
        screen.getByTestId('connect-metamask-component')
      ).toBeInTheDocument()
    })

    it('shows warning message when showOnNewConnectWarningMessage is true', () => {
      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      expect(screen.getByText('Warning Message')).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('displays Metamask wallet icon', () => {
      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      const metamaskTab = screen.getByTestId('connect-metamask-header')
      const walletImage = metamaskTab.querySelector('img')

      expect(walletImage).toHaveAttribute('src', '/images/wallet.png')
      expect(walletImage).toHaveAttribute('alt', 'Metamask')
    })

    it('displays MagicLink wallet icon', () => {
      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      const magicTab = screen.getByTestId('connect-magic-header')
      const magicImage = magicTab.querySelector('img')

      expect(magicImage).toHaveAttribute('src', '/images/magic_link.svg')
      expect(magicImage).toHaveAttribute('alt', 'MagicLink')
    })

    it('shows active dot indicator when wallet is connected', () => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.METAMASK,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      const metamaskTab = screen.getByTestId('connect-metamask-header')
      const activeDot = metamaskTab.querySelector('.active-dot')

      expect(activeDot).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper tab structure with unique IDs', () => {
      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      expect(document.getElementById('tab-Metamask')).toBeTruthy()
      expect(document.getElementById('tab-Magic')).toBeTruthy()
    })

    it('renders overlay component', () => {
      render(<ConnectToBlockchainModel onClose={mockOnClose} />)

      expect(screen.getByTestId('overlay')).toBeInTheDocument()
    })
  })
})
