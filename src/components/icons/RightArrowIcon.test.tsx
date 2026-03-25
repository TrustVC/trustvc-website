import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import RightArrowIcon from './RightArrowIcon'

describe('RightArrowIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<RightArrowIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('has correct default dimensions', () => {
    const { container } = render(<RightArrowIcon />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('24px')
    expect(svg?.getAttribute('height')).toBe('24px')
  })

  it('uses currentColor as default fill', () => {
    const { container } = render(<RightArrowIcon />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('fill')).toBe('currentColor')
  })

  it('passes through additional SVG props', () => {
    const { container } = render(
      <RightArrowIcon data-testid="arrow" className="my-icon" />
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('data-testid')).toBe('arrow')
    expect(svg?.classList.contains('my-icon')).toBe(true)
  })
})
