import React, { useState, useRef } from 'react'
import {
  verifyDocument,
  getChainId,
  SUPPORTED_CHAINS,
  isTransferableRecord,
  isObligationRecord,
  getObligationRegistryAddress,
  vc,
  isWrappedV2Document,
  isWrappedV3Document,
  isRawV2Document,
  isSignedWrappedV2Document,
  isRawV3Document,
  isSignedWrappedV3Document,
  isTitleEscrowVersion,
  TitleEscrowInterface,
  getTokenRegistryAddress,
  getTokenId,
  getDocumentData as getDocumentDataFromWrappedDocument,
  errorMessageHandling,
  errorMessages,
} from '@trustvc/trustvc'
import {
  getRpcUrl,
  getIsExpired,
  isVerifiablePresentation,
  getPresentationCredentials,
  getCredentialLabel,
  getW3CVersionLabel,
} from '../../../utils/helper'
import { useDocumentContext } from '../../common/contexts/DocumentContext'
import { type VerifyErrorType, getErrorTypeFromError } from './verifyErrorUtils'
import {
  captureVerificationBreadcrumb,
  captureVerificationException,
  captureVerificationInvalid,
} from '../../../lib/sentry'
import {
  trackDocumentDropped,
  trackDocumentVerified,
  trackDocumentVerifyError,
  trackNetworkSelectionShown,
  trackNetworkSelected,
  trackNetworkSelectionCancelled,
  trackVerificationReset,
  type DocumentDroppedSource,
} from '../../../utils/analytics'

export type VerifyStatus =
  | 'idle'
  | 'verifying'
  | 'valid'
  | 'invalid'
  | 'error'
  | 'network-select'

export type VerificationFragmentType =
  | 'DOCUMENT_INTEGRITY'
  | 'DOCUMENT_STATUS'
  | 'ISSUER_IDENTITY'

export interface VerificationFragmentReason {
  code: number
  codeString: string
  message: string
}

export interface VerificationFragment {
  name: string
  status: 'VALID' | 'INVALID' | 'SKIPPED' | 'ERROR'
  type: VerificationFragmentType
  reason?: VerificationFragmentReason
  data?: any
}

export type TokenRegistryVersion = 'V4' | 'V5' | null

export interface UseVerifyReturn {
  verifyStatus: VerifyStatus
  fileName: string
  errorType: VerifyErrorType
  errorMessage?: string
  dragActive: boolean
  verifiedChainId?: string
  issuerName?: string
  isTransferable: boolean
  isObligation: boolean
  isExpired: boolean
  tokenRegistryVersion: TokenRegistryVersion
  tokenRegistryAddress?: string
  tags: string[]
  tokenId?: string
  keyId?: string
  rawDocument?: unknown
  getGroupStatus: (_type: string) => 'VALID' | 'INVALID'
  handleDrag: (_e: React.DragEvent) => void
  handleDrop: (_e: React.DragEvent) => void
  handleFileInput: (_e: React.ChangeEvent<HTMLInputElement>) => void
  handleReset: () => void
  handleNetworkConfirm: (_chainId: string) => void
  handleNetworkCancel: () => void
  loadDocument: (
    _doc: unknown,
    _chainId: string | null | undefined,
    _name: string,
    _source?: DocumentDroppedSource
  ) => Promise<void>
}

const computeGroupStatus = (
  frags: VerificationFragment[],
  type: string
): 'VALID' | 'INVALID' => {
  const group = frags.filter(f => f.type === type)
  if (group.length === 0) return 'INVALID'
  if (group.some(f => f.status === 'INVALID' || f.status === 'ERROR'))
    return 'INVALID'
  if (group.some(f => f.status === 'VALID')) return 'VALID'
  return 'INVALID'
}

/**
 * Whether verifying this document reads on-chain state and therefore needs a network.
 * True for: transferable records (token registry), document/certificate stores, and
 * REVOCATION_STORE revocation. False for OCSP_RESPONDER revocation and plain
 * DID-signed docs — those verify off-chain (HTTP / signature), so they should NOT
 * trigger the network-select prompt. (tt-verify has no revocation-type classifier,
 * so we inspect the issuer the same way isDocumentRevokable does internally.)
 */
const requiresNetworkSelection = (doc: unknown): boolean => {
  if (isTransferableRecord(doc as any) || isObligationRecord(doc as any))
    return true
  try {
    if (isWrappedV2Document(doc as any)) {
      const data = getDocumentDataFromWrappedDocument(doc as any) as {
        issuers?: Array<{
          documentStore?: string
          certificateStore?: string
          revocation?: { type?: string }
        }>
      }
      return (data?.issuers ?? []).some(
        i =>
          !!i.documentStore ||
          !!i.certificateStore ||
          i.revocation?.type === 'REVOCATION_STORE'
      )
    }
    if (isWrappedV3Document(doc as any)) {
      const proof = (doc as any).openAttestationMetadata?.proof
      return (
        proof?.method === 'DOCUMENT_STORE' ||
        proof?.revocation?.type === 'REVOCATION_STORE'
      )
    }
  } catch {
    // fall through to false
  }
  return false
}

