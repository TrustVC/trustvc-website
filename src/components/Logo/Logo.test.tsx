import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Logo from './Logo'

describe('Logo Component', () => {
  it('renders logo with icon and text', () => {
    const { container } = render(<Logo isDarkMode={false} />)

    // Check if logo wrapper exists
    const logoWrapper = container.querySelector('.logo-wrapper')
    expect(logoWrapper).toBeInTheDocument()

    // Check if both SVGs are rendered
    const svgs = container.querySelectorAll('svg')
    expect(svgs).toHaveLength(2)
  })

  it('renders with light mode colors', () => {
    const { container } = render(<Logo isDarkMode={false} />)

    const logoText = container.querySelector('.logo-light')
    expect(logoText).toBeInTheDocument()
    expect(logoText).not.toHaveClass('logo-dark')
  })

  it('renders with dark mode colors', () => {
    const { container } = render(<Logo isDarkMode={true} />)

    const logoText = container.querySelector('.logo-dark')
    expect(logoText).toBeInTheDocument()
    expect(logoText).not.toHaveClass('logo-light')
  })

  it('has a link to homepage', () => {
    const { container } = render(<Logo isDarkMode={false} />)

    const link = container.querySelector('a[href="/"]')
    expect(link).toBeInTheDocument()
  })

  it('generates unique gradient IDs', () => {
    const { container: container1 } = render(<Logo isDarkMode={false} />)
    const { container: container2 } = render(<Logo isDarkMode={false} />)

    const gradient1 = container1.querySelector('linearGradient')
    const gradient2 = container2.querySelector('linearGradient')

    expect(gradient1?.id).toBeDefined()
    expect(gradient2?.id).toBeDefined()
    expect(gradient1?.id).not.toBe(gradient2?.id)
  })
})
