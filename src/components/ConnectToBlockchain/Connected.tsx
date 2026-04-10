import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import { useProviderContext } from '../common/contexts/providerContext'
import ConnectToBlockchainModel from '.'
import { useOverlayContext } from '../common/contexts/OverlayContext'

interface ConnectedProps {
  imgSrc: string
  openConnectToBlockchainModel?: boolean
  withCardLayout?: boolean
  account?: string
}

export const Connected: React.FC<ConnectedProps> = ({
  imgSrc,
  openConnectToBlockchainModel = false,
  withCardLayout = true,
  account: accountProp,
}) => {
  const [tooltipMessage, setTooltipMessage] = useState(
    openConnectToBlockchainModel ? '' : 'Copy'
  )
  const tooltipRef = useRef<HTMLButtonElement>(null)
  const [displayedAccount, setDisplayedAccount] = useState('')
  const accountRef = useRef<HTMLHeadingElement>(null)
  const { account: contextAccount } = useProviderContext()
  const { showOverlay, closeOverlay } = useOverlayContext()
  const account = accountProp || contextAccount
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  const updateDisplayedAccount = useCallback(() => {
    if (account && accountRef.current) {
      const accountWidth = accountRef.current!.clientWidth
      const charCount = Math.floor(accountWidth / 9) // Approximate character width
      const startSlice = Math.max(0, charCount - 6)
      if (startSlice < account?.length) {
        setDisplayedAccount(
          `${account.slice(0, startSlice)}...${account.slice(-4)}`
        )
      } else {
        setDisplayedAccount(account)
      }
    }
  }, [account])

  useEffect(() => {
    // Remove event listener on cleanup
    return () => {
      if (account && window?.removeEventListener) {
        window.removeEventListener('resize', updateDisplayedAccount)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    updateDisplayedAccount()
    window.addEventListener('resize', updateDisplayedAccount)
    return () => window.removeEventListener('resize', updateDisplayedAccount)
  }, [updateDisplayedAccount])

  const handleActiveWalletClicked = async () => {
    if (openConnectToBlockchainModel) {
      showOverlay(<ConnectToBlockchainModel onClose={closeOverlay} />)
    } else if (account) {
      try {
        await navigator.clipboard.writeText(account)
        setTooltipMessage('Copied!')
        setIsTooltipOpen(true)
      } catch (err) {
        console.error('Failed to copy: ', err)
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onMouseLeave={() => {
          if (openConnectToBlockchainModel) return

          setTimeout(() => {
            setIsTooltipOpen(false)
            setTooltipMessage('Copy')
          }, 1_000)
        }}
        onMouseEnter={() => {
          if (openConnectToBlockchainModel) return

          setTooltipMessage('Copy')
          setIsTooltipOpen(true)
        }}
        ref={tooltipRef}
        data-tooltip-id="active-wallet-tooltip"
        data-tooltip-content={tooltipMessage}
        onClick={handleActiveWalletClicked}
        data-testid="activeWallet"
        className={`connected-wallet-container ${
          withCardLayout ? 'with-shadow' : ''
        }`}
      >
        <img src={imgSrc} alt="Wallet Icon" className="connected-wallet-icon" />
        <div className="connected-wallet-info">
          <p className="small connected-wallet-label">
            {accountProp
              ? 'Wallet Address (MetaMask):'
              : 'Active Wallet Address'}
          </p>
          <div>
            <p
              data-testid="wallet-address"
              ref={accountRef}
              className="small connected-wallet-address"
            >
              {displayedAccount}
            </p>
          </div>
        </div>
        {!openConnectToBlockchainModel && (
          <div className="connected-wallet-copy-icon-boundary">
            <div className="connected-wallet-copy-icon-frame">
              <img
                src="/icons/copy.svg"
                alt="Copy"
                className="connected-wallet-copy-icon"
              />
            </div>
          </div>
        )}
      </button>
      {!openConnectToBlockchainModel && (
        <Tooltip
          id="active-wallet-tooltip"
          isOpen={isTooltipOpen}
          style={{
            backgroundColor: 'white',
            color: '#222',
            border: '1px solid #E7EAEC',
          }}
        />
      )}
    </>
  )
}

export default Connected
