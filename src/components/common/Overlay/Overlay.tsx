import React, { useEffect, useRef } from 'react'

const TABBABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const isTabbable = (element: HTMLElement): boolean => {
  if (element.tabIndex < 0) return false
  if (element.hasAttribute('disabled')) return false
  if (element.closest('fieldset[disabled]')) return false
  if (element.hidden || element.closest('[hidden]')) return false
  if (element.closest('[aria-hidden="true"]')) return false
  if (element.closest('[inert]')) return false

  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false
  }

  return true
}

const getTabbableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter(
    isTabbable
  )

interface OverlayProps {
  children: React.ReactNode
  className?: string
  ariaLabel?: string
  onClose?: () => void
}

const Overlay: React.FC<OverlayProps> = ({
  children,
  className,
  ariaLabel,
  onClose,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger onClose if clicking the overlay itself, not its children
    if (e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const overlay = overlayRef.current
    const initialFocus = overlay
      ? (getTabbableElements(overlay)[0] ?? overlay)
      : null
    initialFocus?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (onCloseRef.current) {
          event.preventDefault()
          onCloseRef.current()
        }
        return
      }

      if (event.key !== 'Tab' || !overlay) {
        return
      }

      const tabbable = getTabbableElements(overlay)
      if (tabbable.length === 0) {
        event.preventDefault()
        overlay.focus()
        return
      }

      const first = tabbable[0]
      const last = tabbable[tabbable.length - 1]
      const active = document.activeElement

      if (event.shiftKey) {
        if (active === first || !overlay.contains(active)) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (active === last || !overlay.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocus && document.contains(previousFocus)) {
        previousFocus.focus()
      }
    }
  }, [])

  return (
    <div
      ref={overlayRef}
      className={`overlay ${className || ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      tabIndex={-1}
    >
      <div className="overlay-content flex justify-center items-center">
        {children}
      </div>
    </div>
  )
}

export default Overlay
