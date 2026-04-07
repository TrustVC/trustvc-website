import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Spinner from './Spinner'

describe('Spinner', () => {
  it('renders with default small size', () => {
    const { container } = render(<Spinner />)
    const spinner = container.querySelector('.spinner')
    expect(spinner?.classList.contains('spinner-small')).toBe(true)
  })

  it('renders with medium size', () => {
    const { container } = render(<Spinner size="medium" />)
    const spinner = container.querySelector('.spinner')
    expect(spinner?.classList.contains('spinner-medium')).toBe(true)
  })

  it('renders with large size', () => {
    const { container } = render(<Spinner size="large" />)
    const spinner = container.querySelector('.spinner')
    expect(spinner?.classList.contains('spinner-large')).toBe(true)
  })

  it('renders label text', () => {
    const { getByText } = render(<Spinner label="Loading..." />)
    expect(getByText('Loading...')).toBeTruthy()
  })

  it('renders without label', () => {
    const { container } = render(<Spinner />)
    const label = container.querySelector('.spinner-label')
    expect(label?.textContent).toBe('')
  })

  it('wraps in centered container when centered=true', () => {
    const { container } = render(<Spinner centered />)
    const wrapper = container.querySelector('.spinner-centered-wrapper')
    expect(wrapper).toBeTruthy()
  })

  it('does not wrap in centered container by default', () => {
    const { container } = render(<Spinner />)
    const wrapper = container.querySelector('.spinner-centered-wrapper')
    expect(wrapper).toBeNull()
  })

  it('applies custom className to centered wrapper', () => {
    const { container } = render(<Spinner centered className="my-spinner" />)
    const wrapper = container.querySelector('.spinner-centered-wrapper')
    expect(wrapper?.classList.contains('my-spinner')).toBe(true)
  })
})
