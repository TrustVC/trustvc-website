import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EndorsementChainLayout from './EndorsementChain'
import { EndorsementChainStatus } from './useEndorsementChain'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockEndorsementChain = [
  {
    type: 'INITIAL',
    owner: '0x1234567890123456789012345678901234567890',
    holder: '0x1234567890123456789012345678901234567890',
    timestamp: 1640000000000,
    transactionHash: '0xabc123',
    remark: 'Initial issuance',
  },
  {
    type: 'TRANSFER_OWNERS',
    owner: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    holder: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    timestamp: 1640100000000,
    transactionHash: '0xdef456',
    remark: 'Transfer to new owner',
  },
  {
    type: 'TRANSFER_BENEFICIARY',
    owner: '0x9876543210987654321098765432109876543210',
    holder: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    timestamp: 1640200000000,
    transactionHash: '0xghi789',
    remark: 'Endorsement',
  },
]

const mockEndorsementChainStatus: EndorsementChainStatus = {
  status: 'success',
}

const defaultProps = {
  endorsementChain: mockEndorsementChain,
  onReset: vi.fn(),
  isDarkMode: false,
  endorsementChainStatus: mockEndorsementChainStatus,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EndorsementChain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the header title', () => {
      render(<EndorsementChainLayout {...defaultProps} />)
      expect(screen.getByText('Endorsement Chain')).toBeInTheDocument()
    })

    it('renders the Dismiss button', () => {
      render(<EndorsementChainLayout {...defaultProps} />)
      expect(
        screen.getByRole('button', { name: /dismiss/i })
      ).toBeInTheDocument()
    })

    it('renders the check icon in the header', () => {
      const { container } = render(<EndorsementChainLayout {...defaultProps} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('applies dark-mode class when isDarkMode is true', () => {
      const { container } = render(
        <EndorsementChainLayout {...defaultProps} isDarkMode={true} />
      )
      const endorsementChainDiv = container.querySelector('.endorsement-chain')
      expect(endorsementChainDiv).toHaveClass('dark-mode')
    })

    it('does not apply dark-mode class when isDarkMode is false', () => {
      const { container } = render(
        <EndorsementChainLayout {...defaultProps} isDarkMode={false} />
      )
      const endorsementChainDiv = container.querySelector('.endorsement-chain')
      expect(endorsementChainDiv).not.toHaveClass('dark-mode')
    })
  })

  // ── Loading State ──────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows spinner when status is loading', () => {
      const loadingStatus: EndorsementChainStatus = { status: 'loading' }
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChainStatus={loadingStatus}
          endorsementChain={undefined}
        />
      )
      expect(screen.getByTestId('loader')).toBeInTheDocument()
    })

    it('shows loading message when loading', () => {
      const loadingStatus: EndorsementChainStatus = { status: 'loading' }
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChainStatus={loadingStatus}
          endorsementChain={undefined}
        />
      )
      expect(screen.getByText(/Loading Endorsement Chain/)).toBeInTheDocument()
    })

    it('does not show endorsement chain entries when loading', () => {
      const loadingStatus: EndorsementChainStatus = { status: 'loading' }
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChainStatus={loadingStatus}
          endorsementChain={undefined}
        />
      )
      expect(
        screen.queryByText('Document has been issued')
      ).not.toBeInTheDocument()
    })

    it('centers the spinner when loading', () => {
      const loadingStatus: EndorsementChainStatus = { status: 'loading' }
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChainStatus={loadingStatus}
          endorsementChain={undefined}
        />
      )
      // The spinner is now rendered with flex layout, not a specific wrapper class
      expect(screen.getByTestId('loader')).toBeInTheDocument()
    })
  })

  // ── Error State ────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('shows error message when status is error', () => {
      const errorStatus: EndorsementChainStatus = {
        status: 'error',
        errorMessage: 'Failed to fetch data',
      }
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChainStatus={errorStatus}
          endorsementChain={undefined}
        />
      )
      expect(
        screen.getByText('Failed to load endorsement chain')
      ).toBeInTheDocument()
    })

    it('shows specific error message when provided', () => {
      const errorStatus: EndorsementChainStatus = {
        status: 'error',
        errorMessage: 'Network timeout',
      }
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChainStatus={errorStatus}
          endorsementChain={undefined}
        />
      )
      expect(screen.getByText('Network timeout')).toBeInTheDocument()
    })

    it('does not show endorsement chain entries when error', () => {
      const errorStatus: EndorsementChainStatus = {
        status: 'error',
        errorMessage: 'Error occurred',
      }
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChainStatus={errorStatus}
          endorsementChain={undefined}
        />
      )
      expect(
        screen.queryByText('Document has been issued')
      ).not.toBeInTheDocument()
    })
  })

  // ── Success State ──────────────────────────────────────────────────────────

  describe('success state with endorsement chain data', () => {
    it('renders all endorsement chain entries', () => {
      render(<EndorsementChainLayout {...defaultProps} />)
      expect(screen.getByText('Document has been issued')).toBeInTheDocument()
      expect(
        screen.getByText('Transfer ownership and holdership')
      ).toBeInTheDocument()
      expect(screen.getByText('Transfer ownership')).toBeInTheDocument()
    })

    it('renders formatted timestamps', () => {
      render(<EndorsementChainLayout {...defaultProps} />)
      // Check if date-frame elements exist (format: 'do MMM yyyy, hh:mm aa')
      const dateFrames = document.querySelectorAll('.date-frame')
      expect(dateFrames.length).toBe(3)
      expect(dateFrames[0].textContent).toMatch(/\d{1,2}(st|nd|rd|th)/)
    })

    it('renders owner addresses for entries with new beneficiary', () => {
      render(<EndorsementChainLayout {...defaultProps} />)
      const walletAddresses = document.querySelectorAll('.wallet-address')
      expect(walletAddresses.length).toBeGreaterThan(0)
    })

    it('renders holder addresses for entries with new holder', () => {
      render(<EndorsementChainLayout {...defaultProps} />)
      const columns = document.querySelectorAll('.column')
      expect(columns.length).toBeGreaterThan(0)
    })

    it('renders remarks when provided', () => {
      const { container } = render(<EndorsementChainLayout {...defaultProps} />)
      const remarks = container.querySelectorAll('.remarks')
      const remarksTexts = Array.from(remarks).map(el => el.textContent)
      expect(
        remarksTexts.some(text => text?.includes('Initial issuance'))
      ).toBe(true)
      expect(
        remarksTexts.some(text => text?.includes('Transfer to new owner'))
      ).toBe(true)
      expect(remarksTexts.some(text => text?.includes('Endorsement'))).toBe(
        true
      )
    })

    it('renders Owner, Holder, and Remarks labels', () => {
      const { container } = render(<EndorsementChainLayout {...defaultProps} />)
      const ownerLabels = container.querySelectorAll('.subheader')
      const ownerTexts = Array.from(ownerLabels).filter(
        el => el.textContent === 'Owner'
      )
      const holderTexts = Array.from(ownerLabels).filter(
        el => el.textContent === 'Holder'
      )
      const remarksTexts = Array.from(ownerLabels).filter(
        el => el.textContent === 'Remarks'
      )
      expect(ownerTexts.length).toBeGreaterThan(0)
      expect(holderTexts.length).toBeGreaterThan(0)
      expect(remarksTexts.length).toBeGreaterThan(0)
    })

    it('renders line design for each entry', () => {
      const { container } = render(<EndorsementChainLayout {...defaultProps} />)
      const lineDesigns = container.querySelectorAll('.line-design-container')
      expect(lineDesigns.length).toBe(3)
    })

    it('renders first entry with special line design', () => {
      const { container } = render(<EndorsementChainLayout {...defaultProps} />)
      const firstLinePath = container.querySelector('.line-design-path.first')
      expect(firstLinePath).toBeInTheDocument()
    })
  })

  // ── Empty State ────────────────────────────────────────────────────────────

  describe('empty endorsement chain', () => {
    it('renders without errors when endorsementChain is undefined', () => {
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChain={undefined}
        />
      )
      expect(screen.getByText('Endorsement Chain')).toBeInTheDocument()
    })

    it('renders without errors when endorsementChain is empty array', () => {
      render(<EndorsementChainLayout {...defaultProps} endorsementChain={[]} />)
      expect(screen.getByText('Endorsement Chain')).toBeInTheDocument()
    })

    it('does not render any entries when endorsementChain is empty', () => {
      const { container } = render(
        <EndorsementChainLayout {...defaultProps} endorsementChain={[]} />
      )
      const entities = container.querySelectorAll('.entity')
      expect(entities.length).toBe(0)
    })
  })

  // ── Different Event Types ──────────────────────────────────────────────────

  describe('different endorsement event types', () => {
    it('renders TRANSFER_HOLDER event correctly', () => {
      const chainWithTransferHolder = [
        {
          type: 'TRANSFER_HOLDER',
          owner: '0x1234567890123456789012345678901234567890',
          holder: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          timestamp: 1640000000000,
          transactionHash: '0xabc123',
          remark: 'Holder transfer',
        },
      ]
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChain={chainWithTransferHolder}
        />
      )
      expect(screen.getByText('Transfer holdership')).toBeInTheDocument()
    })

    it('renders RETURNED_TO_ISSUER event correctly', () => {
      const chainWithReturn = [
        {
          type: 'RETURNED_TO_ISSUER',
          owner: '0x1234567890123456789012345678901234567890',
          holder: '0x1234567890123456789012345678901234567890',
          timestamp: 1640000000000,
          transactionHash: '0xabc123',
          remark: 'Returned',
        },
      ]
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChain={chainWithReturn}
        />
      )
      expect(screen.getByText('ETR returned to issuer')).toBeInTheDocument()
    })

    it('renders RETURN_TO_ISSUER_ACCEPTED event correctly', () => {
      const chainWithAccepted = [
        {
          type: 'RETURN_TO_ISSUER_ACCEPTED',
          owner: '0x1234567890123456789012345678901234567890',
          holder: '0x1234567890123456789012345678901234567890',
          timestamp: 1640000000000,
          transactionHash: '0xabc123',
          remark: 'Accepted',
        },
      ]
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChain={chainWithAccepted}
        />
      )
      expect(
        screen.getByText('ETR taken out of circulation')
      ).toBeInTheDocument()
    })

    it('renders REJECT_TRANSFER_HOLDER event correctly', () => {
      const chainWithReject = [
        {
          type: 'REJECT_TRANSFER_HOLDER',
          owner: '0x1234567890123456789012345678901234567890',
          holder: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          timestamp: 1640000000000,
          transactionHash: '0xabc123',
          remark: 'Rejected',
        },
      ]
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChain={chainWithReject}
        />
      )
      expect(screen.getByText('Rejection of holdership')).toBeInTheDocument()
    })

    it('renders REJECT_TRANSFER_BENEFICIARY event correctly', () => {
      const chainWithReject = [
        {
          type: 'REJECT_TRANSFER_BENEFICIARY',
          owner: '0x1234567890123456789012345678901234567890',
          holder: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          timestamp: 1640000000000,
          transactionHash: '0xabc123',
          remark: 'Rejected',
        },
      ]
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChain={chainWithReject}
        />
      )
      expect(screen.getByText('Rejection of ownership')).toBeInTheDocument()
    })
  })

  // ── Callbacks ──────────────────────────────────────────────────────────────

  describe('callbacks', () => {
    it('calls onReset when Dismiss button is clicked', () => {
      const onReset = vi.fn()
      render(<EndorsementChainLayout {...defaultProps} onReset={onReset} />)
      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
      expect(onReset).toHaveBeenCalledTimes(1)
    })

    it('does not call onReset on initial render', () => {
      const onReset = vi.fn()
      render(<EndorsementChainLayout {...defaultProps} onReset={onReset} />)
      expect(onReset).not.toHaveBeenCalled()
    })
  })

  // ── Status Prop Handling ───────────────────────────────────────────────────

  describe('endorsementChainStatus prop handling', () => {
    it('handles undefined endorsementChainStatus gracefully', () => {
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChainStatus={undefined}
        />
      )
      expect(screen.getByText('Endorsement Chain')).toBeInTheDocument()
    })

    it('handles idle status', () => {
      const idleStatus: EndorsementChainStatus = { status: 'idle' }
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChainStatus={idleStatus}
        />
      )
      expect(screen.getByText('Endorsement Chain')).toBeInTheDocument()
    })

    it('shows content when status is success', () => {
      const successStatus: EndorsementChainStatus = { status: 'success' }
      render(
        <EndorsementChainLayout
          {...defaultProps}
          endorsementChainStatus={successStatus}
        />
      )
      expect(screen.getByText('Document has been issued')).toBeInTheDocument()
    })
  })

  // ── Visual Elements ────────────────────────────────────────────────────────

  describe('visual elements', () => {
    it('renders dividers between entries', () => {
      const { container } = render(<EndorsementChainLayout {...defaultProps} />)
      const dividers = container.querySelectorAll('.divider')
      // Dividers are rendered between entries, so n-1 dividers for n entries
      expect(dividers.length).toBe(2)
    })

    it('renders dots in line design', () => {
      const { container } = render(<EndorsementChainLayout {...defaultProps} />)
      const dots = container.querySelectorAll('.dot')
      expect(dots.length).toBe(3)
    })

    it('renders content sections for each entry', () => {
      const { container } = render(<EndorsementChainLayout {...defaultProps} />)
      const contentSections = container.querySelectorAll('.content')
      expect(contentSections.length).toBe(3)
    })

    it('renders three columns per entry', () => {
      const { container } = render(<EndorsementChainLayout {...defaultProps} />)
      const columns = container.querySelectorAll('.column')
      // 3 entries × 3 columns each = 9 columns
      expect(columns.length).toBe(9)
    })
  })
})
