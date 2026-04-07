import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroSection from './HeroSection'

describe('HeroSection', () => {
  it('renders the hero title correctly', () => {
    render(<HeroSection isDarkMode={false} />)
    expect(screen.getByText(/Simple,/i)).toBeInTheDocument()
    expect(screen.getByText(/Trustworthy/i)).toBeInTheDocument()
    expect(screen.getByText(/Verifiable/i)).toBeInTheDocument()
    expect(screen.getByText(/Credentials/i)).toBeInTheDocument()
  })

  it('renders the hero description', () => {
    render(<HeroSection isDarkMode={false} />)
    expect(
      screen.getByText(/One SDK, multiple verification systems./i)
    ).toBeInTheDocument()
  })

  it('applies dark mode class when isDarkMode is true', () => {
    const { container } = render(<HeroSection isDarkMode={true} />)
    expect(container.querySelector('.hero-section')).toHaveClass('dark-mode')
  })

  it('does not apply dark mode class when isDarkMode is false', () => {
    const { container } = render(<HeroSection isDarkMode={false} />)
    expect(container.querySelector('.hero-section')).not.toHaveClass(
      'dark-mode'
    )
  })

  it('renders gradient text for Trustworthy', () => {
    const { container } = render(<HeroSection isDarkMode={false} />)
    const gradientText = container.querySelector('.hero-gradient-text')
    expect(gradientText).toBeInTheDocument()
    expect(gradientText).toHaveTextContent('Trustworthy')
  })
})
