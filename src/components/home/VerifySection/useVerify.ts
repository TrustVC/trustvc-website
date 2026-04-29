import React, { useState, useRef } from 'react'
import {
  verifyDocument,
  getChainId,
  SUPPORTED_CHAINS,
  isTransferableRecord,
  isDocumentRevokable,
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
import { getRpcUrl, getIsExpired } from '../../../utils/helper'
import { useDocumentContext } from '../../common/contexts/DocumentContext'
import { type VerifyErrorType, getErrorTypeFromError } from './verifyErrorUtils'

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
  dragActive: boolean
  verifiedChainId?: string
  issuerName?: string
  isTransferable: boolean
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
 * Detect error type from verification fragments using @trustvc/trustvc library.
 * Returns the first error type, or VERIFICATION_ERROR as fallback.
 */
export const getErrorTypeFromFragments = (
  frags: VerificationFragment[]
): VerifyErrorType => {
  try {
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

const getIssuerName = (
  document: any,
  verificationStatus: VerificationFragment[]
): string => {
  if (!document) return 'Unknown'

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
  tokenRegistryVersion: TokenRegistryVersion
): string[] => {
  if (!document) return []

  const tags: string[] = []

  // Check if transferable - adds both Transferable and Negotiable tags
  const isTransferableDocument = isTransferableRecord(document)
  if (isTransferableDocument) {
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

  // Add token registry version tag if available
  if (tokenRegistryVersion === 'V4') {
    tags.push('TR V4')
  } else if (tokenRegistryVersion === 'V5') {
    tags.push('TR V5')
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
  } = useDocumentContext()
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle')
  const [fragments, setFragments] = useState<VerificationFragment[]>([])
  const [fileName, setFileName] = useState('')
  const [errorType, setErrorType] = useState<VerifyErrorType>(
    errorMessages.TYPES.VERIFICATION_ERROR
  )
  const [dragActive, setDragActive] = useState(false)
  const [pendingDoc, setPendingDoc] = useState<unknown>(null)
  const [verifiedChainId, setVerifiedChainId] = useState<string>('')
  const [issuerName, setIssuerName] = useState<string>('')
  const [isTransferable, setIsTransferable] = useState<boolean>(false)
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
    currentId: number
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
    if (!isValid) {
      setErrorType(getErrorTypeFromFragments(results))
    }

    // Compute issuer name
    const issuer = getIssuerName(doc, results)
    setIssuerName(issuer)

    // Check if document is transferable
    const transferable = isTransferableRecord(doc as any)
    setIsTransferable(transferable)

    // Extract token registry address
    const registryAddress = transferable
      ? getTokenRegistryAddress(doc as any)
      : undefined
    setTokenRegistryAddress(registryAddress)
    setTokenRegistryAddressContext(registryAddress || null)

    setIsExpired(getIsExpired(doc))

    //add code to fetch TokenId , keyId from the document
    const _keyId = getDocumentData(doc as any)?.id
    setKeyId(_keyId)
    setKeyIdContext(_keyId || null)

    if (transferable) {
      const _tokenId = getTokenId(doc as any)
      setTokenId(_tokenId)
      setTokenIdContext(_tokenId || null)
    } else {
      setTokenId(undefined)
      setTokenIdContext(null)
    }

    // Detect token registry version (async)
    let trVersion: TokenRegistryVersion = null
    if (transferable && rpcUrl) {
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
    const documentTags = getDocumentTags(doc, trVersion)
    setTags(documentTags)

    setRawDocument(doc)
    setVerifiedChainId(chainId ?? '')
    setVerifyStatus(isValid ? 'valid' : 'invalid')
  }

  const clearVerificationMetadata = () => {
    setVerifiedChainId('')
    setIssuerName('')
    setIsTransferable(false)
    setTokenRegistryVersion(null)
    setTokenRegistryAddress(undefined)
    setTags([])
    setTokenId(undefined)
    setKeyId(undefined)
    setRawDocument(undefined)
    setTokenRegistryAddressContext(null)
    setTokenRegistryVersionContext(null)
    setTokenIdContext(null)
    setKeyIdContext(null)
  }

  const processFile = async (file: File) => {
    const currentId = ++verificationIdRef.current
    setFileName(file.name)
    setVerifyStatus('verifying')
    setFragments([])
    setPendingDoc(null)
    clearVerificationMetadata()

    try {
      const text = await file.text()
      const doc = JSON.parse(text)
      const chainId = getChainId(doc)

      if (!chainId && (isTransferableRecord(doc) || isDocumentRevokable(doc))) {
        // Document needs blockchain verification but has no embedded chain — ask the user
        setPendingDoc(doc)
        setVerifyStatus('network-select')
        return
      }

      await runVerification(doc, chainId, currentId)
    } catch (err) {
      clearVerificationMetadata()
      setErrorType(getErrorTypeFromError(err))
      setVerifyStatus('error')
    }
  }

  const handleNetworkConfirm = async (chainId: string) => {
    if (!pendingDoc) return
    const currentId = ++verificationIdRef.current
    setVerifyStatus('verifying')
    try {
      await runVerification(pendingDoc, chainId, currentId)
    } catch (err) {
      clearVerificationMetadata()
      setErrorType(getErrorTypeFromError(err))
      setVerifyStatus('error')
    } finally {
      setPendingDoc(null)
    }
  }

  const handleNetworkCancel = () => {
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
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
      e.target.value = ''
    }
  }

  const handleReset = () => {
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
    dragActive,
    verifiedChainId,
    issuerName,
    isTransferable,
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
  }
}
