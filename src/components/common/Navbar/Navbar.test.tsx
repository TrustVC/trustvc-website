import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

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
    renderWithRouter(
      <Navbar isDarkMode={false} setIsDarkMode={mockSetIsDarkMode} />
    )

    // Logo should be present
    const logos = screen.getAllByRole('link', { name: '' })
    expect(logos.length).toBeGreaterThan(0)
  })

  it('renders navigation links', () => {
    renderWithRouter(
      <Navbar isDarkMode={false} setIsDarkMode={mockSetIsDarkMode} />
    )
    // home remove from navbar
    expect(screen.getAllByText('About').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Toolkit').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Verticals').length).toBeGreaterThan(0)
    expect(screen.getAllByText('News & Updates').length).toBeGreaterThan(0)
  })

  it('opens the Verticals dropdown with external links', () => {
    renderWithRouter(
      <Navbar isDarkMode={false} setIsDarkMode={mockSetIsDarkMode} />
    )

    fireEvent.click(
      screen.getByRole('button', { name: /toggle verticals menu/i })
    )

    const menu = screen.getByRole('menu', { name: /verticals menu/i })
    expect(menu).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: 'TradeTrust' })
    ).toHaveAttribute('href', 'https://tradetrust.io/')
    expect(screen.getByRole('menuitem', { name: 'OpenCerts' })).toHaveAttribute(
      'href',
      'https://opencerts.io/'
    )
    expect(screen.getByRole('menuitem', { name: 'SAL' })).toHaveAttribute(
      'href',
      'https://legalisation.sal.sg/'
    )
  })

  it('selecting a mobile Verticals link closes both mobile and desktop menus', () => {
    renderWithRouter(
      <Navbar isDarkMode={false} setIsDarkMode={mockSetIsDarkMode} />
    )

    // Open the mobile menu via the hamburger button
    const hamburgerButton = screen
      .getAllByRole('button')
      .find(btn => btn.querySelector('svg path[d*="M20.1694 16.75"]'))
    fireEvent.click(hamburgerButton!)

    const mobileMenu = screen.getByRole('navigation', {
      name: /mobile navigation menu/i,
    })

    // Open the Verticals submenu from within the mobile menu
    fireEvent.click(
      within(mobileMenu).getByRole('button', {
        name: /toggle verticals menu/i,
      })
    )

    const mobileLink = within(mobileMenu).getByText('TradeTrust')

    // mousedown must NOT close the submenu (clicks inside the mobile
    // container are contained), or the link unmounts before click fires
    fireEvent.mouseDown(mobileLink)
    expect(within(mobileMenu).getByText('TradeTrust')).toBeInTheDocument()

    fireEvent.click(mobileLink)

    // Selecting the link closes both the mobile menu and the dropdown
    expect(
      screen.queryByRole('navigation', { name: /mobile navigation menu/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('menu', { name: /verticals menu/i })
    ).not.toBeInTheDocument()
  })

  it('renders Contact Us button', () => {
    renderWithRouter(
      <Navbar isDarkMode={false} setIsDarkMode={mockSetIsDarkMode} />
    )

    const contactButtons = screen.getAllByText('Contact Us')
    expect(contactButtons.length).toBeGreaterThan(0)
  })

  it.skip('toggles dark mode when sun icon is clicked', () => {
    renderWithRouter(
      <Navbar isDarkMode={true} setIsDarkMode={mockSetIsDarkMode} />
    )

    // Find sun icon button (first theme toggle button)
    const themeButtons = screen.getAllByRole('button')
    const sunButton = themeButtons.find(btn =>
      btn.querySelector('svg path[d*="M12 19.3755"]')
    )

    expect(sunButton).toBeDefined()
    fireEvent.click(sunButton!)
    expect(mockSetIsDarkMode).toHaveBeenCalledWith(false)
  })

  it.skip('toggles dark mode when moon icon is clicked', () => {
    renderWithRouter(
      <Navbar isDarkMode={false} setIsDarkMode={mockSetIsDarkMode} />
    )

    // Find moon icon button
    const themeButtons = screen.getAllByRole('button')
    const moonButton = themeButtons.find(btn =>
      btn.querySelector('svg path[d*="M10.0762"]')
    )

    expect(moonButton).toBeDefined()
    fireEvent.click(moonButton!)
    expect(mockSetIsDarkMode).toHaveBeenCalledWith(true)
  })

  it('opens mobile menu when hamburger is clicked', () => {
    renderWithRouter(
      <Navbar isDarkMode={false} setIsDarkMode={mockSetIsDarkMode} />
    )

    // Find hamburger button
    const hamburgerButton = screen
      .getAllByRole('button')
      .find(btn => btn.querySelector('svg path[d*="M20.1694 16.75"]'))

    expect(hamburgerButton).toBeDefined()
    fireEvent.click(hamburgerButton!)

    // Mobile menu should appear with navigation items
    const aboutLinks = screen.getAllByText('About')
    expect(aboutLinks.length).toBeGreaterThan(1) // Desktop + Mobile
  })

  it.skip('opens ecosystem dropdown on hover', () => {
    renderWithRouter(
      <Navbar isDarkMode={false} setIsDarkMode={mockSetIsDarkMode} />
    )

    const ecosystemButtons = screen.getAllByText('Ecosystem')
    const desktopEcosystemButton = ecosystemButtons[0]

    // Hover over Ecosystem
    fireEvent.mouseEnter(desktopEcosystemButton)

    // Dropdown items should appear
    const placeholders = screen.getAllByText('Placeholder')
    expect(placeholders.length).toBeGreaterThan(0)
  })

  it('applies correct CSS classes for light mode', () => {
    const { container } = renderWithRouter(
      <Navbar isDarkMode={false} setIsDarkMode={mockSetIsDarkMode} />
    )

    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('navbar-light')
    expect(nav).not.toHaveClass('navbar-dark')
  })

  it('applies correct CSS classes for dark mode', () => {
    const { container } = renderWithRouter(
      <Navbar isDarkMode={true} setIsDarkMode={mockSetIsDarkMode} />
    )

    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('navbar-dark')
    expect(nav).not.toHaveClass('navbar-light')
  })

  it('renders contact button with correct CSS class', () => {
    const { container } = renderWithRouter(
      <Navbar isDarkMode={false} setIsDarkMode={mockSetIsDarkMode} />
    )

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

  it('shows About as inactive color on /news-updates route (light mode)', () => {
    renderNavbar(false, '/news-updates')

    const aboutLinks = screen.getAllByText('About')
    expect(aboutLinks[0]).toHaveStyle({ color: '#5B6571' })
  })

  it('shows News & Updates as inactive color on home route (light mode)', () => {
    renderNavbar(false, '/')

    const newsLink = screen.getAllByText('News & Updates')[0]
    expect(newsLink).toHaveStyle({ color: '#5B6571' })
  })

  it('shows About as active color on /about route (light mode)', () => {
    renderNavbar(false, '/about')

    const aboutLinks = screen.getAllByText('About')
    expect(aboutLinks[0]).toHaveStyle({ color: '#5B5BB3' })
  })
})
