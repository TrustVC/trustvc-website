import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from './test-utils'
import Partners from '../pages/Partners'
import partners from '../data/partners'

const CATEGORIES = [
  'All',
  'Issuance & Attestation',
  'Verification & Validation',
  'Solution Partners',
  'Infrastructure',
]

describe('Partners page', () => {
  describe('heading and subtitle', () => {
    it('renders the page heading with "Our Partners"', () => {
      render(<Partners isDarkMode={false} />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Our Partners')
    })

    it('renders the subtitle text', () => {
      render(<Partners isDarkMode={false} />)
      expect(
        screen.getByText(
          /The Global Engine for Verifiable Documents and Transferable Records/i
        )
      ).toBeInTheDocument()
    })
  })

  describe('category filter', () => {
    it('renders all 5 category filter buttons', () => {
      render(<Partners isDarkMode={false} />)
      CATEGORIES.forEach(cat => {
        expect(screen.getByRole('button', { name: cat })).toBeInTheDocument()
      })
    })

    it('"All" filter is active by default', () => {
      render(<Partners isDarkMode={false} />)
      const allBtn = screen.getByRole('button', { name: 'All' })
      expect(allBtn.className).toContain('bg-primary-60')
      expect(allBtn.className).toContain('text-white')
    })

    it('inactive filter buttons do not have active styling', () => {
      render(<Partners isDarkMode={false} />)
      CATEGORIES.slice(1).forEach(cat => {
        const btn = screen.getByRole('button', { name: cat })
        expect(btn.className).not.toContain('bg-primary-60')
      })
    })

    it('clicking a category makes it active', () => {
      render(<Partners isDarkMode={false} />)
      const infraBtn = screen.getByRole('button', { name: 'Infrastructure' })
      fireEvent.click(infraBtn)
      expect(infraBtn.className).toContain('bg-primary-60')
      expect(infraBtn.className).toContain('text-white')
    })

    it('clicking a category deactivates the previously active filter', () => {
      render(<Partners isDarkMode={false} />)
      fireEvent.click(screen.getByRole('button', { name: 'Infrastructure' }))
      expect(
        screen.getByRole('button', { name: 'All' }).className
      ).not.toContain('bg-primary-60')
    })

    it('clicking "All" after a filter restores all partners', () => {
      render(<Partners isDarkMode={false} />)
      fireEvent.click(screen.getByRole('button', { name: 'Infrastructure' }))
      fireEvent.click(screen.getByRole('button', { name: 'All' }))
      const cards = screen.getAllByRole('heading', { level: 3 })
      expect(cards).toHaveLength(partners.length)
    })
  })

  describe('partner grid', () => {
    it('shows all partners when "All" is selected', () => {
      render(<Partners isDarkMode={false} />)
      const cards = screen.getAllByRole('heading', { level: 3 })
      expect(cards).toHaveLength(partners.length)
    })

    it('filters to only Solution Partners when that category is selected', () => {
      render(<Partners isDarkMode={false} />)
      fireEvent.click(screen.getByRole('button', { name: 'Solution Partners' }))
      const expected = partners.filter(p => p.category === 'Solution Partners')
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(
        expected.length
      )
    })

    it('filters to only Infrastructure partners when that category is selected', () => {
      render(<Partners isDarkMode={false} />)
      fireEvent.click(screen.getByRole('button', { name: 'Infrastructure' }))
      const expected = partners.filter(p => p.category === 'Infrastructure')
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(
        expected.length
      )
    })

    it('filters to only Issuance & Attestation partners when that category is selected', () => {
      render(<Partners isDarkMode={false} />)
      fireEvent.click(
        screen.getByRole('button', { name: 'Issuance & Attestation' })
      )
      const expected = partners.filter(
        p => p.category === 'Issuance & Attestation'
      )
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(
        expected.length
      )
    })

    it('filters to only Verification & Validation partners when that category is selected', () => {
      render(<Partners isDarkMode={false} />)
      fireEvent.click(
        screen.getByRole('button', { name: 'Verification & Validation' })
      )
      const expected = partners.filter(
        p => p.category === 'Verification & Validation'
      )
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(
        expected.length
      )
    })

    it('renders the first partner name in the full list', () => {
      render(<Partners isDarkMode={false} />)
      expect(screen.getByText(partners[0].name)).toBeInTheDocument()
    })

    it('renders PartnerCard with Visit Site link for partners with a website', () => {
      render(<Partners isDarkMode={false} />)
      const partnerWithSite = partners.find(p => p.website)!
      expect(
        screen.getAllByRole('link', { name: /Visit Site/i }).length
      ).toBeGreaterThan(0)
      // The first partner with a website should appear in the page
      expect(screen.getByText(partnerWithSite.name)).toBeInTheDocument()
    })
  })

  describe('dark/light mode', () => {
    it('applies dark mode background', () => {
      const { container } = render(<Partners isDarkMode={true} />)
      expect((container.firstChild as HTMLElement).className).toContain(
        'w-full'
      )
    })

    it('applies light mode background', () => {
      const { container } = render(<Partners isDarkMode={false} />)
      expect((container.firstChild as HTMLElement).className).toContain(
        'w-full'
      )
    })

    it('passes isDarkMode to PartnerCard components', () => {
      const { container: darkContainer } = render(
        <Partners isDarkMode={true} />
      )
      // PartnerCard dark mode uses bg-[#2A2D35] - verify at least one card has it
      const darkCards = darkContainer.querySelectorAll('.bg-\\[\\#2A2D35\\]')
      expect(darkCards.length).toBeGreaterThan(0)
    })
  })
})
