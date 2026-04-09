import React from 'react'
import { Button } from '../../common/Button'

export const FooterActionButtons = ({
  setShowEndorsementChain,
  closeOverlay,
}: {
  setShowEndorsementChain: (payload: boolean) => void
  closeOverlay: () => void
}) => {
  return (
    <div className="w-full flex flex-col xs:flex-row mx-0 gap-2">
      <Button
        className=""
        onClick={() => {
          /* Handle action */
          setShowEndorsementChain(true)
          closeOverlay()
        }}
      >
        View Endorsement Chain
      </Button>
    </div>
  )
}
