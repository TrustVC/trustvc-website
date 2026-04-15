import React, { FunctionComponent } from 'react'
import { useOverlayContext } from '../../../../common/contexts/OverlayContext'
import {
  MessageTitle,
  showDocumentTransferMessage,
} from '../../../../common/Overlay/OverlayContent'
import { AssetManagementActions } from '../../../AssetManagementActions'
import { AssetManagementDropdown } from '../../AssetManagementDropdown'
import ConnectToBlockchainModel from '../../../../ConnectToBlockchain'
import { Button, ButtonSize } from '../../../../common/Button'

interface ActionSelectionFormProps {
  beneficiary?: string
  holder?: string
  nominee?: string

  onSetFormAction: (nextFormAction: AssetManagementActions) => void
  tokenRegistryAddress: string
  account?: string
  isReturnedToIssuer: boolean
  setShowEndorsementChain: (payload: boolean) => void
  isTitleEscrow: boolean
  isRejectPendingConfirmation?: boolean
  isTokenBurnt: boolean
  isExpired?: boolean

  canReturnToIssuer: boolean
  canHandleShred?: boolean
  canHandleRestore?: boolean
  canTransferHolder: boolean
  canTransferBeneficiary: boolean
  canNominateBeneficiary: boolean
  canEndorseBeneficiary: boolean
  canTransferOwners: boolean
  canRejectOwnerHolderTransfer: boolean
  canRejectHolderTransfer: boolean
  canRejectOwnerTransfer: boolean
}

export const ActionSelectionForm: FunctionComponent<
  ActionSelectionFormProps
> = ({
  onSetFormAction,
  beneficiary,
  holder,
  account,
  isReturnedToIssuer,
  isTokenBurnt,
  isTitleEscrow,
  isRejectPendingConfirmation,
  isExpired,
  canTransferHolder,
  canTransferBeneficiary,
  canTransferOwners,
  canNominateBeneficiary,
  canEndorseBeneficiary,
  canReturnToIssuer,
  canHandleShred,
  canHandleRestore,
  canRejectOwnerHolderTransfer,
  canRejectHolderTransfer,
  canRejectOwnerTransfer,
  setShowEndorsementChain,
}) => {
  const canManage =
    canTransferHolder ||
    canTransferBeneficiary ||
    canTransferOwners ||
    canNominateBeneficiary ||
    canEndorseBeneficiary ||
    canReturnToIssuer ||
    canHandleShred ||
    canHandleRestore ||
    canRejectOwnerHolderTransfer ||
    canRejectHolderTransfer ||
    canRejectOwnerTransfer

  const { showOverlay, closeOverlay } = useOverlayContext()
  const handleNoAccess = () => {
    showOverlay(
      showDocumentTransferMessage(
        MessageTitle.NO_MANAGE_ACCESS,
        {
          isSuccess: false,
        },
        setShowEndorsementChain
      )
    )
  }

  const handleConnectWallet = async () => {
    showOverlay(<ConnectToBlockchainModel onClose={closeOverlay} />)
  }
  console.log(isTokenBurnt, account, canManage)

  return (
    <>
      {!isReturnedToIssuer && !isTokenBurnt && isTitleEscrow && (
        <div className="vr-title-info">
          <div className="vr-title-col">
            <span className="vr-title-col-label">Owner:</span>
            <span className="vr-title-col-name">{'Organisation A'}</span>
            <span className="vr-title-col-addr">
              {beneficiary ?? '0x28F7aB32C521D13F2E6980d072Ca7CA493020145'}
            </span>
          </div>
          <div className="vr-title-col">
            <span className="vr-title-col-label">Holder:</span>
            <span className="vr-title-col-name">{'Organisation A'}</span>
            <span className="vr-title-col-addr">
              {holder ?? '0x28F7aB32C521D13F2E6980d072Ca7CA493020145'}
            </span>
          </div>
          <div className="vr-title-col" />
        </div>
      )}
      <div className="vr-footer">
        {!isTokenBurnt && (
          <div className="dropdown-btn-frame ">
            <div className="vr-footer-dropdown-placeholder" />
            {account ? (
              <>
                {canManage ? (
                  <AssetManagementDropdown
                    onSetFormAction={onSetFormAction}
                    canTransferHolder={canTransferHolder}
                    canTransferBeneficiary={canTransferBeneficiary}
                    canNominateBeneficiary={canNominateBeneficiary}
                    canEndorseBeneficiary={canEndorseBeneficiary}
                    canTransferOwners={canTransferOwners}
                    canReturnToIssuer={canReturnToIssuer}
                    canHandleRestore={canHandleRestore}
                    canHandleShred={canHandleShred}
                    canRejectOwnerHolderTransfer={canRejectOwnerHolderTransfer}
                    canRejectHolderTransfer={canRejectHolderTransfer}
                    canRejectOwnerTransfer={canRejectOwnerTransfer}
                    isRejectPendingConfirmation={isRejectPendingConfirmation}
                  />
                ) : (
                  <Button
                    className="dropdown-single-btn"
                    onClick={handleNoAccess}
                    size={ButtonSize.MD}
                  >
                    No Access
                  </Button>
                )}
              </>
            ) : (
              <Button
                className="dropdown-single-btn"
                data-testid={'connectToWallet'}
                onClick={handleConnectWallet}
                size={ButtonSize.MD}
              >
                Connect Wallet
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
