import React from 'react'

interface NetworkTooltipProps {
  isVisible: boolean
  position: {
    top: number
    left: number
    width: number
  }
}

const NetworkTooltip: React.FC<NetworkTooltipProps> = ({
  isVisible,
  position,
}) => {
  if (!isVisible) return null

  return (
    <div
      className="fixed z-[1001] pointer-events-none"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
      }}
    >
      <div className="nm-tooltip-inner" style={{ pointerEvents: 'auto' }}>
        <p className="nm-tooltip-title">Network Selector</p>
        <p className="nm-tooltip-body">
          A document can only be successfully verified on the same network where
          the document was created in.
        </p>
        <p className="nm-tooltip-body">
          If unsure, do check with the document issuer.
        </p>
      </div>
    </div>
  )
}

export default NetworkTooltip
