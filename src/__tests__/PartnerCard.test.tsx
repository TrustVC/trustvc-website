import { describe, it, expect } from 'vitest'
import { render, screen } from './test-utils'
import PartnerCard from '../components/common/PartnerCard'
import type { Partner } from '../types/partner'

const minimalPartner: Partner = {
  name: 'Test Partner',
  logo: '/images/partners/test.svg',
}

const fullPartner: Partner = {
  name: 'AEOTRADE',
  logo: '/images/partners/AEOTRADE.svg',
  website: 'https://www.aeotrade.com',
  description: 'A trade finance platform',
  verticalType: 'TradeTrust',
  category: 'Solution Partners',
}

describe('PartnerCard', () => {
  describe('partner name', () => {
    it('renders the partner name', () => {
      render(<PartnerCard partner={minimalPartner} isDarkMode={false} />)
      expect(
        screen.getByRole('heading', { level: 3, name: 'Test Partner' })
      ).toBeInTheDocument()
    })
  })

  describe('logo', () => {
    it('renders logo with correct src and alt attributes', () => {
      render(<PartnerCard partner={minimalPartner} isDarkMode={false} />)
      const img = screen.getByRole('img', { name: 'Test Partner' })
      expect(img).toHaveAttribute('src', '/images/partners/test.svg')
    })

    it('sets loading="lazy" on the logo', () => {
      render(<PartnerCard partner={minimalPartner} isDarkMode={false} />)
      expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy')
    })
  })

  describe('vertical type tag', () => {
    it('renders TradeTrust tag with correct text', () => {
      render(<PartnerCard partner={fullPartner} isDarkMode={false} />)
      expect(screen.getByText('TradeTrust')).toBeInTheDocument()
    })

    it('renders OpenCerts tag with correct text', () => {
      const partner: Partner = { ...minimalPartner, verticalType: 'OpenCerts' }
      render(<PartnerCard partner={partner} isDarkMode={false} />)
      expect(screen.getByText('OpenCerts')).toBeInTheDocument()
    })

    it('renders no vertical tag when verticalType is absent', () => {
      render(<PartnerCard partner={minimalPartner} isDarkMode={false} />)
      expect(screen.queryByText('TradeTrust')).not.toBeInTheDocument()
      expect(screen.queryByText('OpenCerts')).not.toBeInTheDocument()
    })
  })

  describe('category tag', () => {
    it('renders category tag when provided', () => {
      render(<PartnerCard partner={fullPartner} isDarkMode={false} />)
      expect(screen.getByText('Solution Partners')).toBeInTheDocument()
    })

    it('renders no category tag when absent', () => {
      render(<PartnerCard partner={minimalPartner} isDarkMode={false} />)
      expect(screen.queryByText('Solution Partners')).not.toBeInTheDocument()
      expect(screen.queryByText('Infrastructure')).not.toBeInTheDocument()
    })
  })

  describe('description', () => {
    it('renders description text when provided', () => {
      render(<PartnerCard partner={fullPartner} isDarkMode={false} />)
      expect(screen.getByText('A trade finance platform')).toBeInTheDocument()
    })

    it('does not render description element when absent', () => {
      render(<PartnerCard partner={minimalPartner} isDarkMode={false} />)
      expect(
        screen.queryByText('A trade finance platform')
      ).not.toBeInTheDocument()
    })
  })

  describe('Visit Site link', () => {
    it('renders Visit Site link with correct href', () => {
      render(<PartnerCard partner={fullPartner} isDarkMode={false} />)
      const link = screen.getByRole('link', { name: /Visit Site/i })
      expect(link).toHaveAttribute('href', 'https://www.aeotrade.com')
    })

    it('opens Visit Site link in a new tab', () => {
      render(<PartnerCard partner={fullPartner} isDarkMode={false} />)
      const link = screen.getByRole('link', { name: /Visit Site/i })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('does not render Visit Site link when website is absent', () => {
      render(<PartnerCard partner={minimalPartner} isDarkMode={false} />)
      expect(
        screen.queryByRole('link', { name: /Visit Site/i })
      ).not.toBeInTheDocument()
    })
  })

  describe('dark/light mode', () => {
    it('applies dark mode background and border', () => {
      const { container } = render(
        <PartnerCard partner={minimalPartner} isDarkMode={true} />
      )
      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('bg-[#2A2D35]')
      expect(card.className).toContain('border-neutral-10')
    })

    it('applies light mode background and border', () => {
      const { container } = render(
        <PartnerCard partner={minimalPartner} isDarkMode={false} />
      )
      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('bg-white')
      expect(card.className).toContain('border-neutral-60')
    })

    it('applies dark mode TradeTrust tag colors', () => {
      render(
        <PartnerCard
          partner={{ ...minimalPartner, verticalType: 'TradeTrust' }}
          isDarkMode={true}
        />
      )
      const tag = screen.getByText('TradeTrust')
      expect(tag.className).toContain('bg-[#0B384F]')
      expect(tag.className).toContain('text-[#B3ECFF]')
    })

    it('applies light mode TradeTrust tag colors', () => {
      render(
        <PartnerCard
          partner={{ ...minimalPartner, verticalType: 'TradeTrust' }}
          isDarkMode={false}
        />
      )
      const tag = screen.getByText('TradeTrust')
      expect(tag.className).toContain('bg-[#B3ECFF]')
      expect(tag.className).toContain('text-[#0B384F]')
    })
  })
})
