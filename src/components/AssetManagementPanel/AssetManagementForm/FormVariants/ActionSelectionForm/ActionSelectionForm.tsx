import React, { FunctionComponent, useEffect, useState } from 'react'
import { useAddressBook } from '../../../../../hooks/useAddressBook'
import { useIsObligation } from '../../../../../hooks/useIsObligation'
import { useOverlayContext } from '../../../../common/contexts/OverlayContext'
import {
  MessageTitle,
  showDocumentTransferMessage,
} from '../../../../common/Overlay/OverlayContent'
import { AssetManagementActions } from '../../../AssetManagementActions'
import { AssetManagementDropdown } from '../../AssetManagementDropdown'
import ConnectToBlockchainModel from '../../../../ConnectToBlockchain'
import { Button, ButtonSize } from '../../../../common/Button'
import { Tag, TagBordered } from '../../../../common/Tag'
import { OBLIGATION_STATUS_LABEL } from '../../../../../constants'
import { CheckCircle } from '../../../../../../src/components/common/Icons'
import {
  getPaymasterAddress,
  PAYMASTER_CHANGE_EVENT,
} from '../../../../../gasless/paymasterStorage'

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
  canAcceptObligation?: boolean
  canRejectObligation?: boolean
  canDischargeObligation?: boolean
  obligationStatus?: number
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
  canAcceptObligation,
  canRejectObligation,
  canDischargeObligation,
  obligationStatus,
  setShowEndorsementChain,
}) => {
  const isObligation = useIsObligation()
  const { resolveAddress } = useAddressBook()
  const [beneficiaryResolved, setBeneficiaryResolved] = useState<{
    name: string
    source: string
  } | null>(null)
  const [holderResolved, setHolderResolved] = useState<{
    name: string
    source: string
  } | null>(null)

  useEffect(() => {
    let isCurrent = true
    if (beneficiary) {
      resolveAddress(beneficiary)
        .then(result => {
          if (isCurrent) setBeneficiaryResolved(result)
        })
        .catch(() => {
          if (isCurrent) setBeneficiaryResolved(null)
        })
    } else {
      setBeneficiaryResolved(null)
    }
    return () => {
      isCurrent = false
    }
  }, [beneficiary, resolveAddress])

  useEffect(() => {
    let isCurrent = true
    if (holder) {
      resolveAddress(holder)
        .then(result => {
          if (isCurrent) setHolderResolved(result)
        })
        .catch(() => {
          if (isCurrent) setHolderResolved(null)
        })
    } else {
      setHolderResolved(null)
    }
    return () => {
      isCurrent = false
    }
  }, [holder, resolveAddress])

  const [savedPaymaster, setSavedPaymaster] = useState(() =>
    getPaymasterAddress(account)
  )
  useEffect(() => {
    const update = () => setSavedPaymaster(getPaymasterAddress(account))
    update()
    window.addEventListener(PAYMASTER_CHANGE_EVENT, update)
    return () => {
      window.removeEventListener(PAYMASTER_CHANGE_EVENT, update)
    }
  }, [account])

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
    canRejectOwnerTransfer ||
    !!canAcceptObligation ||
    !!canRejectObligation ||
    !!canDischargeObligation

  const documentLabel = isObligation ? 'BoE' : 'ETR'
  const obligationStatusLabel =
    obligationStatus != null
      ? OBLIGATION_STATUS_LABEL[obligationStatus]
      : undefined

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

  return (
    <>
      {!isReturnedToIssuer && !isTokenBurnt && isTitleEscrow && (
        <div className="vr-title-info">
          <div className="vr-title-col">
            <span className="vr-title-col-label">Owner:</span>
            {beneficiaryResolved && (
              <>
                <span className="vr-title-col-name">
                  {beneficiaryResolved.name}
                </span>
                <span className="vr-title-col-resolved">
                  (Resolved by: {beneficiaryResolved.source})
                </span>
              </>
            )}
            <span className="vr-title-col-addr">{beneficiary ?? ''}</span>
          </div>
          <div className="vr-title-col">
            <span className="vr-title-col-label">Holder:</span>
            {holderResolved && (
              <>
                <span className="vr-title-col-name">{holderResolved.name}</span>
                <span className="vr-title-col-resolved">
                  (Resolved by: {holderResolved.source})
                </span>
              </>
            )}
            <span className="vr-title-col-addr">{holder ?? ''}</span>
          </div>
          <div className="vr-title-col" data-testid="asset-title-status">
            {isObligation && obligationStatusLabel && (
              <>
                <span className="vr-title-col-label">Status:</span>
                <TagBordered
                  id="obligation-status-sign"
                  rounded="rounded-full"
                  className="inline-flex items-center w-fit border-secondary-100 bg-secondary-100 text-secondary-60 px-4 py-2"
                >
                  <span
                    data-testid="obligationStatus"
                    className="font-urbanist font-bold text-base leading-normal"
                  >
                    {obligationStatusLabel}
                  </span>
                </TagBordered>
              </>
            )}
          </div>
        </div>
      )}
      <div className="vr-footer">
        <div className="tag-frame flex-1 gap-2">
          {(isReturnedToIssuer || isTokenBurnt) && (
            <Tag
              rounded="rounded-full"
              className="flex flex-row justify-center items-center p-2 gap-[10px] min-w-[188px] max-w-[383px] bg-[#FDDAE2] rounded-full flex-1 text-center"
            >
              <h4 className="bg-alert-20">
                {isReturnedToIssuer
                  ? `${documentLabel} Returned to Issuer`
                  : `${documentLabel} Taken Out of Circulation`}
              </h4>
            </Tag>
          )}
          <div className="vr-footer-dropdown-placeholder" />
        </div>
        {!isTokenBurnt && (
          <div className="dropdown-btn-frame flex-1">
            {!!account && !!savedPaymaster && (
              <div className="pay-on-behalf-note">
                <div className="pay-on-behalf-note-frame">
                  <CheckCircle />
                  <span className="pay-on-behalf-note-text">
                    Pay-on-behalf is enabled for all transactions.
                  </span>
                </div>
              </div>
            )}
            <div className="vr-footer-dropdown-placeholder flex-1" />
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
                    canAcceptObligation={canAcceptObligation}
                    canRejectObligation={canRejectObligation}
                    canDischargeObligation={canDischargeObligation}
                    documentLabel={documentLabel}
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
