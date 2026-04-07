import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LinkButton from './LinkButton'

describe('LinkButton', () => {
  it('renders children correctly', () => {
    render(
      <LinkButton href="/test" isDarkMode={false}>
        Click me
      </LinkButton>
    )
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('renders as disabled when no href provided', () => {
    render(<LinkButton isDarkMode={false}>Disabled</LinkButton>)
    const button = screen.getByText('Disabled').closest('a')
    expect(button).toHaveClass('opacity-50')
    expect(button).toHaveClass('cursor-not-allowed')
  })

  it('renders as disabled when isDisabled is true', () => {
    render(
      <LinkButton href="/test" isDarkMode={false} isDisabled>
        Disabled
      </LinkButton>
    )
    const button = screen.getByText('Disabled').closest('a')
    expect(button).toHaveClass('opacity-50')
  })

  it('applies dark mode styles', () => {
    render(
      <LinkButton href="/test" isDarkMode={true}>
        Dark Mode
      </LinkButton>
    )
    const button = screen.getByText('Dark Mode').closest('a')
    expect(button).toHaveClass('text-black')
    expect(button).toHaveClass('bg-primary-60')
  })

  it('applies light mode styles', () => {
    render(
      <LinkButton href="/test" isDarkMode={false}>
        Light Mode
      </LinkButton>
    )
    const button = screen.getByText('Light Mode').closest('a')
    expect(button).toHaveClass('text-white')
    expect(button).toHaveClass('bg-primary-60')
  })

  it('applies custom className', () => {
    render(
      <LinkButton href="/test" isDarkMode={false} className="custom-class">
        Custom
      </LinkButton>
    )
    const button = screen.getByText('Custom').closest('a')
    expect(button).toHaveClass('custom-class')
  })
})
