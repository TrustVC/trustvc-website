import React, { createContext, useContext, useState, ReactNode } from 'react'

interface OverlayContextType {
  overlayContent: ReactNode | null
  isOverlayVisible: boolean
  showOverlay: (content: ReactNode) => void
  closeOverlay: () => void
  setOverlayVisible: (visible: boolean) => void
}

// eslint-disable-next-line
export const OverlayContext = createContext<OverlayContextType | undefined>(
  undefined
)

// eslint-disable-next-line
export const useOverlayContext = (): OverlayContextType => {
  const context = useContext(OverlayContext)
  if (!context) {
    throw new Error('useOverlayContext must be used within an OverlayProvider')
  }
  return context
}

interface OverlayProviderProps {
  children: ReactNode
}

export const OverlayProvider: React.FC<OverlayProviderProps> = ({
  children,
}) => {
  const [overlayContent, setOverlayContent] = useState<ReactNode | null>(null)
  const [isOverlayVisible, setOverlayVisible] = useState(false)

  const showOverlay = (content: ReactNode) => {
    setOverlayContent(content)
    setOverlayVisible(true)
  }

  const closeOverlay = () => {
    console.log('closeOverlay called')
    setOverlayVisible(false)
    setOverlayContent(null)
  }

  return (
    <OverlayContext.Provider
      value={{
        overlayContent,
        isOverlayVisible,
        showOverlay,
        closeOverlay,
        setOverlayVisible,
      }}
    >
      {children}
      {isOverlayVisible && overlayContent && (
        <div className="overlay-container">{overlayContent}</div>
      )}
    </OverlayContext.Provider>
  )
}
