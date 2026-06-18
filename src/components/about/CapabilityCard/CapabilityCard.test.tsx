import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CapabilityCard from './CapabilityCard'
import { type Capability } from '../../../data/capabilities'

const transferableOnlyCap: Capability = {
  icon: '/images/about/single-source.svg',
  tags: ['Transferable Record'],
  title: 'Single Source of Truth',
  description:
    'TrustVC uses a public blockchain to maintain a single source of truth for ETRs.',
}

const dualTagCap: Capability = {
  icon: '/images/about/unified-foundation.svg',
  tags: ['Verifiable Document', 'Transferable Record'],
  title: 'Unified Foundation',
  description:
    'Single SDK powering multiple industry-specific verification solutions.',
}

describe('CapabilityCard', () => {
  describe('content rendering', () => {
    it('renders the card title', () => {
      render(<CapabilityCard cap={transferableOnlyCap} isDarkMode={false} />)
      expect(
        screen.getByRole('heading', {
          level: 3,
          name: transferableOnlyCap.title,
        })
      ).toBeInTheDocument()
    })

    it('renders the card description', () => {
      render(<CapabilityCard cap={transferableOnlyCap} isDarkMode={false} />)
      expect(
        screen.getByText(transferableOnlyCap.description)
      ).toBeInTheDocument()
    })

    it('renders the icon image with correct alt text', () => {
      render(<CapabilityCard cap={transferableOnlyCap} isDarkMode={false} />)
      expect(screen.getByAltText(transferableOnlyCap.title)).toBeInTheDocument()
    })

    it('renders the icon image with correct src', () => {
      render(<CapabilityCard cap={transferableOnlyCap} isDarkMode={false} />)
      expect(screen.getByAltText(transferableOnlyCap.title)).toHaveAttribute(
        'src',
        transferableOnlyCap.icon
      )
    })
  })

  describe('tag pills', () => {
    it('renders a single Transferable Record tag', () => {
      render(<CapabilityCard cap={transferableOnlyCap} isDarkMode={false} />)
      expect(screen.getByText('Transferable Record')).toBeInTheDocument()
    })

    it('renders both tags for a dual-tag capability', () => {
      render(<CapabilityCard cap={dualTagCap} isDarkMode={false} />)
      expect(screen.getByText('Verifiable Document')).toBeInTheDocument()
      expect(screen.getByText('Transferable Record')).toBeInTheDocument()
    })

    it('applies correct styles to Transferable Record tag', () => {
      render(<CapabilityCard cap={transferableOnlyCap} isDarkMode={false} />)
      const tag = screen.getByText('Transferable Record')
      expect(tag).toHaveStyle({ background: '#dfe1ff', color: '#312d62' })
    })

    it('applies correct styles to Verifiable Document tag', () => {
      render(<CapabilityCard cap={dualTagCap} isDarkMode={false} />)
      const tag = screen.getByText('Verifiable Document')
      expect(tag).toHaveStyle({ background: '#b3ecff', color: '#0b384f' })
    })

    it('renders pill with correct dimensions', () => {
      render(<CapabilityCard cap={transferableOnlyCap} isDarkMode={false} />)
      const tag = screen.getByText('Transferable Record')
      expect(tag).toHaveStyle({ width: '128px', height: '24px' })
    })
  })

  describe('dark mode', () => {
    it('applies dark mode class to card', () => {
      const { container } = render(
        <CapabilityCard cap={transferableOnlyCap} isDarkMode={true} />
      )
      expect(container.firstChild).toHaveClass('bg-neutral-20/30')
    })

    it('applies light mode class to card', () => {
      const { container } = render(
        <CapabilityCard cap={transferableOnlyCap} isDarkMode={false} />
      )
      expect(container.firstChild).toHaveClass('bg-white')
    })

    it('applies dark mode class to icon container', () => {
      const { container } = render(
        <CapabilityCard cap={transferableOnlyCap} isDarkMode={true} />
      )
      expect(container.querySelector('.bg-neutral-20\\/60')).toBeInTheDocument()
    })

    it('applies light mode class to icon container', () => {
      const { container } = render(
        <CapabilityCard cap={transferableOnlyCap} isDarkMode={false} />
      )
      expect(container.querySelector('.bg-\\[\\#F5F6F7\\]')).toBeInTheDocument()
    })

    it('applies dark description color in dark mode', () => {
      render(<CapabilityCard cap={transferableOnlyCap} isDarkMode={true} />)
      const desc = screen.getByText(transferableOnlyCap.description)
      expect(desc).toHaveStyle({ color: '#8B929A' })
    })

    it('applies light description color in light mode', () => {
      render(<CapabilityCard cap={transferableOnlyCap} isDarkMode={false} />)
      const desc = screen.getByText(transferableOnlyCap.description)
      expect(desc).toHaveStyle({ color: '#3D444D' })
    })
  })
})
