import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VerifySection from './VerifySection'

describe('VerifySection', () => {
  it('renders the dropbox text', () => {
    render(<VerifySection isDarkMode={false} />)
    expect(
      screen.getByText(/Drop TrustVC files here to verify/i)
    ).toBeInTheDocument()
  })

  it('renders the browse files button', () => {
    render(<VerifySection isDarkMode={false} />)
    expect(screen.getByText(/Browse Files/i)).toBeInTheDocument()
  })

  it('renders the demo section', () => {
    render(<VerifySection isDarkMode={false} />)
    expect(screen.getByText(/Try our demo document!/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Experience the interoperability of our documents/i)
    ).toBeInTheDocument()
  })

  it('renders the Visit Document Gallery button', () => {
    render(<VerifySection isDarkMode={false} />)
    expect(screen.getByText(/Visit Document Gallery/i)).toBeInTheDocument()
  })

  it('handles file input change without errors', () => {
    render(<VerifySection isDarkMode={false} />)

    const fileInput = document.querySelector('#file-upload') as HTMLInputElement
    const file = new File(['test'], 'test.tt', { type: 'text/plain' })

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })

    expect(() => fireEvent.change(fileInput)).not.toThrow()
    expect(fileInput.files?.[0]).toBe(file)
  })

  it('applies dark mode class when isDarkMode is true', () => {
    const { container } = render(<VerifySection isDarkMode={true} />)
    expect(container.querySelector('.verify-section')).toHaveClass('dark-mode')
  })

  it('navigates to root when CTA button is clicked', () => {
    const originalHref = window.location.href
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    })

    render(<VerifySection isDarkMode={false} />)
    const ctaButton = screen
      .getByText(/Visit Document Gallery/i)
      .closest('.cta-button')

    fireEvent.click(ctaButton!)
    expect(window.location.href).toBe('/')

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: originalHref },
    })
  })
})
