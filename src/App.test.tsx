import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    document.body.classList.remove('dark-mode')
  })

  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )
  })

  it('renders Navbar component', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    // Check if navigation elements are present
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Ecosystem')).toBeInTheDocument()
  })

  it('starts with light mode by default', () => {
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    const nav = container.querySelector('.navbar-light')
    expect(nav).toBeInTheDocument()
    expect(document.body.classList.contains('dark-mode')).toBe(false)
  })

  it('persists dark mode to localStorage', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    // Find and click moon icon to enable dark mode
    const buttons = screen.getAllByRole('button')
    const moonButton = buttons.find(btn =>
      btn.querySelector('svg path[d*="M10.0762"]')
    )

    expect(moonButton).toBeDefined()
    fireEvent.click(moonButton!)

    // Check localStorage
    const savedMode = localStorage.getItem('darkMode')
    expect(savedMode).toBe('true')
  })

  it('loads dark mode from localStorage', () => {
    // Set dark mode in localStorage
    localStorage.setItem('darkMode', 'true')

    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    // Check if navbar has dark mode class
    const nav = container.querySelector('.navbar-dark')
    expect(nav).toBeInTheDocument()
  })

  it('applies dark mode class on the document body', () => {
    localStorage.setItem('darkMode', 'true')

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    expect(document.body.classList.contains('dark-mode')).toBe(true)
  })

  it('renders NotFound page for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText(/Page not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to Home/i })).toHaveAttribute(
      'href',
      '/'
    )
  })
})
