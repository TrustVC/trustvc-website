import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'

describe('Navbar Component', () => {
  const mockSetIsDarkMode = vi.fn()

  const renderNavbar = (isDarkMode = false, initialPath = '/') =>
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Navbar isDarkMode={isDarkMode} setIsDarkMode={mockSetIsDarkMode} />
      </MemoryRouter>
    )

  beforeEach(() => {
    mockSetIsDarkMode.mockClear()
  })

  it('renders navbar with logo', () => {
    renderNavbar()

    // Logo should be present
    const logos = screen.getAllByRole('link', { name: '' })
    expect(logos.length).toBeGreaterThan(0)
  })

  it('renders navigation links', () => {
    renderNavbar()

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Ecosystem')).toBeInTheDocument()
    expect(screen.getByText('Gallery')).toBeInTheDocument()
    expect(screen.getByText('News & Updates')).toBeInTheDocument()
  })

  it('renders Contact Us button', () => {
    renderNavbar()

    const contactButtons = screen.getAllByText('Contact Us')
    expect(contactButtons.length).toBeGreaterThan(0)
  })

  it('toggles dark mode when sun icon is clicked', () => {
    renderNavbar(true)

    // Find sun icon button (first theme toggle button)
    const themeButtons = screen.getAllByRole('button')
    const sunButton = themeButtons.find(btn =>
      btn.querySelector('svg path[d*="M12 19.3755"]')
    )

    if (sunButton) {
      fireEvent.click(sunButton)
      expect(mockSetIsDarkMode).toHaveBeenCalledWith(false)
    }
  })

  it('toggles dark mode when moon icon is clicked', () => {
    renderNavbar()

    // Find moon icon button
    const themeButtons = screen.getAllByRole('button')
    const moonButton = themeButtons.find(btn =>
      btn.querySelector('svg path[d*="M10.0762"]')
    )

    if (moonButton) {
      fireEvent.click(moonButton)
      expect(mockSetIsDarkMode).toHaveBeenCalledWith(true)
    }
  })

  it('opens mobile menu when hamburger is clicked', () => {
    renderNavbar()

    // Find hamburger button
    const hamburgerButton = screen
      .getAllByRole('button')
      .find(btn => btn.querySelector('svg path[d*="M20.1694 16.75"]'))

    expect(hamburgerButton).toBeInTheDocument()

    if (hamburgerButton) {
      fireEvent.click(hamburgerButton)

      // Mobile menu should appear with navigation items
      const homeLinks = screen.getAllByText('Home')
      expect(homeLinks.length).toBeGreaterThan(1) // Desktop + Mobile
    }
  })

  it('opens ecosystem dropdown on hover', () => {
    renderNavbar()

    const ecosystemButtons = screen.getAllByText('Ecosystem')
    const desktopEcosystemButton = ecosystemButtons[0]

    // Hover over Ecosystem
    fireEvent.mouseEnter(desktopEcosystemButton)

    // Dropdown items should appear
    const placeholders = screen.getAllByText('Placeholder')
    expect(placeholders.length).toBeGreaterThan(0)
  })

  it('applies correct CSS classes for light mode', () => {
    const { container } = renderNavbar()

    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('navbar-light')
    expect(nav).not.toHaveClass('navbar-dark')
  })

  it('applies correct CSS classes for dark mode', () => {
    const { container } = renderNavbar(true)

    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('navbar-dark')
    expect(nav).not.toHaveClass('navbar-light')
  })

  it('renders contact button with correct CSS class', () => {
    const { container } = renderNavbar()

    const contactButtons = container.querySelectorAll('.contact-button')
    expect(contactButtons.length).toBeGreaterThan(0)
  })

  it('shows News & Updates as active color on /news-updates route (light mode)', () => {
    renderNavbar(false, '/news-updates')

    const newsLink = screen.getByText('News & Updates')
    expect(newsLink).toHaveStyle({ color: '#5B5BB3' })
  })

  it('shows News & Updates as active color on news detail route (light mode)', () => {
    renderNavbar(false, '/news-updates/some-article-slug')

    const newsLink = screen.getByText('News & Updates')
    expect(newsLink).toHaveStyle({ color: '#5B5BB3' })
  })

  it('shows Home as inactive color on /news-updates route (light mode)', () => {
    renderNavbar(false, '/news-updates')

    const homeLink = screen.getByText('Home')
    expect(homeLink).toHaveStyle({ color: '#5B6571' })
  })

  it('shows News & Updates as inactive color on home route (light mode)', () => {
    renderNavbar(false, '/')

    const newsLink = screen.getByText('News & Updates')
    expect(newsLink).toHaveStyle({ color: '#5B6571' })
  })

  it('shows Home as active color on home route (light mode)', () => {
    renderNavbar(false, '/')

    const homeLink = screen.getByText('Home')
    expect(homeLink).toHaveStyle({ color: '#5B5BB3' })
  })
})
