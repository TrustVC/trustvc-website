import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import CodeIcon from './CodeIcon'

describe('CodeIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<CodeIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('defaults to 24x24 size', () => {
    const { container } = render(<CodeIcon />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('24')
    expect(svg?.getAttribute('height')).toBe('24')
  })

  it('accepts custom fontSize', () => {
    const { container } = render(<CodeIcon fontSize={32} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('32')
    expect(svg?.getAttribute('height')).toBe('32')
  })

  it('accepts custom stroke color', () => {
    const { container } = render(<CodeIcon stroke="#ff0000" />)
    const paths = container.querySelectorAll('path')
    paths.forEach(path => {
      expect(path.getAttribute('stroke')).toBe('#ff0000')
    })
  })

  it('defaults to currentColor stroke', () => {
    const { container } = render(<CodeIcon />)
    const path = container.querySelector('path')
    expect(path?.getAttribute('stroke')).toBe('currentColor')
  })
})
