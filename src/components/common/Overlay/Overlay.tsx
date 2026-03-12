import React from 'react'

interface OverlayProps {
  children: React.ReactNode
  className?: string
  onClose?: () => void
}

const Overlay: React.FC<OverlayProps> = ({ children, className, onClose }) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger onClose if clicking the overlay itself, not its children
    if (e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  return (
    <div
      className={`overlay ${className || ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="overlay-content">{children}</div>
    </div>
  )
}

export default Overlay
