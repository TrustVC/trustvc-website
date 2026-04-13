import React, { useState } from 'react'
import { toErrorMessage } from '../../utils/helper'
import { getMagicLinkIconSrc } from '../../utils/magicWallet'
import { Button, ButtonSize } from '../common/Button'
import PrimaryButton from '../common/PrimaryButton'
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
  const magicIconSrc = getMagicLinkIconSrc()

  const handleConnectWallet = async () => {
    setErrorMessage('')
    setIsConnecting(true)
    try {
      await upgradeToMagicSigner()
    } catch (error: unknown) {
      setErrorMessage(
        toErrorMessage(error, 'Unable to connect with Magic Link.')
      )
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
              className="connect-metamask-button-icon"
            />
            <h3>
              {isConnecting ? 'Connecting...' : 'Connect with Magic Link'}
            </h3>
          </Button>
          {errorMessage && (
            <div className="text-left mt-2 field-error-text block" role="alert">
              {errorMessage}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ConnectToMagicLink
