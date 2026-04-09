import React, { useEffect } from 'react'

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
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger onClose if clicking the overlay itself, not its children
    if (e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  // Lock body scroll when overlay is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  return (
    <div
      className={`overlay ${className || ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div className="overlay-content">{children}</div>
    </div>
  )
}

export default Overlay
