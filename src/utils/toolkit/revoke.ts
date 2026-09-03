import {
  getDataV2,
  isWrappedV2Document,
  isWrappedV3Document,
  type CHAIN_ID,
} from '@trustvc/trustvc'
import { Contract, type Signer } from 'ethers'

/**
 * DocumentStore overloads `revoke` (single hash vs merkle-proof batch). Ethers v5
 * then leaves `contract.callStatic.revoke` undefined, which is what the bundled
 * `@trustvc/trustvc` `documentStoreRevoke` still calls. A one-function ABI makes
 * the name unambiguous.
 */
const DOCUMENT_STORE_REVOKE_ABI = ['function revoke(bytes32 document)']

const withHexPrefix = (value: string): string =>
  value.startsWith('0x') ? value : `0x${value}`

const firstString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (Array.isArray(value)) {
    const found = value.find(item => typeof item === 'string' && item.trim())
    return typeof found === 'string' ? found.trim() : undefined
  }
  return undefined
}

export type RevokeTarget = {
  storeAddress: string
  documentHash: string
}

export const extractRevokeTarget = (document: unknown): RevokeTarget => {
  if (!document || typeof document !== 'object') {
    throw new Error('Paste a wrapped OpenAttestation document JSON.')
  }

  const record = document as Record<string, unknown>
  let documentHash =
    firstString(
      (record.signature as Record<string, unknown> | undefined)?.merkleRoot
    ) ||
    firstString(
      (record.signature as Record<string, unknown> | undefined)?.targetHash
    ) ||
    firstString(
      (record.proof as Record<string, unknown> | undefined)?.merkleRoot
    ) ||
    firstString(
      (record.proof as Record<string, unknown> | undefined)?.targetHash
    )

  let storeAddress: string | undefined

  if (isWrappedV2Document(document)) {
    const data = getDataV2(document) as {
      issuers?: Array<{ documentStore?: string; certificateStore?: string }>
    }
    storeAddress = data.issuers?.find(
      issuer => issuer.documentStore || issuer.certificateStore
    )?.documentStore
    storeAddress =
      storeAddress ||
      data.issuers?.find(issuer => issuer.certificateStore)?.certificateStore
  } else if (isWrappedV3Document(document)) {
    const proof = (
      document as {
        openAttestationMetadata?: {
          proof?: { value?: string; method?: string }
        }
      }
    ).openAttestationMetadata?.proof
    if (proof?.method === 'DOCUMENT_STORE') {
      storeAddress = proof.value
    }
  } else {
    storeAddress =
      firstString(record.storeAddress) || firstString(record.documentStore)
    documentHash =
      documentHash ||
      firstString(record.documentHash) ||
      firstString(record.targetHash)
  }

  if (!storeAddress) {
    throw new Error('Could not find a document store address on this document.')
  }
  if (!documentHash) {
    throw new Error('Could not find a target hash on this document.')
  }

  return {
    storeAddress,
    documentHash: withHexPrefix(documentHash),
  }
}

export const truncateHash = (value: string, visible = 6): string => {
  if (value.length <= visible * 2 + 3) return value
  return `${value.slice(0, visible + 2)}…${value.slice(-visible)}`
}

const errorText = (err: unknown): string => {
  // Prefer the short, specific fields ethers/wallet errors carry (`code`, `reason`)
  // over `message`, which is often a long blob of debug text and URLs.
  if (err && typeof err === 'object') {
    const record = err as { code?: unknown; reason?: unknown }
    if (record.code === 4001 || record.code === 'ACTION_REJECTED') {
      return 'user rejected'
    }
    if (typeof record.reason === 'string' && record.reason.trim()) {
      return record.reason.trim()
    }
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim()
  if (typeof err === 'string' && err.trim()) return err.trim()
  return ''
}

const REVOKE_ERROR_COPY: Array<[RegExp, string]> = [
  [
    /Pre-check \(callStatic\) for revoke|callStatic\.revoke is not a function|revoke is not a function/i,
    'This revoke cannot go through. Confirm you are on the same network as the document store, this wallet has revoker rights, and the store address and hash are correct. The document may already be revoked.',
  ],
  [
    /AccessControl|missing role|REVOKER_ROLE/i,
    'This wallet does not have revoker rights on that document store. Connect the store owner or a wallet that has been granted the revoker role.',
  ],
  [
    /user rejected|user denied|ACTION_REJECTED|rejected the request/i,
    'Revoke cancelled in your wallet.',
  ],
  [
    /insufficient funds|insufficient balance/i,
    'This wallet does not have enough cryptocurrency to pay for the transaction.',
  ],
  [
    /could not detect network|underlying network changed/i,
    "Your wallet's network changed unexpectedly. Reconnect your wallet, make sure it's on the same network as the document store, and try again.",
  ],
]

export const toRevokeErrorMessage = (err: unknown): string => {
  const message = errorText(err)
  const mapped = REVOKE_ERROR_COPY.find(([pattern]) => pattern.test(message))
  if (mapped) return mapped[1]
  if (!message) return 'Revoke failed. Please try again.'
  return `Revoke failed. The wallet or network reported: "${message}" — double-check the store address, hash and network, then try again.`
}

export const revokeOnDocumentStore = async ({
  storeAddress,
  documentHash,
  signer,
}: RevokeTarget & {
  signer: Signer
  chainId?: CHAIN_ID
}) => {
  if (!storeAddress.trim()) {
    throw new Error('Document store address is required.')
  }
  if (!documentHash.trim()) {
    throw new Error('Certificate hash is required.')
  }

  const hash = withHexPrefix(documentHash.trim())
  const contract = new Contract(
    storeAddress.trim(),
    DOCUMENT_STORE_REVOKE_ABI,
    signer
  )

  await contract.callStatic.revoke(hash)
  return contract.revoke(hash)
}
