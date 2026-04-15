import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ConnectToMetamask, { ConnectToMetamaskModelComponent } from './index'
import { SIGNER_TYPE } from '../common/contexts/providerContext'

// Mock dependencies
const mockUpgradeToMetaMaskSigner = vi.fn()
const mockDisconnectWallet = vi.fn()
const mockShowOverlay = vi.fn()
const mockCloseOverlay = vi.fn()
const mockUseProviderContext = vi.fn()
const mockUseOverlayContext = vi.fn()

vi.mock('../common/contexts/providerContext', async () => {
  const actual = await vi.importActual('../common/contexts/providerContext')
  return {
    ...actual,
    useProviderContext: () => mockUseProviderContext(),
  }
})

vi.mock('../common/contexts/OverlayContext', () => ({
  useOverlayContext: () => mockUseOverlayContext(),
}))

// Mock Connected component
vi.mock('../ConnectToBlockchain/Connected', () => ({
  default: ({ imgSrc, openConnectToBlockchainModel, withCardLayout }: any) => (
    <div data-testid="connected-component">
      <img src={imgSrc} alt="Connected" />
      <div>Connected Component</div>
      <div data-testid="open-modal">{String(openConnectToBlockchainModel)}</div>
      <div data-testid="with-card">{String(withCardLayout)}</div>
    </div>
  ),
}))

