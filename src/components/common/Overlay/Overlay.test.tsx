import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import Overlay from './Overlay'

describe('Overlay', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Overlay>
        <span>Hello</span>
      </Overlay>
    )
    expect(getByText('Hello')).toBeTruthy()
  })

  it('applies custom className', () => {
    const { container } = render(
      <Overlay className="custom-class">
        <span>Content</span>
      </Overlay>
    )
    const overlay = container.querySelector('.overlay')
    expect(overlay?.classList.contains('custom-class')).toBe(true)
  })

  it('has role="dialog" and aria-modal="true"', () => {
    const { container } = render(
      <Overlay>
        <span>Content</span>
      </Overlay>
    )
    const overlay = container.querySelector('.overlay')
    expect(overlay?.getAttribute('role')).toBe('dialog')
    expect(overlay?.getAttribute('aria-modal')).toBe('true')
  })

  it('calls onClose when clicking overlay background', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Overlay onClose={onClose}>
        <span>Content</span>
      </Overlay>
    )
    const overlay = container.querySelector('.overlay') as HTMLElement
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not call onClose when clicking children', () => {
    const onClose = vi.fn()
    const { getByText } = render(
      <Overlay onClose={onClose}>
        <span>Content</span>
      </Overlay>
    )
    fireEvent.click(getByText('Content'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('locks body scroll on mount and restores on unmount', () => {
    document.body.style.overflow = 'auto'
    try {
      const { unmount } = render(
        <Overlay>
          <span>Content</span>
        </Overlay>
      )
      expect(document.body.style.overflow).toBe('hidden')
      unmount()
      expect(document.body.style.overflow).toBe('auto')
    } finally {
      document.body.style.overflow = ''
    }
  })
})
