import React, { useState } from 'react'
import PrimaryButton from '../common/PrimaryButton'
import Connected from '../ConnectToBlockchain/Connected'
import {
  SIGNER_TYPE,
  useProviderContext,
} from '../common/contexts/providerContext'

export interface ConnectToMagicLinkModelProps {
  showOnNewConnectWarningMessage: boolean
  nextStep?: React.ReactNode
  showNetworkSection?: boolean
  handleContinue?: () => void
}

export const ConnectToMagicLinkModelComponent = ({
  showOnNewConnectWarningMessage = false,
  handleContinue,
}: ConnectToMagicLinkModelProps) => {
  const { providerType, account, disconnectWallet } = useProviderContext()

  const handleDisconnect = () => {
    disconnectWallet()
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
          <PrimaryButton
            data-testid="disconnect-magic"
            className="connect-metamask-disconnect-btn"
            onClick={handleDisconnect}
            btnType="transparent"
            labelClassName="connect-metamask-disconnect-btn-label"
          >
            Disconnect
          </PrimaryButton>
          <PrimaryButton
            data-testid="connect-blockchain-continue"
            className="connect-metamask-disconnect-btn"
            btnType="solid"
            labelClassName="connect-metamask-disconnect-btn-label"
            onClick={handleContinue}
          >
            Continue
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}

const ConnectToMagicLink: React.FC = () => {
  const { account, providerType, upgradeToMagicSigner } = useProviderContext()
  const [errorMessage, setErrorMessage] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const magicIconSrc =
    typeof document !== 'undefined' &&
    document.body.classList.contains('dark-mode')
      ? '/images/magic_link_dark.svg'
      : '/images/magic_link.svg'

  const handleConnectWallet = async () => {
    setErrorMessage('')
    setIsConnecting(true)
    try {
      await upgradeToMagicSigner()
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to connect with Magic Link.')
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
          <PrimaryButton
            className="connect-metamask-button"
            data-testid="connectToMagicLink"
            onClick={handleConnectWallet}
            btnType="transparent"
            labelClassName="connect-metamask-button-text"
            boundaryClassName="connect-metamask-button-boundary"
            disabled={isConnecting}
          >
            <img
              src={magicIconSrc}
              alt="Magic Link"
              className="connect-metamask-button-icon"
            />
            <h3>
              {isConnecting ? 'Connecting...' : 'Connect with Magic Link'}
            </h3>
          </PrimaryButton>
          {errorMessage && (
            <p className="text-left text-sm text-red-500 mt-2">
              {errorMessage}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default ConnectToMagicLink
