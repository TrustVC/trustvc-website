import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('moves focus inside the dialog on open', () => {
    const { getByRole } = render(
      <>
        <button type="button">Outside</button>
        <Overlay ariaLabel="Confirm">
          <button type="button">Inside</button>
        </Overlay>
      </>
    )

    expect(getByRole('button', { name: 'Inside' })).toHaveFocus()
  })

  it('traps keyboard focus within the dialog', async () => {
    const user = userEvent.setup()
    const { getByRole } = render(
      <Overlay ariaLabel="Confirm">
        <button type="button">First</button>
        <button type="button">Last</button>
      </Overlay>
    )

    expect(getByRole('button', { name: 'First' })).toHaveFocus()
    await user.tab()
    expect(getByRole('button', { name: 'Last' })).toHaveFocus()
    await user.tab()
    expect(getByRole('button', { name: 'First' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(getByRole('button', { name: 'Last' })).toHaveFocus()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <Overlay ariaLabel="Confirm" onClose={onClose}>
        <button type="button">Inside</button>
      </Overlay>
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not call onClose on Escape when onClose is omitted', () => {
    render(
      <Overlay ariaLabel="Confirm">
        <button type="button">Inside</button>
      </Overlay>
    )

    expect(() => fireEvent.keyDown(document, { key: 'Escape' })).not.toThrow()
  })

  it('restores focus to the previously focused element after close', async () => {
    const user = userEvent.setup()
    const TriggeredOverlay = () => {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          {open && (
            <Overlay ariaLabel="Confirm" onClose={() => setOpen(false)}>
              <button type="button">Inside</button>
            </Overlay>
          )}
        </>
      )
    }

    const { getByRole, queryByRole } = render(<TriggeredOverlay />)
    const openButton = getByRole('button', { name: 'Open' })
    openButton.focus()
    await user.click(openButton)

    expect(getByRole('button', { name: 'Inside' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(queryByRole('dialog')).not.toBeInTheDocument()
    expect(openButton).toHaveFocus()
  })
})
