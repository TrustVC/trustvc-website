import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import ChevronDownIcon from './ChevronDownIcon'

describe('ChevronDownIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<ChevronDownIcon />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('uses default fill color', () => {
    const { container } = render(<ChevronDownIcon />)
    const path = container.querySelector('path')
    expect(path?.getAttribute('fill')).toBe('#5B6571')
  })

  it('accepts custom fill color', () => {
    const { container } = render(<ChevronDownIcon fillColor="#FF0000" />)
    const path = container.querySelector('path')
    expect(path?.getAttribute('fill')).toBe('#FF0000')
  })

  it('applies className', () => {
    const { container } = render(<ChevronDownIcon className="test-class" />)
    expect(
      container.querySelector('svg')?.classList.contains('test-class')
    ).toBe(true)
  })

  it('passes through extra SVG props', () => {
    const { container } = render(<ChevronDownIcon data-testid="chevron" />)
    expect(container.querySelector('[data-testid="chevron"]')).toBeTruthy()
  })
})
