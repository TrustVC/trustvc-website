import { useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { documentStoreRevoke } from '@trustvc/trustvc'
import {
  SIGNER_TYPE,
  useProviderContext,
} from '@/components/common/contexts/providerContext'
import { ConnectToMetamaskModelComponent } from '@/components/ConnectToMetamask'
import { ToolCard, StatusAlert } from '@/components/toolkit/shared'
import ConfirmRevokeModal from './ConfirmRevokeModal'

// ethers is not a direct dependency of this package — derive the signer type
// from the SDK's own function signature instead of importing `Signer` from 'ethers'.
type RevokeSigner = Parameters<typeof documentStoreRevoke>[2]

type RevokeStatus = 'idle' | 'confirming' | 'pending' | 'success' | 'error'

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const HASH_RE = /^0x[0-9a-fA-F]{64}$/

const RevokeDocument = () => {
  const { providerType, account, providerOrSigner } = useProviderContext()
  const [storeAddress, setStoreAddress] = useState('')
  const [documentHash, setDocumentHash] = useState('')
  const [status, setStatus] = useState<RevokeStatus>('idle')
  const [error, setError] = useState('')
  const [txHash, setTxHash] = useState('')

  const isConnected = providerType === SIGNER_TYPE.METAMASK && !!account

  const requestRevoke = () => {
    setError('')
    setTxHash('')
    if (!ADDRESS_RE.test(storeAddress.trim())) {
      setStatus('error')
      setError('Enter a valid document store address (0x + 40 hex characters).')
      return
    }
    if (!HASH_RE.test(documentHash.trim())) {
      setStatus('error')
      setError('Enter a valid certificate hash (0x + 64 hex characters).')
      return
    }
    setStatus('confirming')
  }

  const confirmRevoke = async () => {
    setStatus('pending')
    try {
      const tx = await documentStoreRevoke(
        storeAddress.trim(),
        documentHash.trim(),
        providerOrSigner as RevokeSigner
      )
      setTxHash(tx.hash)
      await tx.wait()
      setStatus('success')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Revocation failed')
    }
  }

  return (
    <ToolCard
      icon={<AlertTriangle size={22} />}
      title="Revoke Document"
      description="Submit a document's hash to revoke (or target hash) to its document store smart contract to permanently revoke it on-chain. This is irreversible — only revoke documents that are void, superseded, or issued in error."
    >
      {!isConnected ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-sm text-neutral-30">
            Connect your MetaMask wallet to revoke a document.
          </p>
          <ConnectToMetamaskModelComponent
            showOnNewConnectWarningMessage={false}
          />
        </div>
      ) : (
        <div className="flex max-w-xl flex-col gap-5">
          {status === 'error' && (
            <StatusAlert variant="error">
              {error}
              {txHash && (
                <>
                  {' '}
                  Transaction: <span className="font-mono">{txHash}</span>
                </>
              )}
            </StatusAlert>
          )}
          {status === 'success' && (
            <StatusAlert variant="success">
              Document revoked. Transaction:{' '}
              <span className="font-mono">{txHash}</span>
            </StatusAlert>
          )}
          {status === 'pending' && (
            <div
              role="status"
              className="rounded-lg border border-primary-100 bg-primary-100/20 px-4 py-3 text-sm text-primary-30"
            >
              {txHash
                ? `Waiting for confirmation… Transaction: ${txHash}`
                : 'Awaiting wallet signature…'}
            </div>
          )}
          {(status === 'idle' || status === 'confirming') && (
            <StatusAlert variant="warning">
              Revoking a document is permanent and cannot be undone. Verify the
              document store address and hash before proceeding.
            </StatusAlert>
          )}

          <div>
            <label
              htmlFor="revoke-store"
              className="mb-2 block text-sm font-semibold text-neutral-10"
            >
              Store Address
            </label>
            <input
              id="revoke-store"
              value={storeAddress}
              onChange={e => setStoreAddress(e.target.value)}
              placeholder="0x…"
              className="w-full rounded-lg border border-neutral-60 px-3 py-2 font-mono text-sm focus:border-primary-60 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="revoke-hash"
              className="mb-2 block text-sm font-semibold text-neutral-10"
            >
              Certificate Hash To Revoke
            </label>
            <input
              id="revoke-hash"
              value={documentHash}
              onChange={e => setDocumentHash(e.target.value)}
              placeholder="0x…"
              className="w-full rounded-lg border border-neutral-60 px-3 py-2 font-mono text-sm focus:border-primary-60 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={requestRevoke}
            disabled={status === 'pending'}
            className="flex items-center justify-center gap-2 rounded-lg bg-alert-50 px-6 py-2.5 text-sm font-semibold text-white hover:bg-alert-20 disabled:opacity-50"
          >
            <AlertTriangle size={16} />
            Revoke Document
          </button>
        </div>
      )}

      {status === 'confirming' && (
        <ConfirmRevokeModal
          storeAddress={storeAddress.trim()}
          documentHash={documentHash.trim()}
          onConfirm={confirmRevoke}
          onCancel={() => setStatus('idle')}
        />
      )}
    </ToolCard>
  )
}

export default RevokeDocument