/**
 * The chainId embedded in the document's own network field. trustvc's getChainId()
 * deliberately ignores this for DNS-DID/DID documents (it assumes they're off-chain),
 * but such a doc can still carry a REVOCATION_STORE that lives on that chain — so use
 * the embedded value as a fallback rather than prompting the user for a network.
 */
const getEmbeddedChainId = (doc: unknown): string | undefined => {
  try {
    const data = getDocumentDataFromWrappedDocument(doc as any) as {
      network?: { chainId?: string | number }
    }
    const chainId = data?.network?.chainId
    return chainId != null ? String(chainId) : undefined
  } catch {
    return undefined
  }
}

/**
 * Detect error type from verification fragments using @trustvc/trustvc library.
 * Returns the first error type, or VERIFICATION_ERROR as fallback.
 */
/**
 * trustvc's OAErrorMessageHandling only recognizes the document-store DOCUMENT_REVOKED
 * code as "revoked"; an OCSP-responder revocation carries an OCSP reason code instead,
 * so it gets mis-bucketed as a generic ethers error. Detect it explicitly.
 */
const isOcspRevoked = (frags: VerificationFragment[]): boolean =>
  frags.some(
    f =>
      f.type === 'DOCUMENT_STATUS' &&
      f.status === 'INVALID' &&
      /revoked under OCSP Responder/i.test((f as any).reason?.message ?? '')
  )

/**
 * An unminted token registry document: ownerOf() reverts with
 * "ERC721: owner query for nonexistent token". On some providers (e.g. local
 * Hardhat) ethers v6 mis-decodes that revert as a BAD_DATA error, so the
 * token-registry fragment is ERROR rather than a clean "not minted" — and falls
 * through to a generic ethers error. Match the ownerOf revert specifically (a real
 * RPC failure is a connection/server error → SERVER_ERROR, never this).
 */
const isTokenRegistryNotMinted = (frags: VerificationFragment[]): boolean =>
  frags.some(f => {
    if (
      f.name !== 'OpenAttestationEthereumTokenRegistryStatus' ||
      f.status !== 'ERROR'
    )
      return false
    const msg = (f as any).reason?.message ?? ''
    // The ownerOf() call reverted with Error(string) "…nonexistent token" — i.e. the
    // registry exists but the token isn't minted. (0x08c379a0 = Error(string) selector.)
    return /ownerOf/.test(msg) && /0x08c379a0/i.test(msg)
  })

/**
 * Token registry address has no contract: ownerOf() returns empty data (value="0x"),
 * which ethers v6 surfaces as a BAD_DATA error instead of tt-verify's CONTRACT_NOT_FOUND.
 * (A document store reports this cleanly; the token registry doesn't.) Distinguished
 * from "not minted" by the empty value (no 0x08c379a0 revert reason).
 */
const isTokenRegistryContractNotFound = (
  frags: VerificationFragment[]
): boolean =>
  frags.some(f => {
    if (
      f.name !== 'OpenAttestationEthereumTokenRegistryStatus' ||
      f.status !== 'ERROR'
    )
      return false
    const msg = (f as any).reason?.message ?? ''
    return /ownerOf/.test(msg) && /value="0x"/.test(msg)
  })

/**
 * A DID-signed doc whose REVOCATION_STORE contract doesn't exist: the revocation
 * check returns INVALID "Contract is not found", but trustvc tags it with the
 * DOCUMENT_REVOKED code → mis-classified as REVOKED. Surface it as CONTRACT_NOT_FOUND
 * (consistent with the document-store no-contract case). Distinct from a genuine
 * revocation-store revoke, whose message is "…has been revoked under contract …".
 */
const isDidSignedContractNotFound = (frags: VerificationFragment[]): boolean =>
  frags.some(
    f =>
      f.name === 'OpenAttestationDidSignedDocumentStatus' &&
      f.status === 'INVALID' &&
      /Contract is not found/i.test((f as any).reason?.message ?? '')
  )

/**
 * W3C TransferableRecords status failures carry a clean, human-readable reason
 * straight from the verifier — "Token registry is not found" (no contract) and
 * "Document has not been issued under token registry" (not minted). For these two
 * cases we surface the verifier's reason verbatim as the UI body (the error type
 * stays the generic INVALID, so the title is unchanged) rather than mapping to a
 * typed message. Scoped to those two strings; any other failure keeps its typed copy.
 */
const W3C_TR_REASON =
  /(has not been issued under token registry|token registry is not found)/i

const W3C_OR_REASON = /(has not been issued under contract)/i

