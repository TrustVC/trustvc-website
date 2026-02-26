import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VerifyResult from './VerifyResult'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Stub NetworkTooltip to avoid jsdom getBoundingClientRect side-effects
vi.mock('./NetworkTooltip', () => ({
  default: ({ isVisible }: { isVisible: boolean }) =>
    isVisible ? <div data-testid="network-tooltip">Tooltip visible</div> : null,
}))

// Stub makeExplorerAddressURL so tests control the returned URL
vi.mock('./useVerify', async () => {
  const actual =
    await vi.importActual<typeof import('./useVerify')>('./useVerify')
  return { ...actual, makeExplorerAddressURL: vi.fn() }
})

import { makeExplorerAddressURL } from './useVerify'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultProps = {
  fileName: 'test.tt',
  getGroupStatus: vi.fn().mockReturnValue('VALID' as const),
  onReset: vi.fn(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VerifyResult', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(defaultProps.getGroupStatus).mockReturnValue('VALID')
    vi.mocked(makeExplorerAddressURL).mockReturnValue(undefined)
  })

  // ── Core content ───────────────────────────────────────────────────────────

  describe('core content', () => {
    it('renders the Upload New File button', () => {
      render(<VerifyResult {...defaultProps} />)
      expect(
        screen.getByRole('button', { name: /upload new file/i })
      ).toBeInTheDocument()
    })

    it('renders the "Issued by:" label', () => {
      render(<VerifyResult {...defaultProps} />)
      expect(screen.getByText('Issued by:')).toBeInTheDocument()
    })

    it('shows fileName when no issuer is provided', () => {
      render(<VerifyResult {...defaultProps} fileName="my-doc.tt" />)
      expect(screen.getByText('my-doc.tt')).toBeInTheDocument()
    })

    it('shows issuer instead of fileName when issuer is provided', () => {
      render(
        <VerifyResult
          {...defaultProps}
          fileName="doc.tt"
          issuer="EXAMPLE.COM"
        />
      )
      expect(screen.getByText('EXAMPLE.COM')).toBeInTheDocument()
      expect(screen.queryByText('doc.tt')).not.toBeInTheDocument()
    })

    it('renders all three verification check labels', () => {
      render(<VerifyResult {...defaultProps} />)
      expect(screen.getByText('Document has been issued')).toBeInTheDocument()
      expect(
        screen.getByText("Document's issuer has been identified")
      ).toBeInTheDocument()
      expect(
        screen.getByText('Document has not been tampered with')
      ).toBeInTheDocument()
    })
  })

  // ── onReset ────────────────────────────────────────────────────────────────

  describe('onReset', () => {
    it('calls onReset when Upload New File is clicked', () => {
      const onReset = vi.fn()
      render(<VerifyResult {...defaultProps} onReset={onReset} />)
      fireEvent.click(screen.getByRole('button', { name: /upload new file/i }))
      expect(onReset).toHaveBeenCalledTimes(1)
    })
  })

  // ── Verification check icons ───────────────────────────────────────────────

  describe('verification check icons', () => {
    it('renders CheckCircle (green) icons when all checks are VALID', () => {
      vi.mocked(defaultProps.getGroupStatus).mockReturnValue('VALID')
      const { container } = render(<VerifyResult {...defaultProps} />)
      expect(
        container.querySelectorAll('path[stroke="#3AAF86"]').length
      ).toBeGreaterThan(0)
    })

    it('renders CrossCircle (red) icons when checks are INVALID', () => {
      vi.mocked(defaultProps.getGroupStatus).mockReturnValue('INVALID')
      const { container } = render(<VerifyResult {...defaultProps} />)
      expect(
        container.querySelectorAll('circle[stroke="#ef4444"]').length
      ).toBeGreaterThan(0)
    })
  })

  // ── Network card ───────────────────────────────────────────────────────────

  describe('network card', () => {
    it('does not render the network card when networkName is not provided', () => {
      render(<VerifyResult {...defaultProps} />)
      expect(
        screen.queryByText('Document verified on:')
      ).not.toBeInTheDocument()
    })

    it('renders the "Document verified on:" label when networkName is provided', () => {
      render(<VerifyResult {...defaultProps} networkName="Sepolia" />)
      expect(screen.getByText('Document verified on:')).toBeInTheDocument()
    })

    it('renders the network name in the field', () => {
      render(<VerifyResult {...defaultProps} networkName="Ethereum" />)
      expect(screen.getByText('Ethereum')).toBeInTheDocument()
    })

    it('renders the info (?) button when networkName is provided', () => {
      render(<VerifyResult {...defaultProps} networkName="Sepolia" />)
      expect(
        screen.getByRole('button', { name: /network info/i })
      ).toBeInTheDocument()
    })
  })

  // ── Tooltip ────────────────────────────────────────────────────────────────

  describe('tooltip', () => {
    it('is hidden by default', () => {
      render(<VerifyResult {...defaultProps} networkName="Sepolia" />)
      expect(screen.queryByTestId('network-tooltip')).not.toBeInTheDocument()
    })

    it('shows when hovering over the info button', () => {
      render(<VerifyResult {...defaultProps} networkName="Sepolia" />)
      fireEvent.mouseEnter(
        screen.getByRole('button', { name: /network info/i })
      )
      expect(screen.getByTestId('network-tooltip')).toBeInTheDocument()
    })

    it('hides when mouse leaves the info button', () => {
      render(<VerifyResult {...defaultProps} networkName="Sepolia" />)
      const infoBtn = screen.getByRole('button', { name: /network info/i })
      fireEvent.mouseEnter(infoBtn)
      expect(screen.getByTestId('network-tooltip')).toBeInTheDocument()
      fireEvent.mouseLeave(infoBtn)
      expect(screen.queryByTestId('network-tooltip')).not.toBeInTheDocument()
    })
  })

  // ── Tags ───────────────────────────────────────────────────────────────────

  describe('tags', () => {
    it('does not render tags section when tags array is empty', () => {
      render(<VerifyResult {...defaultProps} tags={[]} />)
      expect(screen.queryByText('OA')).not.toBeInTheDocument()
    })

    it('does not render tags section when tags prop is absent', () => {
      render(<VerifyResult {...defaultProps} />)
      // No tag chips rendered
      const { container } = render(<VerifyResult {...defaultProps} />)
      expect(container.querySelector('.vr-issue-tags')).not.toBeInTheDocument()
    })

    it('renders Transferable and Negotiable as primary tags', () => {
      const { container } = render(
        <VerifyResult {...defaultProps} tags={['Transferable', 'Negotiable']} />
      )
      expect(screen.getByText('Transferable')).toBeInTheDocument()
      expect(screen.getByText('Negotiable')).toBeInTheDocument()
      expect(container.querySelectorAll('.vr-tag--primary')).toHaveLength(2)
    })

    it('renders OA / TR V4 / TR V5 / W3C tags as secondary tags', () => {
      const { container } = render(
        <VerifyResult {...defaultProps} tags={['OA', 'TR V4', 'W3C VC V1.1']} />
      )
      expect(screen.getByText('OA')).toBeInTheDocument()
      expect(screen.getByText('TR V4')).toBeInTheDocument()
      expect(screen.getByText('W3C VC V1.1')).toBeInTheDocument()
      expect(container.querySelectorAll('.vr-tag--secondary')).toHaveLength(3)
    })

    it('renders a mix of primary and secondary tags', () => {
      const { container } = render(
        <VerifyResult
          {...defaultProps}
          tags={['Transferable', 'OA', 'TR V5']}
        />
      )
      expect(container.querySelectorAll('.vr-tag--primary')).toHaveLength(1)
      expect(container.querySelectorAll('.vr-tag--secondary')).toHaveLength(2)
    })
  })

  // ── NFT links section (isTransferable) ────────────────────────────────────

  describe('NFT links section', () => {
    it('does not render NFT links when isTransferable is false', () => {
      render(<VerifyResult {...defaultProps} isTransferable={false} />)
      expect(screen.queryByText('View NFT Registry')).not.toBeInTheDocument()
      expect(
        screen.queryByText('View Endorsement Chain')
      ).not.toBeInTheDocument()
    })

    it('renders View NFT Registry and View Endorsement Chain when isTransferable is true', () => {
      render(<VerifyResult {...defaultProps} isTransferable={true} />)
      expect(screen.getByText('View NFT Registry')).toBeInTheDocument()
      expect(screen.getByText('View Endorsement Chain')).toBeInTheDocument()
    })

    it('renders View NFT Registry as a plain div when no explorerUrl is resolved', () => {
      vi.mocked(makeExplorerAddressURL).mockReturnValue(undefined)
      render(
        <VerifyResult
          {...defaultProps}
          isTransferable={true}
          tokenRegistryAddress="0xabc"
          chainId="1"
        />
      )
      const el = screen.getByText('View NFT Registry')
      expect(el.tagName).not.toBe('A')
    })

    it('renders View NFT Registry as an <a> link when explorerUrl is resolved', () => {
      vi.mocked(makeExplorerAddressURL).mockReturnValue(
        'https://etherscan.io/address/0xabc'
      )
      render(
        <VerifyResult
          {...defaultProps}
          isTransferable={true}
          tokenRegistryAddress="0xabc"
          chainId="1"
        />
      )
      const link = screen.getByText('View NFT Registry')
      expect(link.tagName).toBe('A')
      expect(link).toHaveAttribute('href', 'https://etherscan.io/address/0xabc')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('calls onViewNftRegistry when clicking the plain-div NFT link', () => {
      const onViewNftRegistry = vi.fn()
      vi.mocked(makeExplorerAddressURL).mockReturnValue(undefined)
      render(
        <VerifyResult
          {...defaultProps}
          isTransferable={true}
          onViewNftRegistry={onViewNftRegistry}
        />
      )
      fireEvent.click(screen.getByText('View NFT Registry'))
      expect(onViewNftRegistry).toHaveBeenCalledTimes(1)
    })

    it('calls onViewEndorsementChain when clicking View Endorsement Chain', () => {
      const onViewEndorsementChain = vi.fn()
      render(
        <VerifyResult
          {...defaultProps}
          isTransferable={true}
          onViewEndorsementChain={onViewEndorsementChain}
        />
      )
      fireEvent.click(screen.getByText('View Endorsement Chain'))
      expect(onViewEndorsementChain).toHaveBeenCalledTimes(1)
    })
  })

  // ── Divider ────────────────────────────────────────────────────────────────

  describe('divider', () => {
    it('does not render the divider when isTransferable is false', () => {
      const { container } = render(
        <VerifyResult {...defaultProps} isTransferable={false} />
      )
      expect(container.querySelector('.vr-divider')).not.toBeInTheDocument()
    })

    it('renders the divider when isTransferable is true', () => {
      const { container } = render(
        <VerifyResult {...defaultProps} isTransferable={true} />
      )
      expect(container.querySelector('.vr-divider')).toBeInTheDocument()
    })
  })

  // ── Owner / Holder section ─────────────────────────────────────────────────

  describe('Owner / Holder section', () => {
    it('does not render Owner/Holder when isTransferable is false', () => {
      render(<VerifyResult {...defaultProps} isTransferable={false} />)
      expect(screen.queryByText('Owner:')).not.toBeInTheDocument()
      expect(screen.queryByText('Holder:')).not.toBeInTheDocument()
    })

    it('renders Owner and Holder labels when isTransferable is true', () => {
      render(<VerifyResult {...defaultProps} isTransferable={true} />)
      expect(screen.getByText('Owner:')).toBeInTheDocument()
      expect(screen.getByText('Holder:')).toBeInTheDocument()
    })

    it('shows fallback "Organisation A" for owner and holder when not provided', () => {
      render(<VerifyResult {...defaultProps} isTransferable={true} />)
      expect(screen.getAllByText('Organisation A')).toHaveLength(2)
    })

    it('shows the provided owner name and address', () => {
      render(
        <VerifyResult
          {...defaultProps}
          isTransferable={true}
          owner={{ name: 'Acme Corp', address: '0x1234abcd' }}
        />
      )
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('0x1234abcd')).toBeInTheDocument()
    })

    it('shows the provided holder name and address', () => {
      render(
        <VerifyResult
          {...defaultProps}
          isTransferable={true}
          holder={{ name: 'Bob Ltd', address: '0x5678ef' }}
        />
      )
      expect(screen.getByText('Bob Ltd')).toBeInTheDocument()
      expect(screen.getByText('0x5678ef')).toBeInTheDocument()
    })
  })

  // ── Connect Wallet footer ──────────────────────────────────────────────────

  describe('Connect Wallet footer', () => {
    it('does not render the Connect Wallet button when isTransferable is false', () => {
      render(<VerifyResult {...defaultProps} isTransferable={false} />)
      expect(
        screen.queryByRole('button', { name: /connect wallet/i })
      ).not.toBeInTheDocument()
    })

    it('renders the Connect Wallet button when isTransferable is true', () => {
      render(<VerifyResult {...defaultProps} isTransferable={true} />)
      expect(
        screen.getByRole('button', { name: /connect wallet/i })
      ).toBeInTheDocument()
    })

    it('calls onConnectWallet when Connect Wallet is clicked', () => {
      const onConnectWallet = vi.fn()
      render(
        <VerifyResult
          {...defaultProps}
          isTransferable={true}
          onConnectWallet={onConnectWallet}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }))
      expect(onConnectWallet).toHaveBeenCalledTimes(1)
    })
  })
})
