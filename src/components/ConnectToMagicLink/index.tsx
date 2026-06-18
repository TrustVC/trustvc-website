import React, { useState } from 'react'
import { toErrorMessage } from '../../utils/helper'
import { getMagicLinkIconSrc } from '../../utils/magicWallet'
import { Button, ButtonSize } from '../common/Button'
import Connected from '../ConnectToBlockchain/Connected'
import {
  SIGNER_TYPE,
  useProviderContext,
} from '../common/contexts/providerContext'

export interface ConnectToMagicLinkModelProps {
  showOnNewConnectWarningMessage?: boolean
  handleContinue?: () => void
}

export const ConnectToMagicLinkModelComponent = ({
  showOnNewConnectWarningMessage = false,
  handleContinue,
}: ConnectToMagicLinkModelProps) => {
  const { providerType, account, disconnectWallet } = useProviderContext()

  const handleDisconnect = () => {
    void disconnectWallet().catch(() => {
      // Optional: surface a toast/error state
    })
  }

  return (
    <div className="frame">
      {providerType === SIGNER_TYPE.MAGIC && account && (
        <div className="connected-text">
          <p className="connect-metamask-connected-label">Connected as: </p>
        </div>
      )}

      <ConnectToMagicLink />
      {showOnNewConnectWarningMessage &&
        providerType !== SIGNER_TYPE.MAGIC &&
        providerType !== SIGNER_TYPE.NONE &&
        account && (
          <div className="connect-metamask-warning">
            <img
              src="/icons/warning.svg"
              alt="Warning"
              className="connect-metamask-warning-icon"
            />
            <p className="connect-metamask-warning-text">
              You&apos;ll be logged out of Metamask if you login with MagicLink
            </p>
          </div>
        )}
      {providerType === SIGNER_TYPE.MAGIC && account && (
        <div className="connect-metamask-disconnect-container">
          <Button
            data-testid="disconnect-magic"
            className="connect-metamask-disconnect-btn connect-metamask-disconnect-btn-label"
            onClick={handleDisconnect}
            btnType="transparent"
          >
            Disconnect
          </Button>
          <Button
            data-testid="connect-blockchain-continue connect-metamask-disconnect-btn-label"
            className="connect-metamask-disconnect-btn"
            btnType="solid"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  )
}

const ConnectToMagicLink: React.FC = () => {
  const { account, providerType, upgradeToMagicSigner } = useProviderContext()
  const [errorMessage, setErrorMessage] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const magicIconSrc = getMagicLinkIconSrc()

  const getWalletErrorMessage = (error: unknown): string => {
    const fallback = 'Unable to connect with Magic Link.'
    const message = toErrorMessage(error, fallback)

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'number'
    ) {
      const code = (error as { code: number }).code
      if (code === 4001) {
        return 'Connection request was rejected.'
      }
      if (code === -32002) {
        return 'A wallet request is already pending. Please complete it first.'
      }
    }

    return message
  }

  const handleConnectWallet = async () => {
    setErrorMessage('')
    setIsConnecting(true)
    try {
      await upgradeToMagicSigner()
    } catch (error: unknown) {
      setErrorMessage(getWalletErrorMessage(error))
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="connect-metamask-container">
      {providerType === SIGNER_TYPE.MAGIC && account ? (
        <Connected
          imgSrc={magicIconSrc}
          openConnectToBlockchainModel={false}
          withCardLayout={false}
        />
      ) : (
        <>
          <Button
            className="connect-metamask-button connect-metamask-button-text connect-metamask-button-boundary"
            data-testid="connectToMagicLink"
            onClick={handleConnectWallet}
            btnType="transparent"
            size={ButtonSize.LG}
            disabled={isConnecting}
            type="button"
          >
            <img
              src={magicIconSrc}
              alt="Magic Link"
              className="connect-magiclink-button-icon"
            />
            <h3>
              {isConnecting ? 'Connecting...' : 'Connect with Magic Link'}
            </h3>
          </Button>
          {errorMessage && (
            <div className="connect-wallet-error" role="alert">
              <img
                src="/icons/error.svg"
                alt=""
                aria-hidden="true"
                className="connect-wallet-error-icon"
              />
              <span className="connect-wallet-error-text">{errorMessage}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ConnectToMagicLink
