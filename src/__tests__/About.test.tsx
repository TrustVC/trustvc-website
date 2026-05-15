import { describe, it, expect } from 'vitest'
import { render, screen, within } from './test-utils'
import About from '../pages/About'
import capabilities from '../data/capabilities'

const renderAbout = (isDarkMode = false) =>
  render(<About isDarkMode={isDarkMode} />)

describe('About page', () => {
  describe('hero heading', () => {
    it('renders the main heading text', () => {
      renderAbout()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByText(/The Foundation of/i)).toBeInTheDocument()
      expect(screen.getByText(/Digital Trust/i)).toBeInTheDocument()
    })

    it('renders the subtitle description', () => {
      renderAbout()
      expect(
        screen.getByText(/core infrastructure layer enabling secure/i)
      ).toBeInTheDocument()
    })
  })

  describe('ecosystem card', () => {
    it('renders the ecosystem card heading', () => {
      renderAbout()
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: /How TrustVC Powers Multiple Ecosystems/i,
        })
      ).toBeInTheDocument()
    })

    it('renders the ecosystem card subtitle', () => {
      renderAbout()
      expect(
        screen.getByText(
          /One foundational platform, unlimited verification possibilities/i
        )
      ).toBeInTheDocument()
    })

    it('renders the ecosystem center image', () => {
      renderAbout()
      expect(
        screen.getByAltText(/How TrustVC Powers Multiple Ecosystems/i)
      ).toBeInTheDocument()
    })
  })

  describe('Core Capabilities section', () => {
    it('renders the Core Capabilities heading', () => {
      renderAbout()
      expect(
        screen.getByRole('heading', { level: 2, name: /Core Capabilities/i })
      ).toBeInTheDocument()
    })

    it('renders all 6 capability cards', () => {
      renderAbout()
      const cards = screen.getAllByRole('heading', { level: 3 })
      expect(cards).toHaveLength(capabilities.length)
    })

    it('renders each capability title', () => {
      renderAbout()
      capabilities.forEach(cap => {
        expect(screen.getByText(cap.title)).toBeInTheDocument()
      })
    })

    it('renders each capability description', () => {
      renderAbout()
      capabilities.forEach(cap => {
        expect(screen.getByText(cap.description)).toBeInTheDocument()
      })
    })

    it('renders the capability icon images', () => {
      renderAbout()
      capabilities.forEach(cap => {
        const icons = screen.getAllByAltText(cap.title)
        expect(icons.length).toBeGreaterThan(0)
      })
    })

    it('renders Transferable Record tags', () => {
      renderAbout()
      const tags = screen.getAllByText('Transferable Record')
      expect(tags.length).toBeGreaterThan(0)
    })

    it('renders Verifiable Document tags', () => {
      renderAbout()
      const tags = screen.getAllByText('Verifiable Document')
      expect(tags.length).toBeGreaterThan(0)
    })

    it('applies correct background color to Transferable Record tag', () => {
      renderAbout()
      const tag = screen.getAllByText('Transferable Record')[0]
      expect(tag).toHaveStyle({ background: '#dfe1ff', color: '#312d62' })
    })

    it('applies correct background color to Verifiable Document tag', () => {
      renderAbout()
      const tag = screen.getAllByText('Verifiable Document')[0]
      expect(tag).toHaveStyle({ background: '#b3ecff', color: '#0b384f' })
    })

    it('renders each card with its tags', () => {
      renderAbout()
      capabilities.forEach(cap => {
        const title = screen.getByText(cap.title)
        const card = title.closest('.rounded-2xl')!
        cap.tags.forEach(tag => {
          expect(within(card as HTMLElement).getByText(tag)).toBeInTheDocument()
        })
      })
    })
  })

  describe('dark mode', () => {
    it('renders without errors in dark mode', () => {
      renderAbout(true)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('applies dark mode classes to capability cards', () => {
      const { container } = renderAbout(true)
      const darkCards = container.querySelectorAll('.bg-neutral-20\\/30')
      expect(darkCards.length).toBeGreaterThan(0)
    })

    it('applies light mode classes to capability cards', () => {
      const { container } = renderAbout(false)
      const lightCards = container.querySelectorAll('.bg-white')
      expect(lightCards.length).toBeGreaterThan(0)
    })
  })
})
