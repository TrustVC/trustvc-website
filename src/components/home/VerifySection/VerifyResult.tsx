import React, { useCallback, useEffect, useState } from 'react'
import NetworkTooltip from './NetworkTooltip'
import DocumentRenderer from './DocumentRenderer'
import InvalidAttachmentsBanner from './InvalidAttachmentsBanner'
import ObfuscatedMessage from './ObfuscatedMessage'
import { makeExplorerAddressURL } from './useVerify'
import { CheckCircle, CrossCircle, InfoMsgIcon } from '../../common/Icons'
import { DocumentAttachment } from '../../../utils/helper'
import { getMagicLinkIconSrc } from '../../../utils/magicWallet'
import Connected from '../../ConnectToBlockchain/Connected'
import {
  SIGNER_TYPE,
  useProviderContext,
} from '../../common/contexts/providerContext'
import { AssetManagementApplication } from '../../AssetManagementPanel/AssetManagementApplication'
import { TextButton } from '../../common/Button/Button'
import { checkPaymasterWhitelist } from '../../../gasless/checkPaymasterWhitelist'
import { checkEIP7702Delegation } from '../../../gasless/checkDelegation'
import {
  getPaymasterAddress,
  setPaymasterAddress as savePaymasterAddress,
  removePaymasterAddress as clearPaymasterAddress,
} from '../../../gasless/paymasterStorage'
import { getRpcUrl } from '../../../utils/helper'
import { isAddress, createPublicClient, http } from 'viem'
import InfoIcon from '../../../../src/components/icons/info'
import { toChainId } from '../../../utils/chain-utils'

interface VerifyResultProps {
  fileName: string
  networkName?: string
  chainId?: string
  tokenId?: string
  issuer?: string
  isTransferable?: boolean
  /** BoE / obligation record, distinct from classic ETR (isTransferable). */
  isObligation?: boolean
  isExpired?: boolean
  tokenRegistryAddress?: string
  tags?: string[]
  owner?: { name?: string; address?: string }
  holder?: { name?: string; address?: string }
  rawDocument?: unknown
  invalidAttachments?: DocumentAttachment[]
  getGroupStatus: (_type: string) => 'VALID' | 'INVALID'
  onReset: () => void
  onViewNftRegistry?: () => void
  onViewEndorsementChain?: () => void
  refreshEndorsementChain?: () => void
  onConnectWallet?: () => void
}

const VERIFICATION_CHECKS = [
  { type: 'DOCUMENT_STATUS', label: 'Document has been issued' },
  { type: 'ISSUER_IDENTITY', label: "Document's issuer has been identified" },
  { type: 'DOCUMENT_INTEGRITY', label: 'Document has not been tampered with' },
]