/** The presentation verifier fragments. */
const VP_FRAGMENTS = [
  'W3CVpSignatureIntegrity',
  'W3CVpCredentialStatus',
  'W3CVpIssuerIdentity',
]

/**
 * Every reason across the failing presentation fragments. More than one can fail at once —
 * an empty presentation fails both the proof and the issuer check — so all of them are
 * considered rather than just the first, letting the specific explanation win over a
 * generic one.
 */
const failingVpReasons = (frags: VerificationFragment[]): string[] =>
  frags
    .filter(
      f =>
        VP_FRAGMENTS.includes(f.name) &&
        (f.status === 'INVALID' || f.status === 'ERROR')
    )
    .map(f => (f as any)?.reason?.message ?? '')

/**
 * Names the embedded credential(s) a verifier reason blames — by POSITION and by the label the
 * credential tabs show, e.g. `Credential 2 ("BILL OF LADING")`.
 *
 * Both halves are needed, and each alone is wrong:
 *
 * - Position alone ("Credential 2", or the verifier's zero-based "index 1") names nothing the
 *   user can see: real documents label their tabs by template or type — "CHAFTA COO",
 *   "BILL OF LADING" — and only fall back to `Credential N` when a credential has neither.
 * - Label alone is ambiguous, because `CredentialTabs` renders the label with no
 *   disambiguation. Two bills of lading in one presentation produce two identical tabs, so
 *   "the BILL OF LADING credential" could mean either.
 *
 * Together they are unambiguous and findable: tabs render in credential order, so the position
 * locates the tab and the label confirms it is the right one.
 *
 * Reasons name indices in several shapes, and more than one at a time:
 *   "Embedded credential at index 0 has expired (...)"
 *   "Embedded credential(s) at index 0, 2 have no issuer."
 *   "Could not resolve issuer(s): index 0 (did:web:a), index 1 (did:web:b)."
 * so every `index N` is collected, not just the first. Without a document, or with no index at
 * all, it degrades to a plainer phrase rather than naming the wrong credential.
 */
