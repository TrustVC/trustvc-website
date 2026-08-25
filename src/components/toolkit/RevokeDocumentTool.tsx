import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { ethers } from 'ethers'
import type { CHAIN_ID, chainInfo } from '@trustvc/trustvc'
import {
  SIGNER_TYPE,
  useProviderContext,
} from '@/components/common/contexts/providerContext'
import { parseJsonDocument } from '@/utils/toolkit/wrap'
import {
  extractRevokeTarget,
  revokeOnDocumentStore,
} from '@/utils/toolkit/revoke'
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
  const [documentJson, setDocumentJson] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [documentHash, setDocumentHash] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const applyDocument = () => {
    setStatus(null)
    const parsed = parseJsonDocument(documentJson)
    if (!parsed.ok) {
      setStatus({ kind: 'error', message: parsed.error })
      return
    }
    try {
      const target = extractRevokeTarget(parsed.value)
      setStoreAddress(target.storeAddress)
      setDocumentHash(target.documentHash)
      setStatus({
        kind: 'success',
        message: 'Store address and hash extracted from the document.',
      })
    } catch (error) {
      setStatus({
        kind: 'error',
        message: toErrorMessage(error, 'Unable to read this document.'),
      })
    }
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
      <RevokeIntro isDarkMode={isDarkMode} />
      <WalletNetworkRow
        isDarkMode={isDarkMode}
        connected={connected}
        account={account}
        selectedNetworkId={selectedNetwork?.id}
        networks={supportedChainInfoObjects}
        onNetworkChange={changeNetwork}
        onConnect={() => void upgradeToMetaMaskSigner()}
      />
      <PermanentWarning isDarkMode={isDarkMode} />
      <DocumentExtractField
        isDarkMode={isDarkMode}
        value={documentJson}
        onChange={setDocumentJson}
        onExtract={applyDocument}
      />
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
        disabled={!connected || !storeAddress || !documentHash || isSubmitting}
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-lg bg-alert-50 text-white font-urbanist font-bold disabled:opacity-40 w-full"
      >
        <ToolkitIcon src={TOOLKIT_ASSETS.warningTriangle} alt="" size={20} />
        {connected ? 'Revoke Document' : 'Connect wallet to revoke'}
      </button>
      {status && (
        <StatusNote
          kind={status.kind}
          message={status.message}
          isDarkMode={isDarkMode}
        />
      )}
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

const RevokeIntro = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div
    className={clsx(
      'flex items-start gap-3 rounded-xl px-4 py-3',
      isDarkMode ? 'bg-alert-20/40' : 'bg-alert-100'
    )}
  >
    <ToolkitIcon src={TOOLKIT_ASSETS.warningTriangle} alt="" size={24} />
    <div>
      <p
        className={clsx(
          'font-urbanist font-bold text-lg',
          isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
        )}
      >
        Revoke Document
      </p>
      <p
        className={clsx(
          'font-avenir text-sm mt-1',
          isDarkMode ? 'text-neutral-50' : 'text-neutral-20'
        )}
      >
        Submit a document’s hash to its document store smart contract to
        permanently revoke it on-chain. This is irreversible — only revoke
        documents that are void, superseded, or issued in error.
      </p>
    </div>
  </div>
)

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
}) => (
  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
    <div className="flex flex-wrap items-center gap-2">
      <span className={labelClass(isDarkMode)}>Revoke document on:</span>
      <select
        aria-label="Network"
        value={selectedNetworkId}
        onChange={event => onNetworkChange(event.target.value as CHAIN_ID)}
        className={clsx(
          'h-10 px-3 rounded-lg border font-avenir text-sm',
          fieldClass(isDarkMode)
        )}
      >
        {networks.map(chain => (
          <option key={chain.id} value={chain.id}>
            {chain.label} Network
          </option>
        ))}
      </select>
    </div>
    {connected && account ? (
      <div
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg border',
          isDarkMode ? 'border-white/10' : 'border-neutral-50/33'
        )}
      >
        <ToolkitIcon src={TOOLKIT_ASSETS.metamask} alt="" size={24} />
        <span className="font-avenir text-sm text-primary-50">
          {`${account.slice(0, 8)}...${account.slice(-4)}`}
        </span>
        <button
          type="button"
          aria-label="Copy wallet address"
          onClick={() => void navigator.clipboard.writeText(account)}
        >
          <ToolkitIcon src={TOOLKIT_ASSETS.copy} alt="" size={20} />
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={onConnect}
        className="h-10 px-4 rounded-lg font-urbanist font-bold text-sm text-white bg-gradient-to-r from-primary-60 to-secondary-60"
      >
        Connect wallet
      </button>
    )}
  </div>
)

const PermanentWarning = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div
    className={clsx(
      'flex items-start gap-3 rounded-xl px-4 py-3',
      isDarkMode ? 'bg-white/5' : 'bg-[#fff6e8]'
    )}
  >
    <ToolkitIcon src={TOOLKIT_ASSETS.attention} alt="" size={24} />
    <p
      className={clsx(
        'font-avenir text-sm',
        isDarkMode ? 'text-neutral-50' : 'text-neutral-20'
      )}
    >
      Revoking a document is permanent and cannot be undone. Verify the document
      store address and hash before proceeding.
    </p>
  </div>
)

const DocumentExtractField = ({
  isDarkMode,
  value,
  onChange,
  onExtract,
}: {
  isDarkMode: boolean
  value: string
  onChange: (value: string) => void
  onExtract: () => void
}) => (
  <div className="flex flex-col gap-2">
    <label htmlFor="toolkit-revoke-json" className={labelClass(isDarkMode)}>
      Document JSON
    </label>
    <textarea
      id="toolkit-revoke-json"
      value={value}
      onChange={event => onChange(event.target.value)}
      rows={6}
      placeholder="Paste a wrapped OA document to extract store address and hash"
      className={clsx(
        'w-full px-3 py-2 rounded-lg border text-sm font-avenir outline-none resize-y',
        fieldClass(isDarkMode)
      )}
    />
    <button
      type="button"
      onClick={onExtract}
      className={clsx(
        'self-start font-urbanist font-bold text-sm',
        isDarkMode ? 'text-primary-90' : 'text-primary-50'
      )}
    >
      Extract store and hash
    </button>
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
