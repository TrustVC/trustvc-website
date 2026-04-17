/* eslint-disable react-refresh/only-export-components */
import React, { FunctionComponent, ReactNode } from 'react'
import Overlay from '../Overlay'
import { MessageAddressResolver } from './MessageAddressResolver'
import { useOverlayContext } from '../../contexts/OverlayContext'
import { Button, ButtonSize } from '../../Button'
import SuccessIcon from '@/components/icons/Success'
import ErrorIcon from '@/components/icons/Error'

export enum MessageTitle {
  NO_METAMASK = 'Metamask not installed',
  NO_MANAGE_ACCESS = 'No manage assets access',
  NO_USER_AUTHORIZATION = 'User denied account authorization', // this error message must match error message from metamask extension itself
  TRANSACTION_ERROR = 'Error - Failed transaction',
  SURRENDER_DOCUMENT_SUCCESS = 'Return of ETR successful',
  ACCEPT_SURRENDER_DOCUMENT = 'Return of ETR accepted',
  REJECT_SURRENDER_DOCUMENT = 'Return of this ETR has been rejected by the Issuer',
  CONFIRM_REJECT_SURRENDER_DOCUMENT = 'Confirm Document Return',
  CHANGE_BENEFICIARY_SUCCESS = 'Change Owner Success',
  NOMINATE_BENEFICIARY_HOLDER_SUCCESS = 'Nomination Success',
  TRANSFER_HOLDER_SUCCESS = 'Transfer Holder Success',
  TRANSFER_OWNER_HOLDER_SUCCESS = 'Transfer Ownership/Holdership Success',
  TRANSFER_OWNER_SUCCESS = 'Transfer Owner Success',
}

interface ButtonCloseProps {
  className?: string
}

export const ButtonClose: FunctionComponent<ButtonCloseProps> = ({
  className,
}) => {
  const { closeOverlay } = useOverlayContext()

  return (
    <Button
      size={ButtonSize.MD}
      className={`bg-cerulean-500 rounded-xl text-white px-3 py-2 hover:bg-cerulean-800 ${className}`}
      onClick={closeOverlay}
    >
      Dismiss
    </Button>
  )
}

interface DocumentTransferMessageProps {
  title: string
  isSuccess: boolean
  children: React.ReactNode
  isButtonMetamaskInstall?: boolean
  isConfirmationMessage?: boolean
  onConfirmationAction?: () => void
  setShowEndorsementChain: (payload: boolean) => void
}

export const DocumentTransferMessage: FunctionComponent<
  DocumentTransferMessageProps
> = ({ title, isSuccess, setShowEndorsementChain, children }) => {
  const { closeOverlay } = useOverlayContext()
  const handleViewEndorsementChain = () => {
    setShowEndorsementChain(true)
    closeOverlay()
  }

  return (
    <Overlay
      onClose={closeOverlay}
      className="flex justify-center items-center"
    >
      <div className="flex flex-col items-start p-0  min-w-[308px] max-w-[640px] w-full min-h-[336px] bg-white/66 border border-[rgba(169,178,187,0.33)] shadow-[0px_8px_32px_RGBA(104,106,210,0.33)] rounded-2xl">
        {/* Header */}
        <div className="flex flex-row items-start pt-6 px-6 pb-4 gap-4  min-h-[72px] flex-none order-0 self-stretch grow-0">
          {isSuccess ? <SuccessIcon /> : <ErrorIcon />}
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>

        {/* Content */}
        <div className="box-border flex flex-col items-start p-4  min-h-[184px] border-t border-b border-solid border-[rgba(169,178,187,0.33)] flex-none self-stretch grow-0">
          <div className="flex flex-col items-start p-4 px-6 gap-4 min-h-[152px]">
            {children}
          </div>
        </div>
        {/* Footer Buttons */}
        <div className="flex flex-row justify-end items-center pt-4 px-6 pb-6 gap-4 max-w-[640px] min-h-[80px] w-full">
          <div className="flex flex-col sm:flex-row justify-center items-center p-0 gap-2 w-full max-w-[592px] min-h-[40px]">
            <Button
              size={ButtonSize.MD}
              className="w-full h-[40px] min-w-[160px] max-w-[260px] gap-[10px] flex-1"
              btnType="transparent"
              onClick={closeOverlay}
            >
              Dismiss
            </Button>
            <Button
              size={ButtonSize.MD}
              className="w-full h-[40px] min-w-[160px] max-w-[260px] gap-[10px] flex-1"
              onClick={() => handleViewEndorsementChain()}
            >
              View Endorsement Chain
            </Button>
          </div>
        </div>
      </div>
    </Overlay>
  )
}

interface MessageProps {
  address?: string
  error?: string
  beneficiaryTitle?: string
  beneficiaryAddress?: string
  holderTitle?: string
  holderAddress?: string
}

export const MessageNoMetamask: FunctionComponent = () => {
  return (
    <>
      <p className="mt-3">
        Oops! It seems like you have not installed the Metamask extension.
      </p>
      <p className="mt-3">You would need to install it before proceeding.</p>
    </>
  )
}

export const MessageNoManageAccess: FunctionComponent = () => {
  return (
    <p className="mt-3">
      Oops! It seems like you do not have access to manage assets.
    </p>
  )
}

export const MessageNoUserAuthorization: FunctionComponent = () => {
  return (
    <>
      <p className="mt-3">
        Oops! It seems like you did not authorize to use Metamask extension.
      </p>
    </>
  )
}

export const MessageTransactionError: FunctionComponent<MessageProps> = ({
  error,
}) => {
  return (
    <>
      <p className="mt-3">
        Oops! It seems like there&apos;s a failed transaction.
      </p>
      <p className="mt-3">{error}</p>
      <p className="mt-3">Please try again.</p>
    </>
  )
}

