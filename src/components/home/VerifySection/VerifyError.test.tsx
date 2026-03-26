import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import VerifyError from './VerifyError'

describe('VerifyError', () => {
  const defaultProps = {
    errorMessage: 'Something went wrong',
    onReset: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the error message', () => {
    const { getByText } = render(<VerifyError {...defaultProps} />)
    expect(getByText('Something went wrong')).toBeTruthy()
  })

  it('renders Try again button', () => {
    const { getByText } = render(<VerifyError {...defaultProps} />)
    expect(getByText('Try again')).toBeTruthy()
  })

  it('calls onReset when Try again is clicked', () => {
    const onReset = vi.fn()
    const { getByText } = render(
      <VerifyError errorMessage="Error" onReset={onReset} />
    )
    fireEvent.click(getByText('Try again'))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('renders error icon SVG', () => {
    const { container } = render(<VerifyError {...defaultProps} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('fill')).toBe('#ef4444')
  })

  it('renders with correct container classes', () => {
    const { container } = render(<VerifyError {...defaultProps} />)
    expect(container.querySelector('.frame-dropbox')).toBeTruthy()
    expect(container.querySelector('.dropbox-area--centered')).toBeTruthy()
  })
})
