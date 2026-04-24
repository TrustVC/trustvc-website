import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from './__tests__/test-utils'
import App from './App'

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    document.body.classList.remove('dark-mode')
  })

  it('renders without crashing', () => {
    render(<App />)
  })

  it('renders Navbar component', () => {
    render(<App />)

    // Check if navigation elements are present
    expect(screen.getByText('Home')).toBeInTheDocument()
    // Ecosystem temporarily removed
    expect(screen.getByText('News & Updates')).toBeInTheDocument()
  })

  it('starts with light mode by default', () => {
    const { container } = render(<App />)

    const app = document.querySelector('.app-shell') // class change due to backgound diff in main screen and contact/news page
    expect(app).toBeInTheDocument()
    const nav = container.querySelector('.navbar-light')
    expect(nav).toBeInTheDocument()
    expect(document.body.classList.contains('dark-mode')).toBe(false)
  })

  it.skip('persists dark mode to localStorage', () => {
    render(<App />)

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

    const { container } = render(<App />)

    // Check if navbar has dark mode class
    const nav = container.querySelector('.navbar-dark')
    expect(nav).toBeInTheDocument()
  })

  it('applies dark mode class on the document body', () => {
    localStorage.setItem('darkMode', 'true')

    render(<App />)

    expect(document.body.classList.contains('dark-mode')).toBe(true)
  })

  it('renders NotFound page for unknown routes', () => {
    render(<App />, {
      routerProps: { initialEntries: ['/unknown-route'] },
    })

    expect(screen.getByText(/Page not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to Home/i })).toHaveAttribute(
      'href',
      '/'
    )
  })
})
