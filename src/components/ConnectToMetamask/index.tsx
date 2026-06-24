import React, { useState } from 'react'
import Connected from '../ConnectToBlockchain/Connected'
// import { showDocumentTransferMessage } from '../UI/Overlay/OverlayContent'
// import { NetworkContent } from '../NetworkSection/NetworkContent'
// Warning icon - use inline SVG or import from public folder
import { toErrorMessage } from '../../utils/helper'
import {
  trackWalletConnected,
  trackWalletConnectFailed,
  trackWalletDisconnected,
} from '../../utils/analytics'
import {
  SIGNER_TYPE,
  useProviderContext,
} from '../common/contexts/providerContext'
// import { showDocumentTransferMessage } from '../common/Overlay/OverlayContent'
import { Button, ButtonSize } from '../common/Button'

export interface ConnectToMetamaskModelProps {
  showOnNewConnectWarningMessage: boolean
  nextStep?: React.ReactNode
  showNetworkSection?: boolean
  handleContinue?: () => void
}

export const ConnectToMetamaskModelComponent = ({
  showOnNewConnectWarningMessage = false,
  handleContinue,
}: ConnectToMetamaskModelProps) => {
  const { providerType, account, disconnectWallet } = useProviderContext()

  const handleDisconnect = async () => {
    try {
      await disconnectWallet()
      trackWalletDisconnected('metamask')
    } catch {
      // Optional: surface a toast/error state
    }
  }
  return (
    <div className="frame">
      {providerType === SIGNER_TYPE.METAMASK && account && (
        <div className="connected-text">
          <p className="connect-metamask-connected-label">Connected as: </p>
        </div>
      )}

      <ConnectToMetamask />
      {showOnNewConnectWarningMessage &&
        providerType !== SIGNER_TYPE.METAMASK &&
        providerType !== SIGNER_TYPE.NONE &&
        account && (
          <div className="connect-metamask-warning">
            <img
              src="/icons/warning.svg"
              alt="Warning"
              className="connect-metamask-warning-icon"
            />
            <p className="connect-metamask-warning-text">
              You&apos;ll be logged out of MagicLink if you login with Metamask
            </p>
          </div>
        )}
      {/* {showNetworkSection &&
        providerType === SIGNER_TYPE.METAMASK &&
        account && <NetworkContent disabled={false} />} */}
      {providerType === SIGNER_TYPE.METAMASK && account && (
        <div className="connect-metamask-disconnect-container">
          <Button
            className="connect-metamask-disconnect-btn"
            btnType="transparent"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
          <Button
            data-testid="connect-blockchain-continue"
            className="connect-metamask-disconnect-btn"
            btnType="solid"
            onClick={handleContinue}
            // disabled={
            //   !account || networkChangeLoading || currentChainId === undefined
            // }
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  )
}

interface ConnectToMetamaskProps {
  className?: string
  openConnectToBlockchainModel?: boolean
  withCardLayout?: boolean
}

const ConnectToMetamask: React.FC<ConnectToMetamaskProps> = ({
  className = '',
  openConnectToBlockchainModel = false,
  withCardLayout = false,
}) => {
  const { upgradeToMetaMaskSigner, account, providerType } =
    useProviderContext()
  const [errorMessage, setErrorMessage] = useState('')

  const getWalletErrorMessage = (error: unknown): string => {
    const fallback = 'Unable to connect with MetaMask.'
    const message = toErrorMessage(error, fallback)

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'number'
    ) {
      const code = (error as { code: number }).code
      if (code === 4001) {
        return 'Connection request was rejected in MetaMask.'
      }
      if (code === -32002) {
        return 'A MetaMask request is already pending. Please open MetaMask to continue.'
      }
    }

    return message
  }

  const handleConnectWallet = async () => {
    setErrorMessage('')
    try {
      await upgradeToMetaMaskSigner()
      trackWalletConnected('metamask')
    } catch (error: unknown) {
      trackWalletConnectFailed('metamask', getWalletErrorMessage(error))
      console.error('Error in handleConnectWallet:', error)
      handleMetamaskError(error)
    }
  }
  const handleMetamaskError = (error: unknown) => {
    setErrorMessage(getWalletErrorMessage(error))
    console.error('Error in handleMetamaskError:', error)
    // const isUserDeniedAccountAuthorization = errorCode === 4001
    // showOverlay(
    //   showDocumentTransferMessage(errorMesssage, {
    //     isSuccess: false,
    //     isButtonMetamaskInstall: !isUserDeniedAccountAuthorization,
    //   })
    // ) // there is 2 type of errors that will be handled here, 1st = NO_METAMASK (error thrown from provider.tsx), 2nd = NO_USER_AUTHORIZATION (error from metamask extension itself).
  }

  return (
    <div className={`connect-metamask-container ${className}`}>
      {providerType === SIGNER_TYPE.METAMASK && account ? (
        <Connected
          imgSrc="/images/wallet.png"
          openConnectToBlockchainModel={openConnectToBlockchainModel}
          withCardLayout={withCardLayout}
        />
      ) : (
        <>
          <Button
            className="connect-metamask-button connect-metamask-button-text connect-metamask-button-boundary"
            data-testid={'connectToMetamask'}
            onClick={handleConnectWallet}
            btnType="transparent"
            size={ButtonSize.LG}
          >
            <img
              src="/images/wallet.png"
              alt="MetaMask"
              className="connect-metamask-button-icon"
            />
            <h3>Connect with Metamask</h3>
          </Button>
          {errorMessage && (
            <div className="connect-wallet-error" role="alert">
              <img
                src="/icons/error.svg"
                alt="Error"
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

export default ConnectToMetamask
