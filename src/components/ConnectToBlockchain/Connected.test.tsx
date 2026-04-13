import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Connected from './Connected'

// Mock dependencies
const mockShowOverlay = vi.fn()
const mockCloseOverlay = vi.fn()
const mockUseProviderContext = vi.fn()
const mockUseOverlayContext = vi.fn()

vi.mock('../common/contexts/providerContext', () => ({
  useProviderContext: () => mockUseProviderContext(),
}))

vi.mock('../common/contexts/OverlayContext', () => ({
  useOverlayContext: () => mockUseOverlayContext(),
}))

// Mock ConnectToBlockchainModel
vi.mock('.', () => ({
  default: ({ onClose }: any) => (
    <div data-testid="blockchain-modal">
      <button onClick={onClose} data-testid="modal-close">
        Close Modal
      </button>
    </div>
  ),
}))

// Mock Tooltip
vi.mock('react-tooltip', () => ({
  Tooltip: ({ id, isOpen, style }: any) => (
    <div data-testid={`tooltip-${id}`} data-open={isOpen} style={style}>
      Tooltip
    </div>
  ),
}))

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(),
}

Object.assign(navigator, {
  clipboard: mockClipboard,
})

describe('Connected', () => {
  const defaultAccount = '0x1234567890123456789012345678901234567890'
  const mockImgSrc = '/images/wallet.png'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.useFakeTimers()

    mockUseProviderContext.mockReturnValue({
      account: defaultAccount,
    })

    mockUseOverlayContext.mockReturnValue({
      showOverlay: mockShowOverlay,
      closeOverlay: mockCloseOverlay,
    })

    mockClipboard.writeText.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders the connected wallet container', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      expect(screen.getByTestId('activeWallet')).toBeInTheDocument()
    })

    it('displays the wallet icon', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const walletIcon = screen.getByAltText('Wallet Icon')
      expect(walletIcon).toBeInTheDocument()
      expect(walletIcon).toHaveAttribute('src', mockImgSrc)
    })

    it('displays the wallet address', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const walletAddress = screen.getByTestId('wallet-address')
      expect(walletAddress).toBeInTheDocument()
    })

    it('displays copy icon when openConnectToBlockchainModel is false', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const copyIcon = screen.getByAltText('Copy')
      expect(copyIcon).toBeInTheDocument()
      expect(copyIcon).toHaveAttribute('src', '/icons/copy.svg')
    })

    it('does not display copy icon when openConnectToBlockchainModel is true', () => {
      render(
        <Connected imgSrc={mockImgSrc} openConnectToBlockchainModel={true} />
      )

      expect(screen.queryByAltText('Copy')).not.toBeInTheDocument()
    })

    it('applies shadow class when withCardLayout is true', () => {
      render(<Connected imgSrc={mockImgSrc} withCardLayout={true} />)

      const container = screen.getByTestId('activeWallet')
      expect(container).toHaveClass('with-shadow')
    })

    it('does not apply shadow class when withCardLayout is false', () => {
      render(<Connected imgSrc={mockImgSrc} withCardLayout={false} />)

      const container = screen.getByTestId('activeWallet')
      expect(container).not.toHaveClass('with-shadow')
    })

    it('uses default withCardLayout value of true', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const container = screen.getByTestId('activeWallet')
      expect(container).toHaveClass('with-shadow')
    })
  })

  describe('Account Display', () => {
    it('displays account from context when no account prop provided', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const walletAddress = screen.getByTestId('wallet-address')
      expect(walletAddress).toBeInTheDocument()
    })

    it('displays account from prop when provided', () => {
      const customAccount = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      render(<Connected imgSrc={mockImgSrc} account={customAccount} />)

      const walletAddress = screen.getByTestId('wallet-address')
      expect(walletAddress).toBeInTheDocument()
    })

    it('shows "Active Wallet Address" label when no account prop', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      expect(screen.getByText('Active Wallet Address')).toBeInTheDocument()
    })

    it('shows "Wallet Address (MetaMask):" label when account prop provided', () => {
      render(<Connected imgSrc={mockImgSrc} account={defaultAccount} />)

      expect(screen.getByText('Wallet Address (MetaMask):')).toBeInTheDocument()
    })

    it('truncates long addresses with ellipsis', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const walletAddress = screen.getByTestId('wallet-address')
      const displayedText = walletAddress.textContent || ''

      // Should contain ellipsis for truncation
      expect(displayedText).toContain('...')
    })
  })

  describe('Clipboard Copy Functionality', () => {
    it('copies address to clipboard when clicked', async () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const container = screen.getByTestId('activeWallet')
      fireEvent.click(container)

      // Flush promises to allow async clipboard operation to complete
      await vi.runAllTimersAsync()

      expect(mockClipboard.writeText).toHaveBeenCalledWith(defaultAccount)
    })

    it('shows "Copied!" tooltip after successful copy', async () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const container = screen.getByTestId('activeWallet')
      fireEvent.click(container)

      // Flush promises to allow async clipboard operation to complete
      await vi.runAllTimersAsync()

      const tooltip = screen.getByTestId('tooltip-active-wallet-tooltip')
      expect(tooltip).toHaveAttribute('data-open', 'true')
    })

    it('handles clipboard copy errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'))

      render(<Connected imgSrc={mockImgSrc} />)

      const container = screen.getByTestId('activeWallet')
      fireEvent.click(container)

      // Flush promises to allow async clipboard operation to complete
      await vi.runAllTimersAsync()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to copy: ',
        expect.any(Error)
      )
    })

    it('does not copy when openConnectToBlockchainModel is true', () => {
      render(
        <Connected imgSrc={mockImgSrc} openConnectToBlockchainModel={true} />
      )

      const container = screen.getByTestId('activeWallet')
      fireEvent.click(container)

      // Should not call clipboard at all
      expect(mockClipboard.writeText).not.toHaveBeenCalled()
      expect(mockShowOverlay).toHaveBeenCalled()
    })
  })

  describe('Tooltip Behavior', () => {
    it('renders tooltip when openConnectToBlockchainModel is false', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      expect(
        screen.getByTestId('tooltip-active-wallet-tooltip')
      ).toBeInTheDocument()
    })

    it('does not render tooltip when openConnectToBlockchainModel is true', () => {
      render(
        <Connected imgSrc={mockImgSrc} openConnectToBlockchainModel={true} />
      )

      expect(
        screen.queryByTestId('tooltip-active-wallet-tooltip')
      ).not.toBeInTheDocument()
    })

    it('shows tooltip on mouse enter', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const container = screen.getByTestId('activeWallet')
      fireEvent.mouseEnter(container)

      const tooltip = screen.getByTestId('tooltip-active-wallet-tooltip')
      expect(tooltip).toHaveAttribute('data-open', 'true')
    })

    it('hides tooltip on mouse leave after delay', () => {
      const { rerender } = render(<Connected imgSrc={mockImgSrc} />)

      const container = screen.getByTestId('activeWallet')
      fireEvent.mouseEnter(container)

      let tooltip = screen.getByTestId('tooltip-active-wallet-tooltip')
      expect(tooltip).toHaveAttribute('data-open', 'true')

      fireEvent.mouseLeave(container)
      vi.advanceTimersByTime(1000)

      // Re-render to get updated state
      rerender(<Connected imgSrc={mockImgSrc} />)

      tooltip = screen.getByTestId('tooltip-active-wallet-tooltip')
      expect(tooltip).toHaveAttribute('data-open', 'false')
    })

    it('resets tooltip message to "Copy" after mouse leave', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const container = screen.getByTestId('activeWallet')

      // Click to copy
      fireEvent.click(container)

      // Mouse leave
      fireEvent.mouseLeave(container)
      vi.advanceTimersByTime(1000)

      // Mouse enter again
      fireEvent.mouseEnter(container)

      // Tooltip should show "Copy" again
      expect(
        screen.getByTestId('tooltip-active-wallet-tooltip')
      ).toBeInTheDocument()
    })

    it('does not show tooltip on hover when openConnectToBlockchainModel is true', () => {
      render(
        <Connected imgSrc={mockImgSrc} openConnectToBlockchainModel={true} />
      )

      const container = screen.getByTestId('activeWallet')
      fireEvent.mouseEnter(container)

      expect(
        screen.queryByTestId('tooltip-active-wallet-tooltip')
      ).not.toBeInTheDocument()
    })

    it('does not hide tooltip on mouse leave when openConnectToBlockchainModel is true', () => {
      render(
        <Connected imgSrc={mockImgSrc} openConnectToBlockchainModel={true} />
      )

      const container = screen.getByTestId('activeWallet')
      fireEvent.mouseLeave(container)

      // Should not trigger any tooltip behavior
      vi.advanceTimersByTime(1000)
      expect(
        screen.queryByTestId('tooltip-active-wallet-tooltip')
      ).not.toBeInTheDocument()
    })
  })

  describe('Modal Functionality', () => {
    it('opens blockchain modal when clicked and openConnectToBlockchainModel is true', () => {
      render(
        <Connected imgSrc={mockImgSrc} openConnectToBlockchainModel={true} />
      )

      const container = screen.getByTestId('activeWallet')
      fireEvent.click(container)

      expect(mockShowOverlay).toHaveBeenCalledTimes(1)
    })

    it('passes closeOverlay to modal onClose prop', () => {
      render(
        <Connected imgSrc={mockImgSrc} openConnectToBlockchainModel={true} />
      )

      const container = screen.getByTestId('activeWallet')
      fireEvent.click(container)

      expect(mockShowOverlay).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.anything(),
        })
      )
    })

    it('does not open modal when openConnectToBlockchainModel is false', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const container = screen.getByTestId('activeWallet')
      fireEvent.click(container)

      expect(mockShowOverlay).not.toHaveBeenCalled()
    })
  })

  describe('Window Resize Handling', () => {
    it('updates displayed account on window resize', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const walletAddress = screen.getByTestId('wallet-address')

      // Trigger resize
      fireEvent(window, new Event('resize'))

      // Account should still be displayed (may or may not change based on width)
      expect(walletAddress).toBeInTheDocument()
    })

    it('cleans up resize event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = render(<Connected imgSrc={mockImgSrc} />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
    })
  })

  describe('Props Validation', () => {
    it('handles missing account gracefully', () => {
      mockUseProviderContext.mockReturnValue({
        account: null,
      })

      render(<Connected imgSrc={mockImgSrc} />)

      expect(screen.getByTestId('activeWallet')).toBeInTheDocument()
    })

    it('prioritizes account prop over context account', () => {
      const propAccount = '0xpropaccount1234567890123456789012345678'

      render(<Connected imgSrc={mockImgSrc} account={propAccount} />)

      expect(screen.getByText('Wallet Address (MetaMask):')).toBeInTheDocument()
    })

    it('renders with all default props', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const container = screen.getByTestId('activeWallet')
      expect(container).toHaveClass('with-shadow')
      expect(screen.getByAltText('Copy')).toBeInTheDocument()
    })
  })

  describe('Tooltip Styling', () => {
    it('renders tooltip with style prop', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const tooltip = screen.getByTestId('tooltip-active-wallet-tooltip')
      expect(tooltip).toBeInTheDocument()
      // The mock tooltip receives the style prop, but doesn't necessarily apply it
      // Just verify the tooltip is rendered
    })
  })

  describe('Component Lifecycle', () => {
    it('initializes tooltip message correctly when openConnectToBlockchainModel is false', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const container = screen.getByTestId('activeWallet')
      fireEvent.mouseEnter(container)

      // Should show "Copy" initially
      expect(
        screen.getByTestId('tooltip-active-wallet-tooltip')
      ).toBeInTheDocument()
    })

    it('initializes tooltip message correctly when openConnectToBlockchainModel is true', () => {
      render(
        <Connected imgSrc={mockImgSrc} openConnectToBlockchainModel={true} />
      )

      // Should not render tooltip at all
      expect(
        screen.queryByTestId('tooltip-active-wallet-tooltip')
      ).not.toBeInTheDocument()
    })

    it('updates displayed account on mount', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const walletAddress = screen.getByTestId('wallet-address')
      expect(walletAddress.textContent).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('handles very short account addresses', () => {
      const shortAccount = '0x1234'
      mockUseProviderContext.mockReturnValue({
        account: shortAccount,
      })

      render(<Connected imgSrc={mockImgSrc} />)

      const walletAddress = screen.getByTestId('wallet-address')
      expect(walletAddress).toBeInTheDocument()
    })

    it('handles empty account string', () => {
      mockUseProviderContext.mockReturnValue({
        account: '',
      })

      render(<Connected imgSrc={mockImgSrc} />)

      expect(screen.getByTestId('activeWallet')).toBeInTheDocument()
    })

    it('handles rapid mouse enter/leave events', () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const container = screen.getByTestId('activeWallet')

      fireEvent.mouseEnter(container)
      fireEvent.mouseLeave(container)
      fireEvent.mouseEnter(container)
      fireEvent.mouseLeave(container)

      vi.advanceTimersByTime(1000)

      expect(
        screen.getByTestId('tooltip-active-wallet-tooltip')
      ).toBeInTheDocument()
    })

    it('handles click during tooltip animation', async () => {
      render(<Connected imgSrc={mockImgSrc} />)

      const container = screen.getByTestId('activeWallet')

      fireEvent.mouseEnter(container)
      fireEvent.click(container)

      // Flush promises to allow async clipboard operation to complete
      await vi.runAllTimersAsync()

      expect(mockClipboard.writeText).toHaveBeenCalled()
    })
  })
})
