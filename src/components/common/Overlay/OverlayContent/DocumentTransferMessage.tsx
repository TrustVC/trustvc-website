import React, { FunctionComponent, ReactNode } from 'react'
import Overlay from '../Overlay'
import { MessageAddressResolver } from './MessageAddressResolver'
import { useOverlayContext } from '../../contexts/OverlayContext'
import LinkButton from '../../LinkButton'
import { Button, ButtonSize } from '../../Button'

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
  ENDORSE_TRANSFER_SUCCESS = 'Endorse Ownership/Holdership Success',
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

const ButtonMetamaskInstall: FunctionComponent = () => {
  return (
    <LinkButton
      className="bg-cerulean-500 rounded-xl text-white hover:text-white hover:bg-cerulean-800"
      href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en"
      target="_blank"
      rel="noreferrer noopener"
    >
      Install Metamask
    </LinkButton>
  )
}

const ButtonConfirmAction = (handleOnClick: () => void): ReactNode => {
  const { closeOverlay } = useOverlayContext()
  const onClick = (): void => {
    handleOnClick()
    closeOverlay()
  }
  return (
    <Button
      size={ButtonSize.MD}
      className="bg-cerulean-500 rounded-xl text-white hover:bg-cerulean-800"
      onClick={onClick}
      data-testid={'confirmActionBtn'}
    >
      Confirm
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
  footer?: React.ReactNode
}

export const DocumentTransferMessage: FunctionComponent<
  DocumentTransferMessageProps
> = ({
  title,
  isSuccess,
  isButtonMetamaskInstall,
  isConfirmationMessage,
  onConfirmationAction,
  children,
  footer,
}) => {
  const { closeOverlay } = useOverlayContext()

  const documentTransferButton = (): ReactNode => {
    // if (isButtonMetamaskInstall) {
    //   return <ButtonMetamaskInstall />
    // }
    // if (isConfirmationMessage && onConfirmationAction) {
    //   return (
    //     <div className="flex mx-0">
    //       <div className="col-auto ml-2">
    //         <ButtonClose />
    //       </div>
    //       <div className="col-auto ml-2">
    //         {ButtonConfirmAction(onConfirmationAction)}
    //       </div>
    //     </div>
    //   )
    // }
    return footer ? footer : <ButtonClose />
  }

  return (
    <Overlay onClose={closeOverlay}>
      <div className="max-w-lg bg-white rounded-2xl p-6 shadow-xl">
        {/* Header */}
        <div
          className="flex items-center gap-4 pt-6 pr-6 pb-4 pl-6"
          style={{ width: '640px', height: '72px' }}
        >
          {isSuccess ? (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>

        {/* Content */}
        <div
          className="flex-1 p-4 border-t border-b border-solid"
          style={{
            height: '184px',
            borderColor: 'var(--Neutral-33-90, rgba(169, 178, 187, 0.33))',
            borderWidth: '1px 0px 1px 0px',
          }}
        >
          {children}
        </div>
        {/* Footer Buttons */}
        <div
          className="flex gap-4 pt-4 pr-6 pb-6 pl-6"
          style={{ width: '640px', height: '80px' }}
        >
          <Button
            size={ButtonSize.MD}
            className="flex-1"
            width="170px"
            btnType="transparent"
            onClick={closeOverlay}
          >
            Dismiss
          </Button>
          <Button size={ButtonSize.MD} className="flex-1" width="170px">
            View Endorsement Chain
          </Button>
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
        <>
          <h6 className="mt-3">{beneficiaryTitle}</h6>
          {beneficiaryAddress && (
            <MessageAddressResolver address={beneficiaryAddress} />
          )}
        </>
      )}
      {holderAddress && (
        <>
          <h6 className="mt-3">{holderTitle}</h6>
          {holderAddress && <MessageAddressResolver address={holderAddress} />}
        </>
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
  footer?: React.ReactNode
): ReactNode => {
  return (
    <DocumentTransferMessage
      title={title}
      isSuccess={option.isSuccess}
      isButtonMetamaskInstall={option.isButtonMetamaskInstall}
      onConfirmationAction={option.onConfirmationAction}
      isConfirmationMessage={option.isConfirmationMessage}
      footer={footer}
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
      {title === MessageTitle.CHANGE_BENEFICIARY_SUCCESS && (
        <MessageBeneficiarySuccess address={option.beneficiaryAddress} />
      )}
      {title === MessageTitle.NOMINATE_BENEFICIARY_HOLDER_SUCCESS && (
        <MessageNominateBeneficiaryHolderSuccess />
      )}
      {title === MessageTitle.TRANSFER_HOLDER_SUCCESS && (
        <MessageHolderSuccess address={option.holderAddress} />
      )}
      {title === MessageTitle.ENDORSE_TRANSFER_SUCCESS && (
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
