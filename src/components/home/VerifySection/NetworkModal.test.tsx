import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NetworkModal from './NetworkModal'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultProps = {
  isDarkMode: false,
  fileName: 'document.tt',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  networkType: 'testnet' as const,
}

// The dropdown toggle button has class nm-dropdown-btn
const getDropdownToggle = () =>
  document.querySelector('button.nm-dropdown-btn') as HTMLElement

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NetworkModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the header title', () => {
      render(<NetworkModal {...defaultProps} />)
      expect(screen.getByText('TrustVC Document Uploaded')).toBeInTheDocument()
    })

    it('renders the fileName in the header', () => {
      render(<NetworkModal {...defaultProps} fileName="my-doc.tt" />)
      expect(screen.getByText('my-doc.tt')).toBeInTheDocument()
    })

    it('does not render the fileName when it is empty', () => {
      render(<NetworkModal {...defaultProps} fileName="" />)
      // Only the title should appear, not an empty filename
      expect(screen.getByText('TrustVC Document Uploaded')).toBeInTheDocument()
    })

    it('renders the subtitle text', () => {
      render(<NetworkModal {...defaultProps} />)
      expect(
        screen.getByText('Select network for document verification.')
      ).toBeInTheDocument()
    })

    it('renders the Select Network label', () => {
      render(<NetworkModal {...defaultProps} />)
      expect(screen.getByText('Select Network:')).toBeInTheDocument()
    })

    it('renders Cancel and Proceed buttons', () => {
      render(<NetworkModal {...defaultProps} />)
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /proceed/i })
      ).toBeInTheDocument()
    })

    it('renders the info button with aria-label "Network selector info"', () => {
      render(<NetworkModal {...defaultProps} />)
      expect(
        screen.getByRole('button', { name: /network selector info/i })
      ).toBeInTheDocument()
    })

    it('shows Sepolia as the default selected network in testnet mode', () => {
      render(<NetworkModal {...defaultProps} />)
      expect(getDropdownToggle().textContent).toContain('Sepolia')
    })
  })

  // ── Scroll lock ────────────────────────────────────────────────────────────

  describe('scroll lock', () => {
    it('sets body overflow to hidden on mount', () => {
      render(<NetworkModal {...defaultProps} />)
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores the previous body overflow on unmount', () => {
      document.body.style.overflow = 'scroll'
      const { unmount } = render(<NetworkModal {...defaultProps} />)
      expect(document.body.style.overflow).toBe('hidden')
      unmount()
      expect(document.body.style.overflow).toBe('scroll')
    })
  })

  // ── Network filtering ──────────────────────────────────────────────────────

  describe('network filtering by networkType prop', () => {
    describe('testnet mode', () => {
      it('shows only Testnet group header', () => {
        render(<NetworkModal {...defaultProps} networkType="testnet" />)
        fireEvent.click(getDropdownToggle())
        expect(screen.getAllByText('Testnet').length).toBeGreaterThan(0)
        expect(screen.queryByText('Mainnet')).not.toBeInTheDocument()
      })

      it('shows testnet networks but not mainnet networks', () => {
        render(<NetworkModal {...defaultProps} networkType="testnet" />)
        fireEvent.click(getDropdownToggle())
        expect(screen.getAllByText('Sepolia').length).toBeGreaterThan(0)
        expect(screen.getByText('Polygon Amoy')).toBeInTheDocument()
        expect(screen.getByText('Apothem')).toBeInTheDocument()
        expect(screen.queryByText('Polygon')).not.toBeInTheDocument()
        expect(screen.queryByText('XDC Network')).not.toBeInTheDocument()
      })

      it('defaults to Sepolia (chainId 11155111)', () => {
        render(<NetworkModal {...defaultProps} networkType="testnet" />)
        expect(getDropdownToggle().textContent).toContain('Sepolia')
      })

      it('calls onConfirm with testnet chainId when Proceed is clicked', () => {
        const onConfirm = vi.fn()
        render(
          <NetworkModal
            {...defaultProps}
            networkType="testnet"
            onConfirm={onConfirm}
          />
        )
        fireEvent.click(screen.getByRole('button', { name: /proceed/i }))
        expect(onConfirm).toHaveBeenCalledWith('11155111')
      })
    })

    describe('mainnet mode', () => {
      it('shows only Mainnet group header', () => {
        render(<NetworkModal {...defaultProps} networkType="mainnet" />)
        fireEvent.click(getDropdownToggle())
        expect(screen.getAllByText('Mainnet').length).toBeGreaterThan(0)
        expect(screen.queryByText('Testnet')).not.toBeInTheDocument()
      })

      it('shows mainnet networks but not testnet networks', () => {
        render(<NetworkModal {...defaultProps} networkType="mainnet" />)
        fireEvent.click(getDropdownToggle())
        expect(screen.getAllByText('Ethereum').length).toBeGreaterThan(0)
        expect(screen.getByText('Polygon')).toBeInTheDocument()
        expect(screen.getByText('XDC Network')).toBeInTheDocument()
        expect(screen.queryByText('Sepolia')).not.toBeInTheDocument()
        expect(screen.queryByText('Polygon Amoy')).not.toBeInTheDocument()
      })

      it('defaults to Ethereum (chainId 1)', () => {
        render(<NetworkModal {...defaultProps} networkType="mainnet" />)
        expect(getDropdownToggle().textContent).toContain('Ethereum')
      })

      it('calls onConfirm with mainnet chainId when Proceed is clicked', () => {
        const onConfirm = vi.fn()
        render(
          <NetworkModal
            {...defaultProps}
            networkType="mainnet"
            onConfirm={onConfirm}
          />
        )
        fireEvent.click(screen.getByRole('button', { name: /proceed/i }))
        expect(onConfirm).toHaveBeenCalledWith('1')
      })

      it('allows selecting a different mainnet network before confirming', () => {
        const onConfirm = vi.fn()
        render(
          <NetworkModal
            {...defaultProps}
            networkType="mainnet"
            onConfirm={onConfirm}
          />
        )
        fireEvent.click(getDropdownToggle())
        fireEvent.click(screen.getByText('Polygon'))
        fireEvent.click(screen.getByRole('button', { name: /proceed/i }))
        expect(onConfirm).toHaveBeenCalledWith('137')
      })
    })
  })

  // ── Dropdown ───────────────────────────────────────────────────────────────

  describe('dropdown', () => {
    it('is closed by default — network options are not visible', () => {
      render(<NetworkModal {...defaultProps} />)
      expect(screen.queryByText('Polygon Amoy')).not.toBeInTheDocument()
      expect(screen.queryByText('Apothem')).not.toBeInTheDocument()
    })

    it('opens and shows all testnet options when the toggle is clicked', () => {
      render(<NetworkModal {...defaultProps} />)
      fireEvent.click(getDropdownToggle())
      expect(screen.getAllByText('Sepolia').length).toBeGreaterThan(0)
      expect(screen.getByText('Polygon Amoy')).toBeInTheDocument()
      expect(screen.getByText('Apothem')).toBeInTheDocument()
      expect(screen.getByText('Astron Testnet')).toBeInTheDocument()
    })

    it('closes when the toggle is clicked a second time', () => {
      render(<NetworkModal {...defaultProps} />)
      fireEvent.click(getDropdownToggle())
      expect(screen.getByText('Polygon Amoy')).toBeInTheDocument()
      fireEvent.click(getDropdownToggle())
      expect(screen.queryByText('Polygon Amoy')).not.toBeInTheDocument()
    })

    it('selects the clicked network and closes the dropdown', () => {
      render(<NetworkModal {...defaultProps} />)
      fireEvent.click(getDropdownToggle())
      fireEvent.click(screen.getByText('Polygon Amoy'))
      // Dropdown should be closed
      expect(screen.queryByText('Apothem')).not.toBeInTheDocument()
      // Polygon Amoy should now appear in the toggle
      expect(getDropdownToggle().textContent).toContain('Polygon Amoy')
    })

    it('closes when the backdrop overlay is clicked', () => {
      render(<NetworkModal {...defaultProps} />)
      fireEvent.click(getDropdownToggle())
      expect(screen.getByText('Polygon Amoy')).toBeInTheDocument()
      const backdrop = document.querySelector(
        '.fixed.inset-0.z-\\[9\\]'
      ) as HTMLElement
      fireEvent.click(backdrop)
      expect(screen.queryByText('Polygon Amoy')).not.toBeInTheDocument()
    })
  })

  // ── Tooltip ────────────────────────────────────────────────────────────────

  describe('tooltip', () => {
    it('is hidden by default', () => {
      render(<NetworkModal {...defaultProps} />)
      expect(screen.queryByText('Network Selector')).not.toBeInTheDocument()
    })

    it('appears when hovering over the info button', () => {
      render(<NetworkModal {...defaultProps} />)
      fireEvent.mouseEnter(
        screen.getByRole('button', { name: /network selector info/i })
      )
      expect(screen.getByText('Network Selector')).toBeInTheDocument()
      expect(
        screen.getByText(/A document can only be successfully verified/)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/If unsure, do check with the document issuer/)
      ).toBeInTheDocument()
    })

    it('disappears when the mouse leaves the info button', () => {
      render(<NetworkModal {...defaultProps} />)
      const infoBtn = screen.getByRole('button', {
        name: /network selector info/i,
      })
      fireEvent.mouseEnter(infoBtn)
      expect(screen.getByText('Network Selector')).toBeInTheDocument()
      fireEvent.mouseLeave(infoBtn)
      expect(screen.queryByText('Network Selector')).not.toBeInTheDocument()
    })
  })

  // ── Callbacks ──────────────────────────────────────────────────────────────

  describe('callbacks', () => {
    it('calls onCancel when the Cancel button is clicked', () => {
      render(<NetworkModal {...defaultProps} />)
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
    })

    it('calls onConfirm with chainId "11155111" (Sepolia) by default', () => {
      render(<NetworkModal {...defaultProps} />)
      fireEvent.click(screen.getByRole('button', { name: /proceed/i }))
      expect(defaultProps.onConfirm).toHaveBeenCalledWith('11155111')
    })

    it('calls onConfirm with the newly selected chainId after changing network', () => {
      render(<NetworkModal {...defaultProps} />)
      fireEvent.click(getDropdownToggle())
      fireEvent.click(screen.getByText('Polygon Amoy'))
      fireEvent.click(screen.getByRole('button', { name: /proceed/i }))
      expect(defaultProps.onConfirm).toHaveBeenCalledWith('80002')
    })

    it('calls onCancel when clicking the overlay backdrop', () => {
      render(<NetworkModal {...defaultProps} />)
      const overlay = document.querySelector('.bg-black\\/50') as HTMLElement
      fireEvent.click(overlay)
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
    })

    it('does not call onCancel when clicking inside the modal card', () => {
      render(<NetworkModal {...defaultProps} />)
      const card = document.querySelector('.nm-card') as HTMLElement
      fireEvent.click(card)
      expect(defaultProps.onCancel).not.toHaveBeenCalled()
    })
  })
})
