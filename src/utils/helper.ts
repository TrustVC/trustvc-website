import {
  SUPPORTED_CHAINS,
  getDocumentData,
  getDataV2,
  isWrappedV2Document,
  isWrappedV3Document,
  isRawV2Document,
  isRawV3Document,
  vc,
  SignedVerifiableCredential,
} from '@trustvc/trustvc'

export const getRpcUrl = (chainId: string): string | null => {
  const chainEnvUrl = import.meta.env[`VITE_RPC_URL_${chainId}`]
  if (chainEnvUrl) return chainEnvUrl

  const chainDefaultUrl =
    SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]?.rpcUrl
  const safeChainUrl = chainDefaultUrl?.includes('undefined')
    ? null
    : chainDefaultUrl
  if (safeChainUrl) return safeChainUrl

  // Chain not recognised — return null to surface the issue
  return null
}

/**
 * Converts an unknown error to a user-friendly error message string
 * @param err - The error object (unknown type)
 * @param fallback - Default message if error cannot be parsed
 * @returns A user-friendly error message string
 */
export const toErrorMessage = (
  err: unknown,
  fallback = 'Verification failed. Please try again.'
): string => {
  if (err instanceof SyntaxError) {
    return 'Invalid file format. Please upload a valid TrustVC document.'
  }
  if (err instanceof Error) {
    return err.message
  }
  return fallback
}

/**
 * Formats an Ethereum address for display (shows first and last characters)
 * @param address - The full Ethereum address
 * @param prefixLength - Number of characters to show at start (default: 6)
 * @param suffixLength - Number of characters to show at end (default: 4)
 * @returns Formatted address string
 */
export const formatAddress = (
  address: string,
  prefixLength = 6,
  suffixLength = 4
): string => {
  if (!address || address.length < prefixLength + suffixLength) {
    return address
  }
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`
}

// ── Document helper types ──

export interface DocumentAttachment {
  filename: string
  data: string
  type: string
}

// ── Document helper functions ──

export const getTemplateSourceUrl = (rawDocument: any): string | undefined => {
  if (vc.isSignedDocument(rawDocument) || vc.isRawDocument(rawDocument)) {
    return [rawDocument.renderMethod]?.flat()?.[0]?.id
  } else if (isWrappedV2Document(rawDocument)) {
    const documentData = getDocumentData(rawDocument)
    return typeof (documentData as any)?.$template === 'object'
      ? (documentData as any).$template.url
      : undefined
  } else if (isWrappedV3Document(rawDocument)) {
    return (rawDocument as any).openAttestationMetadata?.template?.url
  }
  return undefined
}

export const getOpenAttestationData = (rawDocument: any): any => {
  if (vc.isSignedDocument(rawDocument) || vc.isRawDocument(rawDocument)) {
    return rawDocument
  }
  return getDocumentData(rawDocument)
}

export const getQRCodeLink = (rawDocument: any): string | undefined => {
  if (isRawV2Document(rawDocument) || isWrappedV2Document(rawDocument)) {
    const data = isWrappedV2Document(rawDocument)
      ? getDataV2(rawDocument)
      : rawDocument
    return (data as any)?.links?.self?.href
  } else if (isRawV3Document(rawDocument) || isWrappedV3Document(rawDocument)) {
    const data = rawDocument?.credentialSubject ?? rawDocument
    return (data as any)?.links?.self?.href
  } else if (
    vc.isSignedDocument(rawDocument) ||
    vc.isRawDocument(rawDocument)
  ) {
    return (rawDocument as SignedVerifiableCredential)?.qrCode?.uri
  }
  return undefined
}

export const getAttachments = (rawDocument: any): DocumentAttachment[] => {
  if (!rawDocument) return []

  if (isWrappedV2Document(rawDocument)) {
    const documentData = getDataV2(rawDocument)
    return (documentData as any)?.attachments ?? []
  } else if (isWrappedV3Document(rawDocument)) {
    return (
      (rawDocument as any)?.attachments?.map((a: any) => ({
        data: a.data,
        filename: a.fileName,
        type: a.mimeType,
      })) ?? []
    )
  } else if (
    vc.isSignedDocument(rawDocument) ||
    vc.isRawDocument(rawDocument)
  ) {
    return [(rawDocument as any)?.credentialSubject]
      .flat()
      .map((s: any) => s?.attachments)
      .filter(Boolean)
      .flat()
      .map((a: any) => ({
        data: a.data,
        filename: a.filename,
        type: a.mimeType,
      }))
  }
  return []
}

export const formatFileSize = (base64Data: string): string => {
  if (!base64Data) return ''
  const padding = (base64Data.match(/=+$/) || [''])[0].length
  const bytes = Math.ceil((base64Data.length * 3) / 4) - padding
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const getFileExtension = (
  filename: string,
  mimeType: string
): string => {
  if (filename) {
    const ext = filename.split('.').pop()?.toUpperCase()
    if (ext && ext !== filename.toUpperCase()) return ext
  }
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('png')) return 'PNG'
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPG'
  if (mimeType.includes('json') || mimeType.includes('openattestation'))
    return 'JSON'
  if (mimeType.includes('csv')) return 'CSV'
  if (mimeType.includes('xml')) return 'XML'
  if (mimeType.includes('text')) return 'TXT'
  return 'FILE'
}
