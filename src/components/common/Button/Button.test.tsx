import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button, ButtonIcon, LabelButton, LinkButton } from './Button'
import { ButtonSize } from './constants'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('renders as a button element', () => {
    render(<Button>Test</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button.tagName).toBe('BUTTON')
  })

  it('applies solid button type by default', () => {
    render(<Button>Solid</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('solid')
    expect(button).toHaveClass('text-white')
  })

  it('applies transparent button type', () => {
    render(<Button btnType="transparent">Transparent</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('transparent')
    expect(button).toHaveClass('text-primary-50')
  })

  it('applies disabled styles when disabled', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('!cursor-not-allowed')
    expect(button).toHaveClass('!opacity-[0.33]')
  })

  it('applies different sizes', () => {
    const { rerender } = render(<Button size={ButtonSize.SM}>Small</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('h-8')

    rerender(<Button size={ButtonSize.LG}>Large</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-12')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('applies custom width via style', () => {
    render(<Button width="200px">Wide</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle({ width: '200px' })
  })
})

describe('ButtonIcon', () => {
  it('renders children correctly', () => {
    render(<ButtonIcon>Icon Button</ButtonIcon>)
    expect(screen.getByText('Icon Button')).toBeInTheDocument()
  })

  it('renders as a button element', () => {
    render(<ButtonIcon>Test</ButtonIcon>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button.tagName).toBe('BUTTON')
  })

  it('applies solid button type by default', () => {
    render(<ButtonIcon>Solid</ButtonIcon>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('solid')
  })

  it('applies transparent button type', () => {
    render(<ButtonIcon btnType="transparent">Transparent</ButtonIcon>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('transparent')
  })

  it('applies disabled styles when disabled', () => {
    render(<ButtonIcon disabled>Disabled</ButtonIcon>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('!cursor-not-allowed')
  })

  it('applies custom width with min and max width', () => {
    render(<ButtonIcon width="300px">Wide Icon</ButtonIcon>)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle({
      width: '300px',
      minWidth: '300px',
      maxWidth: '300px',
    })
  })

  it('applies custom className', () => {
    render(<ButtonIcon className="icon-custom">Custom</ButtonIcon>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('icon-custom')
  })
})

describe('LabelButton', () => {
  it('renders children correctly', () => {
    render(<LabelButton htmlFor="test-input">Label Button</LabelButton>)
    expect(screen.getByText('Label Button')).toBeInTheDocument()
  })

  it('renders as a label element', () => {
    render(<LabelButton htmlFor="test-input">Test</LabelButton>)
    const label = screen.getByText('Test')
    expect(label.tagName).toBe('LABEL')
  })

  it('applies htmlFor attribute', () => {
    render(<LabelButton htmlFor="my-input">For Input</LabelButton>)
    const label = screen.getByText('For Input')
    expect(label).toHaveAttribute('for', 'my-input')
  })

  it('applies solid button type by default', () => {
    render(<LabelButton>Solid</LabelButton>)
    const label = screen.getByText('Solid')
    expect(label).toHaveClass('solid')
    expect(label).toHaveClass('text-white')
  })

  it('applies transparent button type', () => {
    render(<LabelButton btnType="transparent">Transparent</LabelButton>)
    const label = screen.getByText('Transparent')
    expect(label).toHaveClass('transparent')
    expect(label).toHaveClass('text-primary-50')
  })

  it('applies different sizes', () => {
    const { rerender } = render(
      <LabelButton size={ButtonSize.XS}>Extra Small</LabelButton>
    )
    let label = screen.getByText('Extra Small')
    expect(label).toHaveClass('h-6')

    rerender(<LabelButton size={ButtonSize.LG}>Large</LabelButton>)
    label = screen.getByText('Large')
    expect(label).toHaveClass('h-12')
  })

  it('applies custom className', () => {
    render(<LabelButton className="label-custom">Custom</LabelButton>)
    const label = screen.getByText('Custom')
    expect(label).toHaveClass('label-custom')
  })

  it('applies custom width via style', () => {
    render(<LabelButton width="250px">Wide Label</LabelButton>)
    const label = screen.getByText('Wide Label')
    expect(label).toHaveStyle({ width: '250px' })
  })
})

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