const credentialsAtFault = (
  reason: string,
  doc?: unknown
): { phrase: string; plural: boolean } => {
  const indices = [
    ...new Set([...reason.matchAll(/\bindex (\d+)/gi)].map(m => Number(m[1]))),
  ].sort((a, b) => a - b)
  if (indices.length === 0) return { phrase: 'A credential', plural: false }

  let credentials: unknown[] = []
  try {
    credentials = doc ? (getPresentationCredentials(doc as never) ?? []) : []
  } catch {
    credentials = []
  }

  const names = indices.map(index => {
    const position = `Credential ${index + 1}`
    const credential = credentials[index]
    if (!credential) return position
    const label = getCredentialLabel(credential, index)
    // getCredentialLabel falls back to this exact string; do not repeat it.
    return label === position ? position : `${position} ("${label}")`
  })

  return {
    phrase:
      names.length === 1
        ? names[0]
        : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`,
    plural: names.length > 1,
  }
}

/**
 * Maps a presentation failure onto the established error copy.
 *
 * trustvc's errorMessageHandling was written for OpenAttestation: it sees an invalid
 * DOCUMENT_INTEGRITY and returns HASH for every presentation failure, so an expired or
 * unsigned presentation was reported as "Document has been tampered with". Matching on the
 * verifier's reason instead gives the accurate existing message — a bad signature really is
 * HASH, a revoked credential really is REVOKED — and the raw verifier wording
 * ("Invalid signature.") never reaches the user.
 *
 * `message` is only set where no existing copy conveys the cause; there is no EXPIRED type,
 * for instance. Where it is absent the type's own failureMessage is used. A function receives
 * the verifier reason that matched, so copy can name the credential at fault.
 */
const PRESENTATION_FAILURES: Array<{
  match: RegExp
  type: VerifyErrorType
  message?: string | ((reason: string, doc?: unknown) => string)
}> = [
  {
    match: /no verifiable credentials/i,
    type: errorMessages.TYPES.INVALID,
    message: 'This presentation does not contain any credentials.',
  },
  // An EMBEDDED credential's problem, ahead of the presentation-level rules below. These must
  // name WHICH credential and point at the issuer: the presentation itself is fine, and the
  // default copy ("This document has been revoked", "Ask the holder to present again") reads
  // as though the presentation were at fault and sends the user to the wrong party.
  {
    match: /embedded credential .*(has been revoked|has been suspended)/i,
    type: errorMessages.TYPES.REVOKED,
    message: (reason, doc) => {
      const { phrase, plural } = credentialsAtFault(reason, doc)
      return `${phrase} in this presentation ${plural ? 'have' : 'has'} been revoked by ${plural ? 'their issuers' : 'its issuer'}. Contact them for more details.`
    },
  },
  {
    match: /embedded credential .*has expired/i,
    type: errorMessages.TYPES.INVALID,
    message: (reason, doc) => {
      const { phrase, plural } = credentialsAtFault(reason, doc)
      return `${phrase} in this presentation ${plural ? 'have' : 'has'} expired. Ask the issuer to reissue ${plural ? 'them' : 'it'} — presenting ${plural ? 'them' : 'it'} again will not help.`
    },
  },
  {
    match: /embedded credential .*is not yet valid/i,
    type: errorMessages.TYPES.INVALID,
    message: (reason, doc) => {
      const { phrase, plural } = credentialsAtFault(reason, doc)
      return `${phrase} in this presentation ${plural ? 'are' : 'is'} not valid yet. Check with the issuer when ${plural ? 'they become' : 'it becomes'} valid.`
    },
  },
  // Revocation is reported ahead of tampering: it is the more actionable answer for the
  // holder, and the realistic case (revoked upstream after the presentation was signed)
  // leaves the proof intact anyway.
  { match: /revoked|suspended/i, type: errorMessages.TYPES.REVOKED },
  // Issuer resolution is reported ahead of tampering for the same reason — it is the ROOT
  // CAUSE, not a co-occurring failure. Verifying an embedded credential's signature needs the
  // issuer's public key, so a DID that will not resolve necessarily fails the signature check
  // too ("has an invalid signature: Cannot read properties of null (reading
  // 'verificationMethod')" — a raw TypeError from the failed lookup). Matched the other way
  // round, an unpublished did:web is reported to the user as a tampered document.
  // Also names the credential rather than saying "this document": the presentation resolves
  // fine, it is an embedded credential whose issuer DID does not.
  {
    match: /could not resolve issuer|have no issuer/i,
    type: errorMessages.TYPES.IDENTITY,
    message: (reason, doc) => {
      const { phrase, plural } = credentialsAtFault(reason, doc)
      return `${phrase} in this presentation ${plural ? 'name issuers' : 'names an issuer'} that cannot be identified, so ${plural ? 'they cannot' : 'it cannot'} be verified. Contact the issuer.`
    },
  },
  { match: /invalid signature|tampered/i, type: errorMessages.TYPES.HASH },
  // The PRESENTATION's own window. Reached only after the embedded-credential rules above,
  // because both read "... has expired (validUntil ...)" and a single /has expired/ rule would
  // otherwise catch the credential case and tell the user to ask the holder to present again —
  // advice that can never work, since only the issuer can reissue a credential.
  {
    match: /has expired/i,
    type: errorMessages.TYPES.INVALID,
    message:
      'This presentation has expired and can no longer be used. Ask the holder to present the credentials again.',
  },
  {
    match: /not signed|no holder/i,
    type: errorMessages.TYPES.INVALID,
    message:
      'This presentation is not signed, so the presenter cannot prove they hold these credentials.',
  },
  // Signed correctly, but by somebody other than the declared holder — the shape of presenting
  // a credential that is about someone else. Distinct from an unsigned presentation, and from
  // tampering: the signature is genuine, it just is not the holder's.
  {
    match: /does not match the declared holder/i,
    type: errorMessages.TYPES.INVALID,
    message:
      'This presentation was signed by someone other than the holder it names, so the presenter cannot prove these credentials are theirs.',
  },
]

const matchPresentationFailure = (frags: VerificationFragment[]) => {
  const reasons = failingVpReasons(frags)
  if (reasons.length === 0) return undefined
  // Ordered most specific first, so it wins over a co-occurring generic failure. The reason
  // that matched is carried along so copy can name the credential it blames.
  for (const failure of PRESENTATION_FAILURES) {
    const reason = reasons.find(r => failure.match.test(r))
    if (reason !== undefined) return { ...failure, reason }
  }
  // An unrecognised presentation failure is invalid, not tampered.
  return { match: /./, type: errorMessages.TYPES.INVALID, reason: reasons[0] }
}

/**
 * `doc` is optional so existing callers and tests keep working; without it, copy that names a
 * credential falls back to the position alone rather than the tab label.
 */
export const getErrorMessageFromFragments = (
  frags: VerificationFragment[],
  doc?: unknown
): string | undefined => {
  const presentation = matchPresentationFailure(frags)
  if (presentation) {
    const { message, reason } = presentation
    return typeof message === 'function' ? message(reason, doc) : message
  }

  const tr = frags.find(
    f =>
      f.name === 'TransferableRecords' &&
      f.status === 'INVALID' &&
      W3C_TR_REASON.test((f as any).reason?.message ?? '')
  )
  if ((tr as any)?.reason?.message) return (tr as any).reason.message

  const orFrag = frags.find(
    f =>
      f.name === 'ObligationRecords' &&
      f.status === 'INVALID' &&
      W3C_OR_REASON.test((f as any).reason?.message ?? '')
  )
  return (orFrag as any)?.reason?.message || undefined
}

export const getErrorTypeFromFragments = (
  frags: VerificationFragment[]
): VerifyErrorType => {
  try {
    const presentation = matchPresentationFailure(frags)
    if (presentation) return presentation.type
    if (isDidSignedContractNotFound(frags))
      return errorMessages.TYPES.CONTRACT_NOT_FOUND
    if (isOcspRevoked(frags)) return errorMessages.TYPES.REVOKED
    if (isTokenRegistryNotMinted(frags)) return errorMessages.TYPES.ISSUED
    if (isTokenRegistryContractNotFound(frags))
      return errorMessages.TYPES.CONTRACT_NOT_FOUND
    const errors = errorMessageHandling(frags as any)
    return errors[0] || errorMessages.TYPES.VERIFICATION_ERROR
  } catch {
    return errorMessages.TYPES.VERIFICATION_ERROR
  }
}

const getV2FormattedDomainNames = (
  verificationStatus: VerificationFragment[]
): string => {
  const joinIssuers = (issuers: string[] | undefined): string => {
    if (!issuers) return 'Unknown'
    const issuerNames = issuers.join(', ')
    return issuerNames?.replace(/,(?=[^,]*$)/, ' and') // regex to find last comma, replace with and
  }

  const formatIdentifier = (
    fragment: VerificationFragment
  ): string | undefined => {
    switch (fragment.name) {
      case 'OpencertsRegistryVerifier': {
        const issuerNames = Array.isArray(fragment?.data)
          ? (fragment.data as Array<{ name?: string }>).reduce<string[]>(
              (acc, issuer) => {
                const name = issuer?.name
                if (typeof name === 'string' && name.trim().length > 0) {
                  acc.push(name)
                }
                return acc
              },
              []
            )
          : undefined
        return joinIssuers(issuerNames)
      }
      case 'OpenAttestationDnsTxtIdentityProof':
      case 'OpenAttestationDnsDidIdentityProof':
        return joinIssuers(
          fragment.data?.map((issuer: any) => issuer.location.toUpperCase())
        )
      case 'OpenAttestationDidIdentityProof':
        return joinIssuers(
          fragment.data?.map((issuer: any) => issuer.did.toUpperCase())
        )
      default:
        return 'Unknown'
    }
  }

  const identityProofFragment = verificationStatus
    .filter(f => f.type === 'ISSUER_IDENTITY')
    .find(f => f.status === 'VALID')

  const dataFragment = identityProofFragment?.data
  const fragmentValidity =
    dataFragment?.length > 0 &&
    dataFragment?.every(
      (issuer: { status: string; verified: boolean }) =>
        issuer.status === 'VALID' || issuer.verified === true
    )

  return fragmentValidity && identityProofFragment
    ? formatIdentifier(identityProofFragment) || 'Unknown'
    : 'Unknown'
}

const getV3IdentityVerificationText = (document: any): string => {
  return (
    document.openAttestationMetadata?.identityProof?.identifier?.toUpperCase() ||
    'Unknown'
  )
}

const getW3CIdentityVerificationText = (document: any): string => {
  const issuer =
    typeof document?.issuer === 'string'
      ? document?.issuer
      : document?.issuer?.id
  return issuer?.toUpperCase() || 'Unknown'
}

/**
 * A presentation has no issuer of its own: it is asserted by the HOLDER, and each embedded
 * credential carries its own issuer. Show the holder, since that is who is making the claim
 * to the verifier. (The embedded issuers are still checked — the W3CVpIssuerIdentity
 * fragment resolves every one of them.)
 */
const getPresentationHolder = (document: any): string => {
  const holder =
    typeof document?.holder === 'string'
      ? document.holder
      : document?.holder?.id
  return holder?.toUpperCase() || 'Unknown'
}

const getIssuerName = (
  document: any,
  verificationStatus: VerificationFragment[]
): string => {
  if (!document) return 'Unknown'

  if (isVerifiablePresentation(document)) {
    return getPresentationHolder(document)
  }

  if (isWrappedV2Document(document)) {
    return getV2FormattedDomainNames(verificationStatus)
  } else if (isWrappedV3Document(document)) {
    return getV3IdentityVerificationText(document)
  } else if (vc.isSignedDocument(document)) {
    return getW3CIdentityVerificationText(document)
  }

  return 'Unknown'
}

const detectTokenRegistryVersion = async (
  document: any,
  provider: any
): Promise<TokenRegistryVersion> => {
  if (!document || !isTransferableRecord(document) || !provider) {
    return null
  }

  try {
    // Extract registry address and token ID from document using trustvc utilities
    const registryAddress = getTokenRegistryAddress(document)
    const tokenId = getTokenId(document)

    if (!registryAddress) {
      return null
    }

    // Check if it's Title Escrow V4
    const isTitleEscrowV4 = await isTitleEscrowVersion({
      tokenRegistryAddress: registryAddress,
      tokenId,
      versionInterface: TitleEscrowInterface.V4,
      provider,
    })

    if (isTitleEscrowV4) {
      return 'V4'
    }

    // If not V4, assume V5 for transferable documents
    return 'V5'
  } catch (error) {
    console.error('Error detecting token registry version:', error)
    return null
  }
}

const getDocumentTags = (
  document: any,
  tokenRegistryVersion: TokenRegistryVersion,
  isObligationDocument = false
): string[] => {
  if (!document) return []

  const tags: string[] = []

  // A presentation is a bundle, not a credential: the credential-shaped checks below
  // (obligation, transferable, OA/W3C schema) describe a credential, not the envelope, so
  // this returns early rather than falling through them.
  if (isVerifiablePresentation(document)) {
    // Version-tagged like a credential is; trustvc always writes a v2 envelope, but read
    // it from the document rather than assuming.
    tags.push(`W3C VP ${getW3CVersionLabel(document)}`)
    const count = getPresentationCredentials(document).length
    tags.push(`${count} Credential${count === 1 ? '' : 's'}`)
    return tags
  }

  if (isObligationDocument) {
    tags.push('Obligation')
    tags.push('Negotiable')
  } else if (isTransferableRecord(document)) {
    tags.push('Transferable')
    tags.push('Negotiable')
  }

  // Determine document schema type
  const isOAV2 =
    isRawV2Document(document) ||
    isSignedWrappedV2Document(document) ||
    isWrappedV2Document(document)
  const isOAV3 =
    isRawV3Document(document) ||
    isSignedWrappedV3Document(document) ||
    isWrappedV3Document(document)
  const isW3CVC = vc.isSignedDocument(document) || vc.isRawDocument(document)
  const isW3CVCVersion2_0 = isW3CVC ? vc.isSignedDocumentV2_0(document) : null

  // Add document schema tag
  if (isOAV2 || isOAV3) {
    tags.push('OA')
  } else if (isW3CVC) {
    if (isW3CVCVersion2_0) {
      tags.push('W3C VC V2.0')
    } else {
      tags.push('W3C VC V1.1')
    }
  }

  // Add token registry version tag if available (classic ETR only)
  if (!isObligationDocument) {
    if (tokenRegistryVersion === 'V4') {
      tags.push('TR V4')
    } else if (tokenRegistryVersion === 'V5') {
      tags.push('TR V5')
    }
  }

  return tags
}

const getDocumentData = (wrappedDocument: any) => {
  if (
    vc.isSignedDocument(wrappedDocument) ||
    vc.isRawDocument(wrappedDocument)
  ) {
    return wrappedDocument as any
  }
  // A presentation is neither a signed credential nor a wrapped OA document, so it would
  // otherwise fall through to OpenAttestation's getDocumentData — which THROWS on one,
  // failing the whole verification run rather than just this lookup. The presentation is
  // its own data.
  if (isVerifiablePresentation(wrappedDocument)) {
    return wrappedDocument as any
  }
  return getDocumentDataFromWrappedDocument(wrappedDocument)
}
export const makeExplorerAddressURL = (
  address: string,
  chainId: string
): string | undefined => {
  const chainInfo = SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]
  if (!chainInfo?.explorerUrl) {
    return undefined
  }
  return new URL(`/address/${address}`, chainInfo.explorerUrl).href
}

export const useVerify = (): UseVerifyReturn => {
  const verificationIdRef = useRef(0)
  const {
    setKeyId: setKeyIdContext,
    setTokenRegistryVersion: setTokenRegistryVersionContext,
    setTokenId: setTokenIdContext,
    setTokenRegistryAddress: setTokenRegistryAddressContext,
    setIsObligation: setIsObligationContext,
  } = useDocumentContext()
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle')
  const [fragments, setFragments] = useState<VerificationFragment[]>([])
  const [fileName, setFileName] = useState('')
  const [errorType, setErrorType] = useState<VerifyErrorType>(
    errorMessages.TYPES.VERIFICATION_ERROR
  )
  // Optional verbatim error body (overrides the typed message) — used for the W3C
  // TransferableRecords status reasons. undefined → fall back to the typed message.
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )
  const [dragActive, setDragActive] = useState(false)
  const [pendingDoc, setPendingDoc] = useState<unknown>(null)
  const [verifiedChainId, setVerifiedChainId] = useState<string>('')
  const [issuerName, setIssuerName] = useState<string>('')
  const [isTransferable, setIsTransferable] = useState<boolean>(false)
  const [isObligation, setIsObligation] = useState<boolean>(false)
  const [tokenRegistryVersion, setTokenRegistryVersion] =
    useState<TokenRegistryVersion>(null)
  const [tokenRegistryAddress, setTokenRegistryAddress] = useState<
    string | undefined
  >(undefined)
  const [tags, setTags] = useState<string[]>([])
  const [tokenId, setTokenId] = useState<string | undefined>(undefined)
  const [keyId, setKeyId] = useState<string | undefined>(undefined)
  const [rawDocument, setRawDocument] = useState<unknown>(undefined)
  const [isExpired, setIsExpired] = useState<boolean>(false)
  const runVerification = async (
    doc: unknown,
    chainId: string | null | undefined,
    currentId: number,
    verificationFileName?: string
  ) => {
    const isStale = () => currentId !== verificationIdRef.current

    const options: { rpcProviderUrl?: string } = {}
    const rpcUrl = getRpcUrl(chainId ?? '1')
    if (rpcUrl) options.rpcProviderUrl = rpcUrl

    const results = (await verifyDocument(
      doc as any,
      options
    )) as VerificationFragment[]

    if (isStale()) return

    setFragments(results)

    const types = [...new Set(results.map(f => f.type))]
    const groupStatuses = types.map(type => computeGroupStatus(results, type))
    const hasAtLeastOneValid = groupStatuses.some(s => s === 'VALID')
    const hasNoInvalid = groupStatuses.every(s => s !== 'INVALID')
    const isValid = hasAtLeastOneValid && hasNoInvalid
    const errorType = !isValid ? getErrorTypeFromFragments(results) : undefined
    if (!isValid) {
      // `doc` lets the copy name a failing credential the way the tabs label it.
      const errorMessage = getErrorMessageFromFragments(results, doc)
      setErrorType(errorType!)
      setErrorMessage(errorMessage)
      captureVerificationInvalid({
        doc,
        fileName: (verificationFileName ?? fileName) || undefined,
        chainId,
        errorType: errorType!,
        errorMessage,
        fragments: results,
      })
    }

    // Compute issuer name
    const issuer = getIssuerName(doc, results)
    setIssuerName(issuer)

    // Check if document is transferable (classic ETR) or obligation (BoE)
    const obligation = isObligationRecord(doc as any)
    const transferable = !obligation && isTransferableRecord(doc as any)
    setIsTransferable(transferable)
    setIsObligation(obligation)
    setIsObligationContext(obligation)

    // Extract registry address (tokenRegistry or obligationRegistry)
    const registryAddress = obligation
      ? getObligationRegistryAddress(doc as any)
      : transferable
        ? getTokenRegistryAddress(doc as any)
        : undefined
    setTokenRegistryAddress(registryAddress)
    setTokenRegistryAddressContext(registryAddress || null)

    const isExpired = getIsExpired(doc)
    setIsExpired(isExpired)

    //add code to fetch TokenId , keyId from the document
    const _keyId = getDocumentData(doc as any)?.id
    setKeyId(_keyId)
    setKeyIdContext(_keyId || null)

    if (transferable || obligation) {
      const _tokenId = getTokenId(doc as any)
      setTokenId(_tokenId)
      setTokenIdContext(_tokenId || null)
    } else {
      setTokenId(undefined)
      setTokenIdContext(null)
    }

    // Detect token registry version (async). Obligation registries are always V5-style.
    let trVersion: TokenRegistryVersion = null
    if (obligation) {
      trVersion = 'V5'
    } else if (transferable && rpcUrl) {
      try {
        // Create a simple provider for the detection
        const { ethers } = await import('ethers')
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
        trVersion = await detectTokenRegistryVersion(doc, provider)
      } catch (error) {
        console.error('Failed to detect token registry version:', error)
      }
    }

    if (isStale()) return

    setTokenRegistryVersion(trVersion)
    setTokenRegistryVersionContext(trVersion)

    // Compute document tags
    const documentTags = getDocumentTags(doc, trVersion, obligation)
    setTags(documentTags)

    setRawDocument(doc)
    setVerifiedChainId(chainId ?? '')
    setVerifyStatus(isValid ? 'valid' : 'invalid')

    captureVerificationBreadcrumb(
      isValid
        ? 'Verification completed (valid)'
        : 'Verification completed (invalid)',
      {
        chainId: chainId ?? undefined,
        fileName: (verificationFileName ?? fileName) || undefined,
      }
    )
    trackDocumentVerified(doc, results, isValid, issuer, errorType, {
      isExpired,
      isTransferable: transferable || obligation,
      tokenRegistryVersion: trVersion,
      chainId: chainId ?? null,
    })
  }

  const clearVerificationMetadata = () => {
    setVerifiedChainId('')
    setIssuerName('')
    setIsTransferable(false)
    setIsObligation(false)
    setTokenRegistryVersion(null)
    setTokenRegistryAddress(undefined)
    setTags([])
    setTokenId(undefined)
    setKeyId(undefined)
    setRawDocument(undefined)
    setErrorMessage(undefined)
    setTokenRegistryAddressContext(null)
    setTokenRegistryVersionContext(null)
    setTokenIdContext(null)
    setKeyIdContext(null)
    setIsObligationContext(false)
  }

  const processFile = async (
    file: File,
    source: DocumentDroppedSource = 'file_picker'
  ) => {
    const currentId = ++verificationIdRef.current
    setFileName(file.name)
    setVerifyStatus('verifying')
    setFragments([])
    setPendingDoc(null)
    clearVerificationMetadata()

    trackDocumentDropped(file.name, source)

    let parsedDoc: any
    try {
      const text = await file.text()
      parsedDoc = JSON.parse(text)
      // Prefer the document's own chain; fall back to its embedded network field
      // (getChainId ignores that for DNS-DID/DID docs, which can still use a
      // REVOCATION_STORE on that chain) before asking the user to pick one.
      const chainId = getChainId(parsedDoc) ?? getEmbeddedChainId(parsedDoc)

      if (!chainId && requiresNetworkSelection(parsedDoc)) {
        // Needs blockchain verification but has no chain anywhere — ask the user
        setPendingDoc(parsedDoc)
        setVerifyStatus('network-select')
        trackNetworkSelectionShown(parsedDoc)
        return
      }

      captureVerificationBreadcrumb('Verification started', {
        fileName: file.name,
        source: 'file',
      })
      await runVerification(parsedDoc, chainId, currentId, file.name)
    } catch (err) {
      if (currentId !== verificationIdRef.current) return
      const errType = getErrorTypeFromError(err)
      clearVerificationMetadata()
      setErrorType(errType)
      setVerifyStatus('error')
      captureVerificationException(err, {
        stage: 'processFile',
        fileName: file.name,
      })
      trackDocumentVerifyError(parsedDoc, errType)
    }
  }

  const handleNetworkConfirm = async (chainId: string) => {
    if (!pendingDoc) return
    const currentId = ++verificationIdRef.current
    setVerifyStatus('verifying')
    const docRef = pendingDoc
    trackNetworkSelected(chainId)
    try {
      captureVerificationBreadcrumb('Verification started', {
        fileName,
        source: 'file',
      })
      await runVerification(pendingDoc, chainId, currentId, fileName)
    } catch (err) {
      if (currentId !== verificationIdRef.current) return
      const errType = getErrorTypeFromError(err)
      clearVerificationMetadata()
      setErrorType(errType)
      setVerifyStatus('error')
      captureVerificationException(err, {
        stage: 'handleNetworkConfirm',
        fileName,
        chainId,
      })
      trackDocumentVerifyError(docRef, errType)
    } finally {
      setPendingDoc(null)
    }
  }

  const handleNetworkCancel = () => {
    trackNetworkSelectionCancelled()
    setVerifyStatus('idle')
    setFileName('')
    setPendingDoc(null)
    clearVerificationMetadata()
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], 'drop')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], 'file_picker')
      e.target.value = ''
    }
  }

  const loadDocument = async (
    doc: unknown,
    chainId: string | null | undefined,
    name: string,
    source: DocumentDroppedSource = 'url'
  ) => {
    const currentId = ++verificationIdRef.current
    setFileName(name)
    setVerifyStatus('verifying')
    setFragments([])
    setPendingDoc(null)
    clearVerificationMetadata()

    captureVerificationBreadcrumb('Verification started', {
      fileName: name,
      source: 'url',
    })
    trackDocumentDropped(name, source)

    try {
      await runVerification(doc, chainId, currentId, name)
    } catch (err) {
      if (currentId !== verificationIdRef.current) return
      const errType = getErrorTypeFromError(err)
      clearVerificationMetadata()
      setErrorType(errType)
      setVerifyStatus('error')
      captureVerificationException(err, {
        stage: 'loadDocument',
        fileName: name,
        chainId,
      })
      trackDocumentVerifyError(doc, errType)
    }
  }

  const handleReset = () => {
    trackVerificationReset()
    setVerifyStatus('idle')
    setFragments([])
    setFileName('')
    setErrorType(errorMessages.TYPES.VERIFICATION_ERROR)
    setPendingDoc(null)
    clearVerificationMetadata()
  }

  const getGroupStatus = (type: string) => computeGroupStatus(fragments, type)

  return {
    verifyStatus,
    fileName,
    errorType,
    errorMessage,
    dragActive,
    verifiedChainId,
    issuerName,
    isTransferable,
    isObligation,
    isExpired,
    tokenRegistryVersion,
    tokenRegistryAddress,
    tags,
    tokenId,
    keyId,
    rawDocument,
    getGroupStatus,
    handleDrag,
    handleDrop,
    handleFileInput,
    handleReset,
    handleNetworkConfirm,
    handleNetworkCancel,
    loadDocument,
  }
}