const VerifyResult: React.FC<VerifyResultProps> = ({
  fileName,
  networkName,
  chainId,
  tokenId,
  issuer,
  isTransferable,
  isObligation,
  tokenRegistryAddress,
  tags,
  rawDocument,
  invalidAttachments,
  getGroupStatus,
  onReset,
  onViewNftRegistry,
  onViewEndorsementChain,
  refreshEndorsementChain,
  isExpired,
}) => {
  const { changeNetwork, currentChainId, providerType, account } =
    useProviderContext()

  // Any on-chain title (classic ETR transferable record or BoE obligation record).
  const isOnChainRecord = !!isTransferable || !!isObligation

  const normalizedCurrentChainId = currentChainId
    ? toChainId(currentChainId)
    : undefined
  const normalizedDocumentChainId = chainId ? toChainId(chainId) : undefined
  const isChainMatched =
    !!normalizedDocumentChainId &&
    normalizedCurrentChainId === normalizedDocumentChainId

  // Switch provider to the document's chain when a transferable / BoE document is loaded
  useEffect(() => {
    if (
      isOnChainRecord &&
      normalizedDocumentChainId &&
      normalizedCurrentChainId !== normalizedDocumentChainId
    ) {
      changeNetwork(normalizedDocumentChainId)
    }
  }, [
    isOnChainRecord,
    normalizedDocumentChainId,
    normalizedCurrentChainId,
    changeNetwork,
  ])

  // ── EIP-7702 delegation check ────────────────────────────────────────────
  // Gasless / paymaster is a classic-ETR-only feature; BoE obligations always
  // pay their own gas (see makeGaslessHook's obligation branch), so skip the
  // delegation + paymaster checks entirely for obligation documents.
  const [isDelegated, setIsDelegated] = useState(false)

  useEffect(() => {
    if (isObligation || !account || !chainId) {
      setIsDelegated(false)
      return
    }
    const rpcUrl = getRpcUrl(chainId)
    if (!rpcUrl) {
      setIsDelegated(false)
      return
    }
    let cancelled = false
    checkEIP7702Delegation(account, rpcUrl).then(result => {
      if (!cancelled) setIsDelegated(result)
    })
    return () => {
      cancelled = true
    }
  }, [isObligation, account, chainId])

  // ── Gasless card state ───────────────────────────────────────────────────
  const [paymasterAddress, setPaymasterAddress] = useState('')
  const [gaslessStatus, setGaslessStatus] = useState<
    'idle' | 'checking' | 'success' | 'error'
  >('idle')
  const [gaslessError, setGaslessError] = useState('')

  // Reset gasless state whenever the wallet changes
  useEffect(() => {
    setGaslessStatus('idle')
    setGaslessError('')
    setPaymasterAddress('')
  }, [account])

  const checkGasless = useCallback(
    async (address: string) => {
      const trimmed = address.trim()
      if (!isAddress(trimmed, { strict: false })) return

      if (!chainId || !tokenRegistryAddress || !tokenId) {
        setGaslessError(
          'Document information missing — cannot verify paymaster.'
        )
        setGaslessStatus('error')
        return
      }
      if (!account) {
        setGaslessError('Please connect your wallet first.')
        setGaslessStatus('error')
        return
      }

      const rpcUrl = getRpcUrl(chainId)
      if (!rpcUrl) {
        setGaslessError('Network error — please try again.')
        setGaslessStatus('error')
        return
      }

      setGaslessStatus('checking')
      setGaslessError('')

      // Stage 1: tokenId must be a valid integer
      let tokenIdBigInt: bigint
      try {
        tokenIdBigInt = BigInt(tokenId)
      } catch {
        setGaslessError('This document has a malformed token ID.')
        setGaslessStatus('error')
        return
      }

      // Stage 2: resolve the title escrow address from the token registry
      let titleEscrowAddress: string
      try {
        const publicClient = createPublicClient({ transport: http(rpcUrl) })
        titleEscrowAddress = (await publicClient.readContract({
          address: tokenRegistryAddress as `0x${string}`,
          abi: [
            {
              name: 'ownerOf',
              type: 'function',
              inputs: [{ name: 'tokenId', type: 'uint256' }],
              outputs: [{ name: '', type: 'address' }],
              stateMutability: 'view',
            },
          ],
          functionName: 'ownerOf',
          args: [tokenIdBigInt],
        })) as string
      } catch {
        setGaslessError(
          'Could not look up this document on-chain — please check the network.'
        )
        setGaslessStatus('error')
        return
      }

      // Stage 3: paymaster whitelist check
      try {
        const result = await checkPaymasterWhitelist(
          trimmed,
          account,
          titleEscrowAddress,
          rpcUrl
        )
        if (result.isCallerAuthorized && result.isTitleEscrowAuthorized) {
          savePaymasterAddress(account, trimmed)
          setGaslessStatus('success')
        } else {
          clearPaymasterAddress(account)
          setGaslessError('This address is not applicable to you')
          setGaslessStatus('error')
        }
      } catch {
        setGaslessError('Network error — please try again.')
        setGaslessStatus('error')
      }
    },
    [account, chainId, tokenRegistryAddress, tokenId]
  )

  // Auto-verify stored paymaster once delegation is confirmed
  useEffect(() => {
    if (!isDelegated || !account) return
    const stored = getPaymasterAddress(account)
    if (!stored) return
    setPaymasterAddress(stored)
    checkGasless(stored)
  }, [isDelegated, account, checkGasless])

  // BoE obligation records are on-chain NFTs too — keep the registry /
  // endorsement chain links visible for both, matching pre-existing behavior.
  const showNftLinks = isOnChainRecord

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  })

  const handleInfoMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const tooltipWidth = 280
    const padding = 8

    // Calculate left position with boundary checking
    let left = rect.left - tooltipWidth + rect.width

    // If tooltip would go off left edge, add padding from left
    if (left < padding) {
      left = padding
    }

    // If tooltip would go off right edge, align to right with padding
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding
    }

    setTooltipPosition({
      top: rect.bottom + 8,
      left,
      width: tooltipWidth,
    })
    setIsTooltipVisible(true)
  }

  const handleInfoFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const tooltipWidth = 280
    const padding = 8

    let left = rect.left - tooltipWidth + rect.width

    if (left < padding) {
      left = padding
    }

    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding
    }

    setTooltipPosition({
      top: rect.bottom + 8,
      left,
      width: tooltipWidth,
    })
    setIsTooltipVisible(true)
  }
  return (
    <div className="vr-container" data-testid="verify-result">
      {/* ── Network info card ── */}
      {networkName && (
        <div className="vr-network-card">
          <div className="vr-network-frame">
            <div className="vr-network-padded-frame">
              <span className="vr-network-label">Document verified on:</span>
            </div>
            <div className="vr-network-field-group">
              <div className="vr-network-field">
                <span className="vr-network-value">{networkName}</span>
                <span className="vr-network-sep">
                  <svg
                    width="8"
                    height="32"
                    viewBox="0 0 8 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 4V28" stroke="#A9B2BB" strokeOpacity="0.33" />
                  </svg>
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M11.5899 5.41489C11.883 5.12235 12.3578 5.12189 12.6504 5.41489C12.9427 5.70787 12.9421 6.1828 12.6495 6.47543L8.54107 10.5799C8.53846 10.5827 8.53593 10.586 8.53325 10.5887C8.47743 10.6446 8.41231 10.686 8.34575 10.7205C8.29448 10.7471 8.24155 10.7681 8.18657 10.7821C7.93925 10.8447 7.66661 10.7825 7.47271 10.5897L3.35064 6.47641C3.05784 6.18398 3.05769 5.70903 3.34966 5.41586C3.64227 5.12276 4.11802 5.12231 4.41118 5.41489L7.93169 8.92563C7.97072 8.96456 8.03329 8.96455 8.07232 8.92563L11.5899 5.41489Z"
                    fill="#5B6571"
                  />
                </svg>
              </div>
              <button
                type="button"
                className="vr-info-btn"
                onMouseEnter={handleInfoMouseEnter}
                onMouseLeave={() => setIsTooltipVisible(false)}
                onFocus={handleInfoFocus}
                onBlur={() => setIsTooltipVisible(false)}
                aria-label="Network info"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61524 21.75 2.25 17.3848 2.25 12C2.25 6.61523 6.61524 2.25002 12 2.25ZM12 3.75C7.44366 3.75002 3.75 7.44366 3.75 12C3.75 16.5563 7.44366 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75ZM12.0078 16.25C12.56 16.2502 13.0078 16.6978 13.0078 17.25V17.2578C13.0076 17.8098 12.5598 18.2576 12.0078 18.2578H12C11.4478 18.2578 11.0002 17.8099 11 17.2578V17.25L11.0049 17.1475C11.0562 16.6433 11.4823 16.25 12 16.25H12.0078ZM9.2207 6.7666C10.7693 5.41159 13.2317 5.41159 14.7803 6.7666C16.4068 8.19008 16.4068 10.5599 14.7803 11.9834C14.506 12.2234 14.204 12.4197 13.8867 12.5732C13.6008 12.7116 13.3576 12.8882 13.1982 13.0703C13.0442 13.2465 13 13.3879 13 13.5V14.25C13 14.8023 12.5523 15.25 12 15.25C11.4478 15.2499 11 14.8022 11 14.25V13.5C11 12.0709 12.1774 11.1792 13.0156 10.7734C13.179 10.6944 13.3293 10.5954 13.4629 10.4785C14.1791 9.8518 14.1791 8.8982 13.4629 8.27148C12.6683 7.57632 11.3316 7.57628 10.5371 8.27148C10.1215 8.63495 9.4896 8.59326 9.12598 8.17773C8.76231 7.7621 8.80509 7.13028 9.2207 6.7666Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="vr-network-frame">
            <div className="vr-empty-placeholder" />
            <div className="vr-network-padded-frame ">
              {(providerType === SIGNER_TYPE.METAMASK ||
                providerType === SIGNER_TYPE.MAGIC) &&
                account && (
                  <Connected
                    imgSrc={
                      providerType === SIGNER_TYPE.MAGIC
                        ? getMagicLinkIconSrc()
                        : '/images/wallet.png'
                    }
                    openConnectToBlockchainModel={true}
                  />
                )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main result card ── */}
      <div className="vr-main-card">
        {/* Header */}
        <div
          className="vr-card-header"
          style={!isDelegated ? { justifyContent: 'flex-end' } : undefined}
        >
          {isDelegated && gaslessStatus === 'success' ? (
            <div className="check-gasless-content-success">
              <div className="check-gasless-content-success-frame">
                <CheckCircle />
                <span className="check-gasless-content-success-text">
                  This wallet has Pay-on-Behalf enabled. Transaction fees are
                  covered for you, so you&apos;ll see a Signature Request
                  instead of a Transaction Request when confirming.
                </span>
              </div>
            </div>
          ) : isDelegated ? (
            <div className="check-gasless-card">
              <div className="check-gasless-frame">
                <div className="check-gasless-content">
                  <InfoMsgIcon />
                  <div className="check-gasless-text">
                    <span className="gasless-text">
                      We have detected that you have the pay-on-behalf feature.
                      To enable it, please enter your paymaster address:
                    </span>
                    <div className="gasless-address-input">
                      <input
                        id="gasless-paymaster-address"
                        className="gasless-address-input-field"
                        type="text"
                        aria-label="Paymaster address"
                        aria-invalid={gaslessStatus === 'error'}
                        aria-describedby={
                          gaslessStatus === 'error'
                            ? 'gasless-paymaster-error'
                            : undefined
                        }
                        placeholder="Enter your paymaster address"
                        value={paymasterAddress}
                        onChange={e => {
                          const val = e.target.value
                          setPaymasterAddress(val)
                          const trimmed = val.trim()
                          if (isAddress(trimmed, { strict: false })) {
                            checkGasless(trimmed)
                          } else if (trimmed.length > 0) {
                            setGaslessStatus('error')
                            setGaslessError('Invalid Paymaster Address')
                          } else {
                            setGaslessStatus('idle')
                            setGaslessError('')
                          }
                        }}
                        disabled={gaslessStatus === 'checking'}
                      />
                      {gaslessStatus === 'error' && (
                        <div
                          id="gasless-paymaster-error"
                          className="gasless-error-frame"
                          role="alert"
                        >
                          <div className="gasless-guidance-frame">
                            <InfoIcon fontSize={13.5} fill="#B83152" />
                            <span className="gasless-error-text">
                              {gaslessError}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            className="vr-upload-btn"
            onClick={onReset}
            data-testid="upload-new-file-btn"
          >
            <span className="vr-upload-btn-label">Upload New File</span>
          </button>
        </div>

        {/* Body: 3 columns */}
        <div className="vr-card-body">
          {/* Left: Issued by + tags */}
          <div className="vr-col-issue">
            <div className="vr-issue-info">
              <span className="vr-issued-by-label">Issued by:</span>
              <span className="vr-issued-by-value">{issuer || fileName}</span>
            </div>
            {tags && tags.length > 0 && (
              <div className="vr-issue-tags">
                {tags.map(tag => (
                  <div
                    key={tag}
                    className={`vr-tag ${
                      tag === 'Transferable' || tag === 'Negotiable'
                        ? 'vr-tag--primary'
                        : 'vr-tag--secondary'
                    }`}
                  >
                    <span className="vr-tag-text">{tag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Middle: Verification checks */}
          <div className="vr-col-checks" data-testid="verification-checks">
            <div className="vr-checks-list">
              {VERIFICATION_CHECKS.map(({ type, label }) => {
                const status = getGroupStatus(type)
                return (
                  <div
                    key={type}
                    className="vr-check-row"
                    data-testid={`check-${type.toLowerCase()}`}
                    data-status={status}
                  >
                    {status === 'VALID' ? <CheckCircle /> : <CrossCircle />}
                    <span className="vr-check-label">{label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: NFT links */}
          {showNftLinks && (
            <div className="vr-col-nft">
              <div className="vr-nft-links">
                {(() => {
                  const explorerUrl =
                    tokenRegistryAddress && chainId
                      ? makeExplorerAddressURL(tokenRegistryAddress, chainId)
                      : undefined
                  return explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vr-nft-link"
                    >
                      View NFT Registry
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="vr-nft-link"
                      onClick={onViewNftRegistry}
                      disabled={!onViewNftRegistry}
                    >
                      View NFT Registry
                    </button>
                  )
                })()}
                <TextButton
                  className="vr-nft-link"
                  onClick={onViewEndorsementChain}
                  disabled={!onViewEndorsementChain}
                >
                  View Endorsement Chain
                </TextButton>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        {showNftLinks && (
          <div className="vr-divider-container">
            <div className="vr-divider" />
          </div>
        )}

        {/* Footer: Connect Wallet */}
        {!isOnChainRecord && (
          <AssetManagementApplication
            isMagicDemo={false}
            isTransferableDocument={false}
            isExpired={!!isExpired}
            isSampleDocument={false}
          />
        )}

        {isTransferable && tokenRegistryAddress && tokenId && (
          <AssetManagementApplication
            isMagicDemo={false}
            tokenId={tokenId}
            tokenRegistryAddress={tokenRegistryAddress}
            chainId={chainId}
            setShowEndorsementChain={(show: boolean) => {
              if (show && onViewEndorsementChain) {
                onViewEndorsementChain()
              }
            }}
            refreshEndorsementChain={refreshEndorsementChain}
            isTransferableDocument={isTransferable}
            isSampleDocument={false}
            isExpired={isExpired}
          />
        )}

        {/* BoE: wait for the wallet to actually be on the document's chain
            before exposing accept/reject/discharge — otherwise a write could
            target the wrong chain's contract at the same address. */}
        {isObligation && tokenRegistryAddress && tokenId && isChainMatched && (
          <AssetManagementApplication
            isMagicDemo={false}
            tokenId={tokenId}
            tokenRegistryAddress={tokenRegistryAddress}
            chainId={chainId}
            setShowEndorsementChain={(show: boolean) => {
              if (show && onViewEndorsementChain) {
                onViewEndorsementChain()
              }
            }}
            refreshEndorsementChain={refreshEndorsementChain}
            isTransferableDocument={true}
            isSampleDocument={false}
            isExpired={isExpired}
          />
        )}
      </div>

      {/* Obfuscation Notice */}
      {rawDocument ? <ObfuscatedMessage document={rawDocument} /> : null}

      {/* Invalid Attachments Banner */}
      {invalidAttachments && invalidAttachments.length > 0 && (
        <InvalidAttachmentsBanner invalidAttachments={invalidAttachments} />
      )}

      {/* Template Renderer */}
      {rawDocument ? (
        <DocumentRenderer
          rawDocument={rawDocument}
          fileName={fileName}
          invalidAttachments={invalidAttachments}
        />
      ) : null}

      {/* Tooltip */}
      <NetworkTooltip isVisible={isTooltipVisible} position={tooltipPosition} />
    </div>
  )
}

export default VerifyResult
