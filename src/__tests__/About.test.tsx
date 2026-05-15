import { describe, it, expect } from 'vitest'
import { render, screen, within } from './test-utils'
import About from '../pages/About'
import capabilities from '../data/capabilities'

const renderAbout = (isDarkMode = false) =>
  render(<About isDarkMode={isDarkMode} />)

describe('About page', () => {
  describe('hero', () => {
    it('renders the main heading', () => {
      renderAbout()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByText(/The Foundation of/i)).toBeInTheDocument()
      expect(screen.getByText(/Digital Trust/i)).toBeInTheDocument()
    })

    it('renders the hero subtitle', () => {
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

    it(`renders all ${capabilities.length} capability cards`, () => {
      renderAbout()
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(
        capabilities.length
      )
    })

    it('renders each capability title and description', () => {
      renderAbout()
      capabilities.forEach(cap => {
        expect(screen.getByText(cap.title)).toBeInTheDocument()
        expect(screen.getByText(cap.description)).toBeInTheDocument()
      })
    })

    it('renders each card with its own tags', () => {
      renderAbout()
      capabilities.forEach(cap => {
        const card = screen.getByText(cap.title).closest('.rounded-2xl')!
        cap.tags.forEach(tag => {
          expect(within(card as HTMLElement).getByText(tag)).toBeInTheDocument()
        })
      })
    })
  })

  describe('dark / light mode', () => {
    it('renders without errors in dark mode', () => {
      renderAbout(true)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('applies dark mode classes to capability cards', () => {
      const { container } = renderAbout(true)
      expect(
        container.querySelectorAll('.bg-neutral-20\\/30').length
      ).toBeGreaterThan(0)
    })

    it('applies light mode classes to capability cards', () => {
      const { container } = renderAbout(false)
      expect(container.querySelectorAll('.bg-white').length).toBeGreaterThan(0)
    })
  })
})
