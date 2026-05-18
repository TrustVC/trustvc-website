import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EcosystemCard from './EcosystemCard'

describe('EcosystemCard', () => {
  it('renders the heading', () => {
    render(<EcosystemCard />)
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /How TrustVC Powers Multiple Ecosystems/i,
      })
    ).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<EcosystemCard />)
    expect(
      screen.getByText(
        /One foundational platform, unlimited verification possibilities/i
      )
    ).toBeInTheDocument()
  })

  it('renders the center image with correct alt text', () => {
    render(<EcosystemCard />)
    expect(
      screen.getByAltText(/How TrustVC Powers Multiple Ecosystems/i)
    ).toBeInTheDocument()
  })

  it('renders the center image with correct src', () => {
    render(<EcosystemCard />)
    expect(
      screen.getByAltText(/How TrustVC Powers Multiple Ecosystems/i)
    ).toHaveAttribute('src', '/images/about/center-image.svg')
  })

  it('applies the ecosystem card CSS classes', () => {
    const { container } = render(<EcosystemCard />)
    expect(container.querySelector('.about-ecosystem-card')).toBeInTheDocument()
    expect(
      container.querySelector('.about-ecosystem-card-content')
    ).toBeInTheDocument()
  })

  it('has rounded corners only on sm+ breakpoint', () => {
    const { container } = render(<EcosystemCard />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.classList.contains('sm:rounded-2xl')).toBe(true)
    expect(wrapper.classList.contains('rounded-2xl')).toBe(false)
  })

  it('subtitle has white color style', () => {
    render(<EcosystemCard />)
    const subtitle = screen.getByText(
      /One foundational platform, unlimited verification possibilities/i
    )
    expect(subtitle).toHaveStyle({ color: '#FFFFFF' })
  })
})
