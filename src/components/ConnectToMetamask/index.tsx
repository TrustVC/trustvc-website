import React from 'react'
import Connected from '../ConnectToBlockchain/Connected'
// import { showDocumentTransferMessage } from '../UI/Overlay/OverlayContent'
// import { NetworkContent } from '../NetworkSection/NetworkContent'
// Warning icon - use inline SVG or import from public folder
import PrimaryButton from '../common/PrimaryButton'
import {
  SIGNER_TYPE,
  useProviderContext,
} from '../common/contexts/providerContext'
import { showDocumentTransferMessage } from '../common/Overlay/OverlayContent'
import { useOverlayContext } from '../common/contexts/OverlayContext'
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

  const handleDisconnect = () => {
    disconnectWallet()
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
          <PrimaryButton
            data-testid="disconnect-metamask"
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
            // disabled={
            // !account || networkChangeLoading || currentChainId === undefined
            // }
          >
            Continue
          </PrimaryButton>
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
  const { showOverlay } = useOverlayContext()

  const handleConnectWallet = async () => {
    try {
      await upgradeToMetaMaskSigner()
    } catch (error: any) {
      console.error('Error in handleConnectWallet:', error)
      handleMetamaskError(error.message, error.code)
    }
  }
  const handleMetamaskError = (errorMesssage: string, errorCode: number) => {
    console.log('handleMetamaskError called:', errorMesssage, errorCode)
    const isUserDeniedAccountAuthorization = errorCode === 4001
    showOverlay(
      showDocumentTransferMessage(errorMesssage, {
        isSuccess: false,
        isButtonMetamaskInstall: !isUserDeniedAccountAuthorization,
      })
    ) // there is 2 type of errors that will be handled here, 1st = NO_METAMASK (error thrown from provider.tsx), 2nd = NO_USER_AUTHORIZATION (error from metamask extension itself).
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
        </>
      )}
    </div>
  )
}

export default ConnectToMetamask