// Mock PrimaryButton component
vi.mock('../common/PrimaryButton', () => ({
  default: ({
    children,
    onClick,
    'data-testid': testId,
    disabled,
    ...props
  }: any) => (
    <button
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}))

// Mock Button component
vi.mock('../common/Button', () => ({
  Button: ({
    children,
    onClick,
    'data-testid': testId,
    disabled,
    ...props
  }: any) => (
    <button
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
  ButtonSize: {
    XS: 'XS',
    SM: 'SM',
    MD: 'MD',
    LG: 'LG',
    FLEX: 'FLEX',
  },
}))

describe('ConnectToMetamask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset console mocks
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // Set default mock return values
    mockUseProviderContext.mockReturnValue({
      providerType: SIGNER_TYPE.NONE,
      account: null,
      upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
      disconnectWallet: mockDisconnectWallet,
    })

    mockUseOverlayContext.mockReturnValue({
      showOverlay: mockShowOverlay,
      closeOverlay: mockCloseOverlay,
    })
  })

  describe('Rendering - Not Connected State', () => {
    it('renders the connect button when not connected', () => {
      render(<ConnectToMetamask />)

      const connectButton = screen.getByTestId('connectToMetamask')
      expect(connectButton).toBeInTheDocument()
      expect(screen.getByText('Connect with Metamask')).toBeInTheDocument()
    })

    it('displays the wallet icon', () => {
      render(<ConnectToMetamask />)

      const walletImage = screen.getByAltText('MetaMask')
      expect(walletImage).toBeInTheDocument()
      expect(walletImage).toHaveAttribute('src', '/images/wallet.png')
    })

    it('applies custom className when provided', () => {
      const { container } = render(
        <ConnectToMetamask className="custom-class" />
      )

      const connectContainer = container.querySelector(
        '.connect-metamask-container'
      )
      expect(connectContainer).toHaveClass('custom-class')
    })

    it('renders with default className when not provided', () => {
      const { container } = render(<ConnectToMetamask />)

      const connectContainer = container.querySelector(
        '.connect-metamask-container'
      )
      expect(connectContainer).toBeInTheDocument()
    })
  })

  describe('Rendering - Connected State', () => {
    beforeEach(() => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.METAMASK,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })
    })

    it('renders Connected component when wallet is connected', () => {
      render(<ConnectToMetamask />)

      expect(screen.getByTestId('connected-component')).toBeInTheDocument()
      expect(screen.getByText('Connected Component')).toBeInTheDocument()
    })

    it('does not render connect button when connected', () => {
      render(<ConnectToMetamask />)

      expect(screen.queryByTestId('connectToMetamask')).not.toBeInTheDocument()
    })

    it('passes correct props to Connected component', () => {
      render(
        <ConnectToMetamask
          openConnectToBlockchainModel={true}
          withCardLayout={true}
        />
      )

      expect(screen.getByTestId('open-modal')).toHaveTextContent('true')
      expect(screen.getByTestId('with-card')).toHaveTextContent('true')
    })

    it('passes default props to Connected component when not specified', () => {
      render(<ConnectToMetamask />)

      expect(screen.getByTestId('open-modal')).toHaveTextContent('false')
      expect(screen.getByTestId('with-card')).toHaveTextContent('false')
    })
  })

  describe('Wallet Connection', () => {
    it('calls upgradeToMetaMaskSigner when connect button is clicked', async () => {
      mockUpgradeToMetaMaskSigner.mockResolvedValue(undefined)

      render(<ConnectToMetamask />)

      const connectButton = screen.getByTestId('connectToMetamask')
      fireEvent.click(connectButton)

      await waitFor(() => {
        expect(mockUpgradeToMetaMaskSigner).toHaveBeenCalledTimes(1)
      })
    })

    it('logs debug information when connecting', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      mockUpgradeToMetaMaskSigner.mockResolvedValue(undefined)

      render(<ConnectToMetamask />)

      const connectButton = screen.getByTestId('connectToMetamask')
      fireEvent.click(connectButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('handleConnectWallet clicked!')
        expect(consoleSpy).toHaveBeenCalledWith(
          'About to call upgradeToMetaMaskSigner...'
        )
        expect(consoleSpy).toHaveBeenCalledWith(
          'upgradeToMetaMaskSigner completed'
        )
      })
    })

    it('handles successful connection', async () => {
      mockUpgradeToMetaMaskSigner.mockResolvedValue(undefined)

      render(<ConnectToMetamask />)

      const connectButton = screen.getByTestId('connectToMetamask')
      fireEvent.click(connectButton)

      await waitFor(() => {
        expect(mockUpgradeToMetaMaskSigner).toHaveBeenCalled()
      })

      // Should not show any error
      expect(console.error).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles error when upgradeToMetaMaskSigner fails', async () => {
      const error = { message: 'User rejected request', code: 4001 }
      mockUpgradeToMetaMaskSigner.mockRejectedValue(error)

      render(<ConnectToMetamask />)

      const connectButton = screen.getByTestId('connectToMetamask')
      fireEvent.click(connectButton)

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error in handleConnectWallet:',
          error
        )
      })
    })

    it('calls handleMetamaskError with correct parameters on user rejection', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const error = { message: 'User rejected request', code: 4001 }
      mockUpgradeToMetaMaskSigner.mockRejectedValue(error)

      render(<ConnectToMetamask />)

      const connectButton = screen.getByTestId('connectToMetamask')
      fireEvent.click(connectButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'handleMetamaskError called:',
          'User rejected request',
          4001
        )
      })
    })

    it('handles MetaMask not installed error', async () => {
      const error = { message: 'MetaMask is not installed', code: -32002 }
      mockUpgradeToMetaMaskSigner.mockRejectedValue(error)

      render(<ConnectToMetamask />)

      const connectButton = screen.getByTestId('connectToMetamask')
      fireEvent.click(connectButton)

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error in handleConnectWallet:',
          error
        )
      })
    })

    it('handles generic connection errors', async () => {
      const error = { message: 'Network error', code: 500 }
      mockUpgradeToMetaMaskSigner.mockRejectedValue(error)

      render(<ConnectToMetamask />)

      const connectButton = screen.getByTestId('connectToMetamask')
      fireEvent.click(connectButton)

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error in handleConnectWallet:',
          error
        )
      })
    })
  })

  describe('Component Lifecycle', () => {
    it('logs component render', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      render(<ConnectToMetamask />)

      expect(consoleSpy).toHaveBeenCalledWith(
        'ConnectToMetamask component rendered'
      )
    })

    it('re-renders when provider context changes', () => {
      const { rerender } = render(<ConnectToMetamask />)

      expect(screen.getByTestId('connectToMetamask')).toBeInTheDocument()

      // Update to connected state
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.METAMASK,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      rerender(<ConnectToMetamask />)

      expect(screen.queryByTestId('connectToMetamask')).not.toBeInTheDocument()
      expect(screen.getByTestId('connected-component')).toBeInTheDocument()
    })
  })
})

describe('ConnectToMetamaskModelComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})

    mockUseProviderContext.mockReturnValue({
      providerType: SIGNER_TYPE.NONE,
      account: null,
      upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
      disconnectWallet: mockDisconnectWallet,
    })
  })

  describe('Rendering - Not Connected', () => {
    it('renders ConnectToMetamask component', () => {
      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
        />
      )

      expect(screen.getByTestId('connectToMetamask')).toBeInTheDocument()
    })

    it('does not show connected text when not connected', () => {
      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
        />
      )

      expect(screen.queryByText('Connected as:')).not.toBeInTheDocument()
    })

    it('does not show disconnect button when not connected', () => {
      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
        />
      )

      expect(
        screen.queryByTestId('disconnect-metamask')
      ).not.toBeInTheDocument()
    })

    it('does not show continue button when not connected', () => {
      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
        />
      )

      expect(
        screen.queryByTestId('connect-blockchain-continue')
      ).not.toBeInTheDocument()
    })
  })

  describe('Rendering - Connected State', () => {
    beforeEach(() => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.METAMASK,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })
    })

    it('shows connected text when connected', () => {
      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
        />
      )

      expect(screen.getByText('Connected as:')).toBeInTheDocument()
    })

    it('shows disconnect button when connected', () => {
      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
        />
      )

      const disconnectButton = screen.getByText('Disconnect')
      expect(disconnectButton).toBeInTheDocument()
      expect(disconnectButton).toHaveClass('connect-metamask-disconnect-btn')
    })

    it('shows continue button when connected', () => {
      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
        />
      )

      const continueButton = screen.getByTestId('connect-blockchain-continue')
      expect(continueButton).toBeInTheDocument()
      expect(continueButton).toHaveTextContent('Continue')
    })

    it('renders Connected component', () => {
      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
        />
      )

      expect(screen.getByTestId('connected-component')).toBeInTheDocument()
    })
  })

  describe('Warning Message', () => {
    it('does not show warning when showOnNewConnectWarningMessage is false', () => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.MAGIC,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
        />
      )

      expect(
        screen.queryByText(/You'll be logged out of MagicLink/)
      ).not.toBeInTheDocument()
    })

    it('shows warning when connected to MagicLink and showOnNewConnectWarningMessage is true', () => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.MAGIC,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={true}
        />
      )

      expect(
        screen.getByText(
          /You'll be logged out of MagicLink if you login with Metamask/
        )
      ).toBeInTheDocument()
    })

    it('displays warning icon', () => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.MAGIC,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={true}
        />
      )

      const warningIcon = screen.getByAltText('Warning')
      expect(warningIcon).toBeInTheDocument()
      expect(warningIcon).toHaveAttribute('src', '/icons/warning.svg')
    })

    it('does not show warning when connected to Metamask', () => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.METAMASK,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={true}
        />
      )

      expect(
        screen.queryByText(/You'll be logged out of MagicLink/)
      ).not.toBeInTheDocument()
    })

    it('does not show warning when not connected to any wallet', () => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.NONE,
        account: null,
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={true}
        />
      )

      expect(
        screen.queryByText(/You'll be logged out of MagicLink/)
      ).not.toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    beforeEach(() => {
      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.METAMASK,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })
    })

    it('calls disconnectWallet when disconnect button is clicked', () => {
      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
        />
      )

      const disconnectButton = screen.getByText('Disconnect')
      fireEvent.click(disconnectButton)

      expect(mockDisconnectWallet).toHaveBeenCalledTimes(1)
    })

    it('calls handleContinue when continue button is clicked', () => {
      const handleContinue = vi.fn()

      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
          handleContinue={handleContinue}
        />
      )

      const continueButton = screen.getByTestId('connect-blockchain-continue')
      fireEvent.click(continueButton)

      expect(handleContinue).toHaveBeenCalledTimes(1)
    })

    it('does not error when continue is clicked without handleContinue prop', () => {
      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
        />
      )

      const continueButton = screen.getByTestId('connect-blockchain-continue')

      expect(() => {
        fireEvent.click(continueButton)
      }).not.toThrow()
    })
  })

  describe('Props Handling', () => {
    it('handles showNetworkSection prop', () => {
      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
          showNetworkSection={true}
        />
      )

      // Component should render without errors
      expect(screen.getByTestId('connectToMetamask')).toBeInTheDocument()
    })

    it('handles nextStep prop', () => {
      const nextStep = <div data-testid="next-step">Next Step Content</div>

      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
          nextStep={nextStep}
        />
      )

      // Component should render without errors
      expect(screen.getByTestId('connectToMetamask')).toBeInTheDocument()
    })
  })

  describe('Console Logging', () => {
    it('logs provider type and account', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      mockUseProviderContext.mockReturnValue({
        providerType: SIGNER_TYPE.METAMASK,
        account: '0x1234567890123456789012345678901234567890',
        upgradeToMetaMaskSigner: mockUpgradeToMetaMaskSigner,
        disconnectWallet: mockDisconnectWallet,
      })

      render(
        <ConnectToMetamaskModelComponent
          showOnNewConnectWarningMessage={false}
        />
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        SIGNER_TYPE.METAMASK,
        '0x1234567890123456789012345678901234567890'
      )
    })
  })
})
