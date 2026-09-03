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

const firstStringField = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

const nestedError = (
  err: unknown
): {
  code?: unknown
  reason?: unknown
  data?: unknown
  error?: unknown
  message?: unknown
} =>
  err && typeof err === 'object'
    ? (err as {
        code?: unknown
        reason?: unknown
        data?: unknown
        error?: unknown
        message?: unknown
      })
    : {}

const revertData = (err: unknown): string => {
  const record = nestedError(err)
  const nested = nestedError(record.error)
  const raw = firstStringField(
    record.data,
    nested.data,
    nestedError(nested.error).data
  )
  if (raw.startsWith('0x') && raw.length >= 10) return raw.toLowerCase()

  const message = firstStringField(
    record.reason,
    record.message,
    err instanceof Error ? err.message : err
  )
  const fromMessage = message.match(/data="(0x[0-9a-fA-F]+)"/i)
  return fromMessage?.[1]?.toLowerCase() ?? ''
}

const ALREADY_REVOKED =
  'This document is already revoked on that document store. Revoking it again is not possible.'
const NOT_ISSUED =
  'This hash has not been issued on that document store yet. Issue the document first, then revoke.'
const NO_REVOKER_ROLE =
  'This wallet does not have revoker rights on that document store. Connect the store owner or a wallet that has been granted the revoker role.'
const GENERIC_REVERT =
  'The document store rejected this revoke. The hash may not be issued, it may already be revoked, or this wallet may not have revoker rights.'

/** TrustVC / OpenAttestation DocumentStore custom-error selectors. */
const REVERT_SELECTOR_COPY: Record<string, string> = {
  '0xd19a0b2f': ALREADY_REVOKED, // InactiveDocument(bytes32,bytes32)
  '0x96cfb27c': ALREADY_REVOKED, // DocumentIsRevoked(bytes32,bytes32)
  '0x517eeb7d': NOT_ISSUED, // DocumentNotIssued(bytes32,bytes32)
  '0xe2517d3f': NO_REVOKER_ROLE, // AccessControlUnauthorizedAccount
  '0x4b20c093':
    'The certificate hash is empty or invalid. Check the hash and try again.',
  '0xc45a8d98':
    'The document store rejected this hash. Confirm the store address and certificate hash are correct.',
}

const errorText = (err: unknown): string => {
  const record = nestedError(err)
  if (record.code === 4001 || record.code === 'ACTION_REJECTED') {
    return 'user rejected'
  }
  return firstStringField(
    record.reason,
    record.message,
    err instanceof Error ? err.message : undefined,
    typeof err === 'string' ? err : undefined
  )
}

const REVOKE_ERROR_COPY: Array<[RegExp, string]> = [
  [/InactiveDocument|DocumentIsRevoked|already revoked/i, ALREADY_REVOKED],
  [/DocumentNotIssued|not issued/i, NOT_ISSUED],
  [
    /Pre-check \(callStatic\) for revoke|callStatic\.revoke is not a function|revoke is not a function/i,
    GENERIC_REVERT,
  ],
  [/AccessControl|missing role|REVOKER_ROLE/i, NO_REVOKER_ROLE],
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
  [/call revert exception|CALL_EXCEPTION|links\.ethers\.org/i, GENERIC_REVERT],
]

export const toRevokeErrorMessage = (err: unknown): string => {
  const selector = revertData(err).slice(0, 10)
  if (selector && REVERT_SELECTOR_COPY[selector]) {
    return REVERT_SELECTOR_COPY[selector]
  }

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
