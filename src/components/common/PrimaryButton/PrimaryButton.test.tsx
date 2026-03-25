import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import PrimaryButton from './PrimaryButton'

describe('PrimaryButton', () => {
  it('renders children text', () => {
    const { getByText } = render(<PrimaryButton>Click Me</PrimaryButton>)
    expect(getByText('Click Me')).toBeTruthy()
  })

  it('renders as a button by default', () => {
    const { container } = render(<PrimaryButton>Test</PrimaryButton>)
    const button = container.querySelector('button')
    expect(button).toBeTruthy()
    expect(button?.type).toBe('button')
  })

  it('renders as a label when as="label"', () => {
    const { container } = render(
      <PrimaryButton as="label" htmlFor="file-input">
        Browse
      </PrimaryButton>
    )
    const label = container.querySelector('label')
    expect(label).toBeTruthy()
    expect(label?.getAttribute('for')).toBe('file-input')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    const { getByText } = render(
      <PrimaryButton onClick={onClick}>Click</PrimaryButton>
    )
    fireEvent.click(getByText('Click'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies custom className', () => {
    const { container } = render(
      <PrimaryButton className="my-class">Test</PrimaryButton>
    )
    const button = container.querySelector('button')
    expect(button?.classList.contains('standard-button-primary')).toBe(true)
    expect(button?.classList.contains('my-class')).toBe(true)
  })

  it('renders icon when provided', () => {
    const { container } = render(
      <PrimaryButton icon={<span data-testid="icon">*</span>}>
        With Icon
      </PrimaryButton>
    )
    const iconFrame = container.querySelector('.contextual-icon-frame')
    expect(iconFrame).toBeTruthy()
  })

  it('does not render icon frame when no icon', () => {
    const { container } = render(<PrimaryButton>No Icon</PrimaryButton>)
    const iconFrame = container.querySelector('.contextual-icon-frame')
    expect(iconFrame).toBeNull()
  })

  it('supports disabled state', () => {
    const { container } = render(
      <PrimaryButton disabled>Disabled</PrimaryButton>
    )
    const button = container.querySelector('button')
    expect(button?.disabled).toBe(true)
  })

  it('supports submit type', () => {
    const { container } = render(
      <PrimaryButton type="submit">Submit</PrimaryButton>
    )
    const button = container.querySelector('button')
    expect(button?.type).toBe('submit')
  })
})
