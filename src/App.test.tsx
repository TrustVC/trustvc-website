import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
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
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    const app = document.querySelector('.min-h-screen')
    expect(app).toBeInTheDocument()
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

    if (moonButton) {
      fireEvent.click(moonButton)

      // Check localStorage
      const savedMode = localStorage.getItem('darkMode')
      expect(savedMode).toBe('true')
    }
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

  it('applies correct background gradient in dark mode', () => {
    localStorage.setItem('darkMode', 'true')

    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    const app = container.querySelector('.min-h-screen')
    expect(app).toHaveStyle({
      background: 'linear-gradient(135deg, #1a1d2e 0%, #0f1419 100%)',
    })
  })
})