export const MessageSurrenderSuccess: FunctionComponent = () => {
  return (
    <p className="mt-3">
      This ETR has been returned, pending acceptance by the Issuer.
    </p>
  )
}

export const AcceptSurrender: FunctionComponent = () => {
  return (
    <p className="mt-3">
      This ETR has been taken out of circulation by the Issuer.
    </p>
  )
}

export const RejectSurrender: FunctionComponent = () => {
  return (
    <p className="mt-3">Return for this ETR has been rejected by the Issuer.</p>
  )
}

export const MessageRejectSurrenderConfirmation: FunctionComponent<
  MessageProps
> = ({ beneficiaryAddress, holderAddress }) => {
  return (
    <MessageTransferSuccess
      beneficiaryTitle="Restore document to Owner:"
      beneficiaryAddress={beneficiaryAddress}
      holderTitle="and to Holder:"
      holderAddress={holderAddress}
    />
  )
}

export const MessageBeneficiarySuccess: FunctionComponent<MessageProps> = ({
  address,
}) => {
  return <MessageTransferSuccess beneficiaryAddress={address} />
}

export const MessageHolderSuccess: FunctionComponent<MessageProps> = ({
  address,
}) => {
  return <MessageTransferSuccess holderAddress={address} />
}

export const MessageNominateBeneficiaryHolderSuccess: FunctionComponent =
  () => {
    return (
      <p className="mt-3">
        Document has been nominated successfully. Please notify holder to
        execute transfer.
      </p>
    )
  }

export const MessageEndorseTransferSuccess: FunctionComponent<MessageProps> = ({
  beneficiaryAddress,
  holderAddress,
}) => {
  return (
    <MessageTransferSuccess
      beneficiaryAddress={beneficiaryAddress}
      holderAddress={holderAddress}
    />
  )
}

export const MessageTransferSuccess: FunctionComponent<MessageProps> = ({
  beneficiaryTitle = 'Current Owner',
  beneficiaryAddress,
  holderTitle = 'Current Holder',
  holderAddress,
}) => {
  return (
    <>
      {beneficiaryAddress && (
        <div className="flex flex-col justify-center items-start p-0 gap-1 min-w-[129px] min-h-[52px] flex-none order-0 grow-0">
          <h4 className="mt-3">{beneficiaryTitle}</h4>
          {beneficiaryAddress && (
            <MessageAddressResolver address={beneficiaryAddress} />
          )}
        </div>
      )}
      {holderAddress && (
        <div className="flex flex-col justify-center items-start p-0 gap-1 min-w-[129px] min-h-[52px] flex-none order-0 grow-0">
          <h4 className="mt-3">{holderTitle}</h4>
          {holderAddress && <MessageAddressResolver address={holderAddress} />}
        </div>
      )}
    </>
  )
}

interface ShowDocumentTransferMessageOptionProps {
  isSuccess: boolean
  error?: string
  beneficiaryTitle?: string
  beneficiaryAddress?: string
  holderTitle?: string
  holderAddress?: string
  isButtonMetamaskInstall?: boolean
  onConfirmationAction?: () => void
  isConfirmationMessage?: boolean
}

export const showDocumentTransferMessage = (
  title: string,
  option: ShowDocumentTransferMessageOptionProps,
  setShowEndorsementChain: (payload: boolean) => void
): ReactNode => {
  return (
    <DocumentTransferMessage
      title={title}
      isSuccess={option.isSuccess}
      isButtonMetamaskInstall={option.isButtonMetamaskInstall}
      onConfirmationAction={option.onConfirmationAction}
      isConfirmationMessage={option.isConfirmationMessage}
      setShowEndorsementChain={setShowEndorsementChain}
    >
      {title === MessageTitle.NO_METAMASK && <MessageNoMetamask />}
      {title === MessageTitle.NO_MANAGE_ACCESS && <MessageNoManageAccess />}
      {title === MessageTitle.NO_USER_AUTHORIZATION && (
        <MessageNoUserAuthorization />
      )}
      {title === MessageTitle.TRANSACTION_ERROR && (
        <MessageTransactionError error={option.error} />
      )}
      {title === MessageTitle.SURRENDER_DOCUMENT_SUCCESS && (
        <MessageSurrenderSuccess />
      )}
      {title === MessageTitle.ACCEPT_SURRENDER_DOCUMENT && <AcceptSurrender />}
      {title === MessageTitle.REJECT_SURRENDER_DOCUMENT && <RejectSurrender />}
      {title === MessageTitle.CONFIRM_REJECT_SURRENDER_DOCUMENT && (
        <MessageRejectSurrenderConfirmation
          beneficiaryAddress={option.beneficiaryAddress}
          holderAddress={option.holderAddress}
        />
      )}
      {title === MessageTitle.CHANGE_BENEFICIARY_SUCCESS ||
        (title === MessageTitle.TRANSFER_OWNER_SUCCESS && (
          <MessageBeneficiarySuccess address={option.beneficiaryAddress} />
        ))}
      {title === MessageTitle.NOMINATE_BENEFICIARY_HOLDER_SUCCESS && (
        <MessageNominateBeneficiaryHolderSuccess />
      )}
      {title === MessageTitle.TRANSFER_HOLDER_SUCCESS && (
        <MessageHolderSuccess address={option.holderAddress} />
      )}
      {title === MessageTitle.TRANSFER_OWNER_HOLDER_SUCCESS && (
        <MessageEndorseTransferSuccess
          beneficiaryAddress={option.beneficiaryAddress}
          holderAddress={option.holderAddress}
        />
      )}
      {!(Object.values(MessageTitle) as string[]).includes(title) &&
        title?.length > 0 && <MessageTransferSuccess {...option} />}
    </DocumentTransferMessage>
  )
}
