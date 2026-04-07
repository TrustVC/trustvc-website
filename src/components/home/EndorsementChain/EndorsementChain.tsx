import React from 'react'
import Overlay from '../../common/Overlay'
import PrimaryButton from '../../common/PrimaryButton'
import { EndorsementChain } from '@trustvc/trustvc'
import { format } from 'date-fns'
import { EndorsementChainStatus } from './useEndorsementChain'
import Spinner from '../../common/Spinner'
import { TokenRegistryVersion } from '../VerifySection/useVerify'

interface EndorsementChainProps {
  endorsementChain?: any
  onReset: () => void
  isDarkMode?: boolean
  endorsementChainStatus?: EndorsementChainStatus
  tokenRegistryVersion?: TokenRegistryVersion
}
enum ActionType {
  INITIAL = 'Document has been issued',
  NEW_OWNERS = 'Transfer ownership and holdership',
  ENDORSE = 'Transfer ownership',
  TRANSFER = 'Transfer holdership',
  REJECT_TRANSFER_HOLDER = 'Rejection of holdership',
  REJECT_TRANSFER_BENEFICIARY = 'Rejection of ownership',
  RETURNED_TO_ISSUER = 'ETR returned to issuer',
  RETURN_TO_ISSUER_REJECTED = 'Return of ETR rejected',
  RETURN_TO_ISSUER_ACCEPTED = 'ETR taken out of circulation', // burnt token
  TRANSFER_TO_WALLET = 'Transferred to wallet',
}
interface HistoryChain {
  action: ActionType
  isNewBeneficiary: boolean
  isNewHolder: boolean
  beneficiary?: string
  holder?: string
  timestamp?: number
  hash?: string
  remark?: string
}

const getHistoryChain = (endorsementChain?: EndorsementChain) => {
  const historyChain: HistoryChain[] = []

  endorsementChain?.forEach(endorsementChainEvent => {
    const beneficiary = endorsementChainEvent.owner
    const holder = endorsementChainEvent.holder
    const timestamp = endorsementChainEvent.timestamp
    const hash = endorsementChainEvent.transactionHash
    const remark = endorsementChainEvent?.remark
    switch (endorsementChainEvent.type) {
      case 'TRANSFER_OWNERS':
        historyChain.push({
          action: ActionType.NEW_OWNERS,
          isNewBeneficiary: true,
          isNewHolder: true,
          beneficiary,
          holder,
          timestamp,
          hash,
          remark,
        })
        break
      case 'TRANSFER_BENEFICIARY':
        historyChain.push({
          action: ActionType.ENDORSE,
          isNewBeneficiary: true,
          isNewHolder: false,
          beneficiary,
          holder,
          timestamp,
          hash,
          remark,
        })
        break
      case 'TRANSFER_HOLDER':
        historyChain.push({
          action: ActionType.TRANSFER,
          isNewBeneficiary: false,
          isNewHolder: true,
          beneficiary,
          holder,
          timestamp,
          hash,
          remark,
        })
        break
      case 'RETURNED_TO_ISSUER':
      case 'SURRENDERED':
        historyChain.push({
          action: ActionType.RETURNED_TO_ISSUER,
          isNewBeneficiary: false,
          isNewHolder: false,
          timestamp,
          remark,
        })
        break
      case 'RETURN_TO_ISSUER_ACCEPTED':
      case 'SURRENDER_ACCEPTED':
        historyChain.push({
          action: ActionType.RETURN_TO_ISSUER_ACCEPTED,
          isNewBeneficiary: false,
          isNewHolder: false,
          timestamp,
          remark,
        })
        break
      case 'RETURN_TO_ISSUER_REJECTED':
      case 'SURRENDER_REJECTED':
        historyChain.push({
          action: ActionType.RETURN_TO_ISSUER_REJECTED,
          isNewBeneficiary: true,
          isNewHolder: true,
          timestamp,
          beneficiary,
          holder: beneficiary,
          hash,
          remark,
        })
        break
      case 'INITIAL':
        historyChain.push({
          action: ActionType.INITIAL,
          isNewBeneficiary: true,
          isNewHolder: true,
          beneficiary,
          holder,
          timestamp,
          hash,
          remark,
        })
        break
      case 'REJECT_TRANSFER_HOLDER':
        historyChain.push({
          action: ActionType.REJECT_TRANSFER_HOLDER,
          isNewBeneficiary: false,
          isNewHolder: true,
          beneficiary,
          holder,
          timestamp,
          hash,
          remark,
        })
        break
      case 'REJECT_TRANSFER_BENEFICIARY':
        historyChain.push({
          action: ActionType.REJECT_TRANSFER_BENEFICIARY,
          isNewBeneficiary: true,
          isNewHolder: false,
          beneficiary,
          holder,
          timestamp,
          hash,
          remark,
        })
        break
      case 'REJECT_TRANSFER_OWNERS':
        historyChain.push({
          action: ActionType.REJECT_TRANSFER_HOLDER,
          isNewBeneficiary: false,
          isNewHolder: true,
          beneficiary,
          holder,
          timestamp,
          hash,
          remark,
        })
        historyChain.push({
          action: ActionType.REJECT_TRANSFER_BENEFICIARY,
          isNewBeneficiary: true,
          isNewHolder: false,
          beneficiary,
          holder,
          timestamp,
          hash,
          remark,
        })
        break

      default:
        console.warn(
          `Unknown endorsement event type: ${endorsementChainEvent.type}`
        )
        break
    }
  })

  return historyChain
}

const CheckIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M25.6665 12.9271V14.0003C25.6649 16.5163 24.8504 18.9642 23.3441 20.9792C21.8377 22.9942 19.7203 24.4683 17.3077 25.1816C14.8951 25.8948 12.3166 25.8092 9.95665 24.9374C7.59669 24.0656 5.58587 22.4541 4.21256 20.3436C2.83925 18.233 2.17287 15.7365 2.31839 13.2261C2.46392 10.7156 3.41452 8.32601 5.03109 6.41356C6.64767 4.50111 8.84869 3.16825 11.4287 2.61381C14.0086 2.05937 16.8502 2.31303 18.8481 3.33697"
      stroke="#3AAF86"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M25.6667 4.66602L14 16.3447L10.5 12.8447"
      stroke="#3AAF86"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
  </svg>
)

const LineDesign: React.FunctionComponent<{
  first?: boolean
  last?: boolean
}> = ({ first, last }) => {
  return (
    <div className="line-design-container">
      <div className={`line-design-path short ${first ? 'first' : ''}`} />
      <div className="line-design-dot">
        <div className="dot" />
      </div>
      <div className={`line-design-path ${last ? 'last' : ''}`} />
    </div>
  )
}
const EndorsementChainLayout: React.FC<EndorsementChainProps> = ({
  endorsementChain,
  onReset,
  isDarkMode,
  endorsementChainStatus,
  tokenRegistryVersion,
}) => {
  const historyChain = getHistoryChain(endorsementChain)
  const { status, errorMessage } = endorsementChainStatus ?? {}

  return (
    <Overlay>
      <div
        className={`endorsement-chain ${isDarkMode ? 'dark-mode' : ''} ${status === 'loading' ? 'is-loading' : ''}`}
      >
        {/* First Component - Header Section */}
        <div className="header-section">
          <div className="ec-header-content">
            <CheckIcon />
            <h2 className="ec-header-title">Endorsement Chain</h2>
          </div>
        </div>

        {/* Second Component - Main Content Section */}
        <div className="content-section">
          <div className="section-frame">
            {status === 'loading' && (
              <Spinner
                size="large"
                centered
                label="Loading Endorsement Chain..."
                className="ec-spinner"
              />
            )}
            {status === 'error' && (
              <div className="ec-error-message">
                <div>Failed to load endorsement chain</div>
                {errorMessage && (
                  <div className="ec-error-message">{errorMessage}</div>
                )}
              </div>
            )}
            {status === 'success' &&
              historyChain?.map((data: any, key: number) => (
                <div className="entity" key={key}>
                  <LineDesign
                    first={key === 0}
                    last={key === historyChain.length - 1}
                  />
                  <div className="entity-content-frame">
                    <div className="content">
                      <div className="entry-header">
                        <div className="action-header-frame">
                          <h4 className="text-header1">{data.action}</h4>
                        </div>
                        <div className="date-frame">
                          {format(
                            new Date(data.timestamp ?? 0),
                            'do MMM yyyy, hh:mm aa'
                          )}
                        </div>
                      </div>
                      <div className="entity-content-body">
                        <div className="column">
                          <div className="subheader">Owner</div>
                          <div className="wallet-address">
                            {data.isNewBeneficiary ? data.beneficiary : '_'}
                          </div>
                          <div className="organization">Organisation A</div>
                        </div>
                        <div className="column">
                          <div className="subheader">Holder</div>
                          <div className="wallet-address">
                            {data.isNewHolder ? data.holder : '_'}
                          </div>
                          <div className="organization">Organisation B</div>
                        </div>
                        <div className="column column-2-items">
                          <div className="subheader">
                            Remarks
                            {tokenRegistryVersion === 'V4'
                              ? ' (Unavailable on TR V4)'
                              : ''}
                          </div>
                          <div className="remarks">{data?.remark ?? '-'}</div>
                        </div>
                      </div>
                    </div>
                    {key !== historyChain.length - 1 && (
                      <div className="divider"></div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Third Component - Footer Section */}
        <div className="footer-section">
          <div className="footer-subsection">
            <PrimaryButton className="dismiss-btn" onClick={onReset}>
              Dismiss
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Overlay>
  )
}

export default EndorsementChainLayout
