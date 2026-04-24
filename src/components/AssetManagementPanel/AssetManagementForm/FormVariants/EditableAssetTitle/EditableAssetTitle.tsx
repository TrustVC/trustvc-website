import React, { FunctionComponent, useState, useEffect } from 'react'
import { useOverlayContext } from '../../../../common/contexts/OverlayContext'
import AddressBookOverlay from '../../../../common/AddressBookOverlay/AddressBookOverlay'
import { useTokenRegistryVersion } from '../../../../../hooks/useTokenRegistryVersion'
import { TokenRegistryVersions } from '../../../../../constants'
import { ExternalLinkEtherscanAddress } from '../../../../common/ExternalLink'
import { Input } from '../../../../common/Input'
import { TooltipIcon } from '../../../../common/SvgIcon'
import { ButtonIcon, ButtonSize } from '../../../../common/Button'
import { isEthereumAddress } from '../../../../../utils/helper'
import InfoIcon from '../../../../icons/info'
import Book from '@/components/icons/Book'
import { useAddressBook } from '../../../../../hooks/useAddressBook'

interface EditableAssetTitleProps {
  role: string
  value?: string
  isEditable: boolean
  newValue?: string
  onSetNewValue?: (newValue: string) => void
  isRemark?: boolean
  isSubmitted?: boolean
}

export const EditableAssetTitle: FunctionComponent<EditableAssetTitleProps> = ({
  role,
  value,
  newValue,
  isEditable,
  onSetNewValue,
  isRemark,
  isSubmitted,
}) => {
  const { showOverlay, closeOverlay } = useOverlayContext()
  const tokenRegistryVersion = useTokenRegistryVersion()
  const { resolveAddress } = useAddressBook()
  const [inputError, setInputError] = useState(false)
  const [resolved, setResolved] = useState<{
    name: string
    source: string
  } | null>(null)
  useEffect(() => {
    // Resolve for both editable (newValue) and non-editable (value) cases
    const addressToResolve = isEditable ? newValue : value
    if (!addressToResolve || !isEthereumAddress(addressToResolve)) {
      setResolved(null)
      return
    }
    let cancelled = false
    resolveAddress(addressToResolve)
      .then(r => !cancelled && setResolved(r))
      .catch(() => !cancelled && setResolved(null))
    return () => {
      cancelled = true
    }
  }, [newValue, value, isEditable, resolveAddress])

  const verifySetNewValue = (newAddressValue: string) => {
    // Update the value first
    onSetNewValue?.(newAddressValue)

    // Then verify if newValue is valid ethereum address
    if (!newAddressValue) {
      setInputError(false)
      return
    }
    if (!isEthereumAddress(newAddressValue)) {
      setInputError(true)
      return
    }
    setInputError(false)
  }

  const onOverlayHandler = () => {
    showOverlay(
      <AddressBookOverlay
        onAddressSelected={verifySetNewValue}
        onDismiss={closeOverlay}
      />
    )
  }

  if (isEditable && isRemark)
    return (
      <>
        <p className={`text-asset-title`}>{role ? `${role}:` : ''}</p>
        <div className="text-field-configurator">
          <div className="field-area">
            <textarea
              className="action-form-textarea"
              data-testid={`editable-input-${role.toLowerCase()}`}
              maxLength={120}
              value={newValue}
              placeholder={
                tokenRegistryVersion === TokenRegistryVersions.V5
                  ? `Enter remarks here (max 120 characters)`
                  : '-'
              }
              disabled={
                isSubmitted || tokenRegistryVersion !== TokenRegistryVersions.V5
              }
              style={{
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
              onChange={event => {
                if (!onSetNewValue) return
                onSetNewValue(event.target.value)
              }}
            />
          </div>
        </div>
        <div className="remarks-icon-text" data-testid="remarks-icon-text">
          <div className="w-auto">
            <TooltipIcon
              content={
                tokenRegistryVersion !== TokenRegistryVersions.V5
                  ? 'Unsupported on Token Registry V4'
                  : 'Any remarks provided will be accessible in the endorsement chain by any verifiers of this document.'
              }
            >
              <InfoIcon fontSize={16} />
            </TooltipIcon>
          </div>
          <p className="small remarks-text" style={{ textAlign: 'left' }}>
            {tokenRegistryVersion !== TokenRegistryVersions.V5
              ? 'Unsupported on Token Registry V4'
              : 'Any remarks provided will be accessible in the endorsement chain by any verifiers of this document.'}
          </p>
        </div>
      </>
    )
  if (!isEditable)
    return (
      <>
        <p className={`text-asset-title`}>{role ? `${role}:` : ''}</p>
        {resolved && (
          <>
            <span className="vr-title-col-name">{resolved.name}</span>
            <span className="vr-title-col-resolved">
              (Resolved by: {resolved.source})
            </span>
          </>
        )}
        <ExternalLinkEtherscanAddress
          name={value || ''}
          address={value || ''}
          data-testid={`non-editable-input-${role.toLowerCase()}`}
        >
          <span className="vr-title-col-addr">{value}</span>
        </ExternalLinkEtherscanAddress>
      </>
    )
  return (
    <>
      <p className={`text-asset-title`}>{role ? `${role}:` : ''}</p>
      <div className="input-frame">
        <div className={`input-layer ${inputError ? 'border-error' : ''}`}>
          <Input
            data-testid={`editable-input-${role.toLowerCase()}`}
            type="text"
            value={newValue}
            placeholder={`Input ${role}'s address`}
            onChange={event => verifySetNewValue(event.target.value)}
            hasError={inputError}
          />
        </div>

        <div className="">
          <ButtonIcon
            onClick={onOverlayHandler}
            className="w-[40px] dark-mode:!bg-[#1E2026]"
            size={ButtonSize.MD}
            btnType="transparent"
          >
            <Book fontSize={24} />
          </ButtonIcon>
        </div>
      </div>
      {resolved && (
        <div className="flex flex-col gap-1 mt-1">
          <span className="vr-title-col-name">{resolved.name}</span>
          <span className="vr-title-col-resolved">
            (Resolved by: {resolved.source})
          </span>
        </div>
      )}
      {inputError && (
        <div
          className="order-2 flex flex-row items-center gap-2"
          data-testid="error-msg"
        >
          <InfoIcon fontSize={13.5} fill="#B83152" />
          <p className="small bg-alert-50">Input must be a valid address.</p>
        </div>
      )}
    </>
  )
}
