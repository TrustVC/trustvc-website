import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import UploadIcon from './UploadIcon'

describe('UploadIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<UploadIcon />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('uses currentColor for fill', () => {
    const { container } = render(<UploadIcon />)
    const path = container.querySelector('path')
    expect(path?.getAttribute('fill')).toBe('currentColor')
  })

  it('applies className', () => {
    const { container } = render(<UploadIcon className="upload-icon" />)
    expect(
      container.querySelector('svg')?.classList.contains('upload-icon')
    ).toBe(true)
  })

  it('passes through extra SVG props', () => {
    const { container } = render(<UploadIcon data-testid="upload" />)
    expect(container.querySelector('[data-testid="upload"]')).toBeTruthy()
  })
})
