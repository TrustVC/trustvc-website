import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BuiltForDev from './BuiltForDev'

const FEATURES = [
  'Quick Integration: Simple SDK with TypeScript support and comprehensive examples',
  'Full Documentation: Step by step guide with real-world examples',
  'Open Source: Transparent roadmap and community contributions',
  'Backwards-compatible: Verify existing .oa documents while you migrate to W3C VC',
]

describe('BuiltForDev', () => {
  it('renders headings and description', () => {
    render(<BuiltForDev isDarkMode={false} />)

    expect(screen.getByText(/Built for Developers,/i)).toBeInTheDocument()
    expect(screen.getByText(/Trusted by Enterprises/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Get started in minutes with our comprehensive documentation/i
      )
    ).toBeInTheDocument()
  })

  it('renders all feature statements', () => {
    render(<BuiltForDev isDarkMode={false} />)
    FEATURES.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument()
    })
  })

  it('renders CTA buttons with correct destinations', () => {
    render(<BuiltForDev isDarkMode={false} />)

    const docsLink = screen
      .getByRole('link', { name: /TrustVC Documentation/i })
      .getAttribute('href')
    expect(docsLink).toBe('https://docs.trustvc.io')

    const githubLink = screen
      .getByRole('link', { name: /View on GitHub/i })
      .getAttribute('href')
    expect(githubLink).toBe('https://github.com/TrustVC/trustvc')
  })

  it('applies dark mode styling to heading when enabled', () => {
    render(<BuiltForDev isDarkMode={true} />)

    const heading = screen.getByText(/Built for Developers,/i)
    expect(heading).toHaveClass('text-neutral-60')
  })
})
