import React, { useState } from 'react'
import {
  SIGNER_TYPE,
  useProviderContext,
} from '../common/contexts/providerContext'
import Overlay from '../common/Overlay'
import PrimaryButton from '../common/PrimaryButton'
// import { ConnectToMagicLinkModelComponent } from '../ConnectToMagicLink'
import { ConnectToMetamaskModelComponent } from '../ConnectToMetamask'

const WALLET_TYPE_NAME: Partial<Record<SIGNER_TYPE, string>> = {
  [SIGNER_TYPE.METAMASK]: 'Metamask',
  [SIGNER_TYPE.MAGIC]: 'MagicLink',
}

interface ConnectToBlockchainProps {
  onClose: () => void
  nextStep?: React.ReactNode
  showNetworkSection?: boolean
}

interface ConnectToBlockchainHeaderProps {
  selectedWalletType: SIGNER_TYPE
  setSelectedWalletType: (wallet: SIGNER_TYPE) => void
}

interface ConnectToBlockchainHeaderItemProps {
  itemKey: string
  walletType: SIGNER_TYPE
  walletIcon: React.ReactNode
  isSelected: boolean
  isConnected: boolean
  onClick: () => void
}

const ConnectToBlockchainHeaderItem = ({
  itemKey,
  walletType,
  walletIcon,
  isSelected,
  isConnected,
  onClick,
  ...props
}: ConnectToBlockchainHeaderItemProps) => {
  return (
    <div
      id={`tab-${itemKey}`}
      onClick={onClick}
      {...props}
      className={`tab ${isSelected ? 'border-b-white' : ''}`}
    >
      {walletIcon}
      {isConnected ? (
        <>
          <div className="text-left">
            <h4>{WALLET_TYPE_NAME[walletType]}</h4>
            <p className="small">Connected</p>
          </div>
          <div className="active-dot" />
        </>
      ) : (
        <h4>{WALLET_TYPE_NAME[walletType]}</h4>
      )}
    </div>
  )
}

const ConnectToBlockchainHeader = ({
  selectedWalletType,
  setSelectedWalletType,
}: ConnectToBlockchainHeaderProps) => {
  const { providerType, account } = useProviderContext()
  const WalletConnectMethods = [
    {
      walletType: SIGNER_TYPE.METAMASK,
      'data-testid': 'connect-metamask-header',
      walletIcon: (
        <img src="/images/wallet.png" alt="Metamask" className="w-6 h-6" />
      ),
      isSelected: !!(selectedWalletType === SIGNER_TYPE.METAMASK),
      isConnected: !!(providerType === SIGNER_TYPE.METAMASK && account),
      onClick: () => setSelectedWalletType(SIGNER_TYPE.METAMASK),
    },
    {
      walletType: SIGNER_TYPE.MAGIC,
      'data-testid': 'connect-magic-header',
      walletIcon: (
        <img src="/images/magic_link.svg" alt="MagicLink" className="w-6 h-6" />
      ),
      isSelected: !!(selectedWalletType === SIGNER_TYPE.MAGIC),
      isConnected: !!(providerType === SIGNER_TYPE.MAGIC && account),
      onClick: () => setSelectedWalletType(SIGNER_TYPE.MAGIC),
    },
  ]

  return (
    <div className="header">
      {WalletConnectMethods.map(wallet => (
        <ConnectToBlockchainHeaderItem
          key={wallet.walletType}
          itemKey={wallet.walletType}
          walletType={wallet.walletType}
          walletIcon={wallet.walletIcon}
          isSelected={wallet.isSelected}
          isConnected={wallet.isConnected}
          onClick={wallet.onClick}
          data-testid={wallet['data-testid']}
        />
      ))}
    </div>
  )
}

const ConnectToBlockchainModel: React.FC<ConnectToBlockchainProps> = ({
  onClose,
  nextStep,
  showNetworkSection,
}) => {
  const { providerType, account } = useProviderContext()
  const [selectedWalletType, setSelectedWalletType] = useState<SIGNER_TYPE>(
    [SIGNER_TYPE.MAGIC, SIGNER_TYPE.METAMASK].includes(providerType)
      ? providerType
      : SIGNER_TYPE.METAMASK
  )

  const handleContinue = () => {
    console.log('handleContinue clicked!', nextStep)
    if (!nextStep) {
      onClose()
      return
    }
    // switch to network section modal if showNetworkSection is true
  }

  return (
    <Overlay onClose={onClose}>
      <div className="connect-blockchain-modal">
        {/* Header Section */}
        <div className="header-section">
          <h2>
            {account ? 'Active Wallet Address' : 'Connect to Blockchain Wallet'}
          </h2>
        </div>
        <div className="content-section">
          <div id="connect-blockchain">
            <p style={{ textAlign: 'left' }}>Login via:</p>
            <div className="subsection">
              <ConnectToBlockchainHeader
                selectedWalletType={selectedWalletType}
                setSelectedWalletType={setSelectedWalletType}
              />

              <div className="body">
                {selectedWalletType === SIGNER_TYPE.METAMASK && (
                  <ConnectToMetamaskModelComponent
                    showOnNewConnectWarningMessage
                    nextStep={nextStep}
                    showNetworkSection={showNetworkSection}
                    handleContinue={handleContinue}
                  />
                )}
                {/* {selectedWalletType === SIGNER_TYPE.MAGIC && (
              <ConnectToMagicLinkModelComponent
                showOnNewConnectWarningMessage
                nextStep={nextStep}
                showNetworkSection={showNetworkSection}
              />
            )} */}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="footer-section">
          <div className="footer-subsection">
            <PrimaryButton
              data-testid="connect-blockchain-cancel"
              className="connect-blockchain-cancel-btn"
              onClick={onClose}
              btnType="transparent"
              labelClassName="connect-blockchain-cancel-btn-label"
            >
              Cancel
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Overlay>
  )
}

export default ConnectToBlockchainModel
