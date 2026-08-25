import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { ethers } from 'ethers'
import type { CHAIN_ID, chainInfo } from '@trustvc/trustvc'
import {
  SIGNER_TYPE,
  useProviderContext,
} from '@/components/common/contexts/providerContext'
import { revokeOnDocumentStore } from '@/utils/toolkit/revoke'
import { toErrorMessage } from '@/utils/helper'
import ToolkitIcon from './ToolkitIcon'
import { TOOLKIT_ASSETS } from './assets'
import RevokeConfirmModal from './RevokeConfirmModal'
import StatusNote from './StatusNote'

type RevokeDocumentToolProps = {
  isDarkMode: boolean
}

const fieldClass = (isDarkMode: boolean) =>
  isDarkMode
    ? 'bg-transparent border-white/20 text-neutral-60'
    : 'bg-white border-neutral-50 text-neutral-10'

const labelClass = (isDarkMode: boolean) =>
  clsx(
    'font-urbanist font-bold text-sm',
    isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
  )

const RevokeDocumentTool = ({ isDarkMode }: RevokeDocumentToolProps) => {
  const {
    account,
    providerType,
    providerOrSigner,
    upgradeToMetaMaskSigner,
    changeNetwork,
    currentChainId,
    supportedChainInfoObjects,
  } = useProviderContext()
  const [storeAddress, setStoreAddress] = useState('')
  const [documentHash, setDocumentHash] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [status, setStatus] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  const connected = providerType === SIGNER_TYPE.METAMASK && Boolean(account)
  const signer = ethers.Signer.isSigner(providerOrSigner)
    ? providerOrSigner
    : undefined

  const selectedNetwork = useMemo(
    () =>
      supportedChainInfoObjects.find(chain => chain.id === currentChainId) ||
      supportedChainInfoObjects[0],
    [currentChainId, supportedChainInfoObjects]
  )

  const connectWallet = async () => {
    setConnectionError('')
    setIsConnecting(true)
    try {
      await upgradeToMetaMaskSigner()
    } catch (error) {
      setConnectionError(toErrorMessage(error, 'Unable to connect wallet.'))
    } finally {
      setIsConnecting(false)
    }
  }

  if (!connected) {
    if (isConnecting) {
      return (
        <div
          className="flex min-h-[360px] flex-col items-center justify-center px-4 py-16 text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <span
            aria-hidden="true"
            className="size-12 animate-spin rounded-full border-[6px] border-neutral-60 border-t-primary-60 border-r-primary-60"
          />
          <span
            className={clsx(
              'mt-5 font-urbanist text-lg font-medium',
              isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
            )}
          >
            Awaiting Metamask Confirmation
          </span>
          <span
            className={clsx(
              'mt-1 font-avenir text-sm font-normal',
              isDarkMode ? 'text-neutral-50' : 'text-neutral-20'
            )}
          >
            Please log in to your MetaMask extension and connect your wallet.
          </span>
        </div>
      )
    }

    return (
      <div className="flex min-h-[360px] flex-col items-center justify-start px-4 pb-12 pt-20 sm:px-8 sm:pt-24">
        <span
          className={clsx(
            'max-w-[960px] text-center font-avenir text-sm font-normal leading-[155%]',
            isDarkMode ? 'text-neutral-50' : 'text-neutral-30'
          )}
        >
          Revoking writes a transaction to the document store. You’ll need to
          connect a wallet with revoker rights on that store. Please ensure that
          you have enough cryptocurrency to complete the transaction. Supported
          blockchains: Ethereum &amp; Polygon.
        </span>
        <button
          type="button"
          onClick={() => void connectWallet()}
          disabled={isConnecting}
          aria-busy={isConnecting}
          className="mt-5 inline-flex min-h-10 w-full max-w-[260px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-50 px-6 font-urbanist text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70"
        >
          Connect Wallet
        </button>
        {connectionError && (
          <div className="mt-3">
            <StatusNote kind="error" message={connectionError} />
          </div>
        )}
      </div>
    )
  }

  const confirmRevoke = async () => {
    if (!signer) {
      setStatus({
        kind: 'error',
        message: 'Connect a wallet that can sign the revoke transaction.',
      })
      return
    }
    setIsSubmitting(true)
    try {
      const tx = await revokeOnDocumentStore({
        storeAddress,
        documentHash,
        signer,
        chainId: currentChainId,
      })
      const hash =
        'hash' in tx && typeof tx.hash === 'string' ? tx.hash : undefined
      setShowConfirm(false)
      setStatus({
        kind: 'success',
        message: hash
          ? `Document revoked. Transaction ${hash}`
          : 'Document revoked.',
      })
    } catch (error) {
      setStatus({
        kind: 'error',
        message: toErrorMessage(error, 'Revoke failed.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <WalletNetworkRow
        isDarkMode={isDarkMode}
        connected={connected}
        account={account}
        selectedNetworkId={selectedNetwork?.id}
        networks={supportedChainInfoObjects}
        onNetworkChange={changeNetwork}
        onConnect={() => void upgradeToMetaMaskSigner()}
      />
      <div className="flex w-full flex-col gap-5 md:w-3/5">
        <PermanentWarning isDarkMode={isDarkMode} />
        <HexField
          isDarkMode={isDarkMode}
          label="Store Address"
          value={storeAddress}
          onChange={setStoreAddress}
        />
        <HexField
          isDarkMode={isDarkMode}
          label="Certificate Hash To Revoke"
          value={documentHash}
          onChange={setDocumentHash}
        />
        <button
          type="button"
          disabled={
            !connected || !storeAddress || !documentHash || isSubmitting
          }
          onClick={() => setShowConfirm(true)}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-alert-50 px-6 font-urbanist font-bold text-white disabled:opacity-40"
        >
          <ToolkitIcon
            src={TOOLKIT_ASSETS.warningTriangle}
            alt=""
            size={20}
            className="brightness-0 invert"
          />
          {connected ? 'Revoke Document' : 'Connect wallet to revoke'}
        </button>
        {status && <StatusNote kind={status.kind} message={status.message} />}
      </div>
      {showConfirm && (
        <RevokeConfirmModal
          storeAddress={storeAddress}
          documentHash={documentHash}
          isSubmitting={isSubmitting}
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => void confirmRevoke()}
        />
      )}
    </div>
  )
}

const NetworkSelect = ({
  isDarkMode,
  selectedNetworkId,
  networks,
  onNetworkChange,
}: {
  isDarkMode: boolean
  selectedNetworkId?: CHAIN_ID
  networks: chainInfo[]
  onNetworkChange: (chainId: CHAIN_ID) => void
}) => {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selected =
    networks.find(chain => chain.id === selectedNetworkId) || networks[0]

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    }
  }

  return (
    <div ref={dropdownRef} className="relative min-w-0 flex-1">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Network"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        onKeyDown={handleKeyDown}
        className={clsx(
          'flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border py-0 pl-3 pr-2 font-avenir text-sm',
          fieldClass(isDarkMode)
        )}
      >
        <span className="truncate text-left">
          {selected ? `${selected.label} Network` : ''}
        </span>
        <img
          src={
            isDarkMode
              ? '/icons/chevron-down-dark.svg'
              : '/icons/chevron-down.svg'
          }
          alt=""
          aria-hidden="true"
          className={clsx(
            'size-5 shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Network"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={clsx(
            'absolute left-0 top-full z-[100] mt-1 w-full overflow-hidden rounded-lg border border-neutral-50/33 shadow-[0px_2px_8px_rgba(104,106,210,0.33)]',
            isDarkMode ? 'bg-neutral-10' : 'bg-white'
          )}
        >
          {networks.map(chain => {
            const isSelected = chain.id === selectedNetworkId
            const selectedBg = isDarkMode ? 'bg-white/10' : 'bg-black/5'
            return (
              <button
                key={chain.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onNetworkChange(chain.id)
                  setOpen(false)
                  triggerRef.current?.focus()
                }}
                className={clsx(
                  'w-full px-3 py-2 font-avenir text-sm text-left',
                  isDarkMode ? 'text-neutral-60' : 'text-neutral-10',
                  isSelected && selectedBg
                )}
              >
                {chain.label} Network
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const WalletNetworkRow = ({
  isDarkMode,
  connected,
  account,
  selectedNetworkId,
  networks,
  onNetworkChange,
  onConnect,
}: {
  isDarkMode: boolean
  connected: boolean
  account: string | undefined
  selectedNetworkId?: CHAIN_ID
  networks: chainInfo[]
  onNetworkChange: (chainId: CHAIN_ID) => void
  onConnect: () => void
}) => {
  return (
    <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-2 md:gap-6">
      <div className="flex min-w-0 flex-nowrap items-center gap-2">
        <span className={clsx(labelClass(isDarkMode), 'shrink-0')}>
          Revoke document on:
        </span>
        <NetworkSelect
          isDarkMode={isDarkMode}
          selectedNetworkId={selectedNetworkId}
          networks={networks}
          onNetworkChange={onNetworkChange}
        />
        <span
          title="Select the blockchain network containing the document store."
          aria-label="Network information"
          className="inline-flex h-10 shrink-0 items-center justify-center"
        >
          <ToolkitIcon src={TOOLKIT_ASSETS.information} alt="" size={20} />
        </span>
      </div>
      {connected && account ? (
        <div
          className={clsx(
            'flex w-full min-w-0 items-center gap-2 rounded-lg border px-3 py-2',
            isDarkMode ? 'border-white/10' : 'border-neutral-50/33'
          )}
        >
          <ToolkitIcon src={TOOLKIT_ASSETS.metamask} alt="" size={24} />
          <div className="min-w-0 flex-1">
            <span className="block truncate font-urbanist text-xs text-neutral-30">
              Active Wallet Address
            </span>
            <span
              className="block truncate font-avenir text-xs text-primary-60"
              title={account}
            >
              {`${account.slice(0, 22)}...${account.slice(-4)}`}
            </span>
          </div>
          <button
            type="button"
            aria-label="Copy wallet address"
            onClick={() => void navigator.clipboard.writeText(account)}
            className="cursor-pointer"
          >
            <ToolkitIcon src={TOOLKIT_ASSETS.copy} alt="" size={20} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          className="h-10 px-4 rounded-lg font-urbanist font-bold text-sm text-white bg-gradient-to-r from-primary-50 to-secondary-60"
        >
          Connect wallet
        </button>
      )}
    </div>
  )
}

const PermanentWarning = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div
    className={clsx(
      'flex items-start gap-3 rounded-[0.75rem] border px-4 py-3 mt-3',
      isDarkMode
        ? 'border-[#FF8200] bg-[#FFF7E2]/10'
        : 'border-[#FF8200] bg-[#FFF7E2]'
    )}
  >
    <ToolkitIcon src={TOOLKIT_ASSETS.attention} alt="" size={20} />
    <span
      className={clsx(
        'font-avenir text-[1rem] font-normal leading-[136%]',
        isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
      )}
    >
      Revoking a document is permanent and cannot be undone. Verify the document
      store address and hash before proceeding.
    </span>
  </div>
)

const HexField = ({
  isDarkMode,
  label,
  value,
  onChange,
}: {
  isDarkMode: boolean
  label: string
  value: string
  onChange: (value: string) => void
}) => (
  <label className="flex flex-col gap-2">
    <span className={labelClass(isDarkMode)}>{label}</span>
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder="0x…"
      className={clsx(
        'h-10 px-3 rounded-lg border font-mono text-sm',
        fieldClass(isDarkMode)
      )}
    />
  </label>
)

export default RevokeDocumentTool
