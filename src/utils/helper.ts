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
  CHAIN_ID,
} from '@trustvc/trustvc'
import { utils } from 'ethers'
import { compareDesc, compareAsc } from 'date-fns'
import { getChainInfo, getChainInfoFromNetworkName } from './chain-utils'

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
  // A Verifiable Presentation is its own document data. Without this it falls through to
  // OpenAttestation's getDocumentData, which throws on a presentation and takes every
  // caller down with it (getIsExpired among them).
  if (isVerifiablePresentation(rawDocument)) {
    return rawDocument
  }
  return getDocumentData(rawDocument)
}

export const getIsExpired = (rawDocument: any): boolean => {
  const docData = getOpenAttestationData(rawDocument)
  const expirationDate = docData.expirationDate || docData.validUntil
  return !!(expirationDate && new Date(expirationDate) < new Date())
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

const isValidBase64 = (str: string): boolean => {
  try {
    if (!str) return false
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(str)) return false
    const decoded = atob(str)
    const reencoded = btoa(decoded)
    return reencoded === str
  } catch {
    return false
  }
}

export const isValidAttachmentData = (
  str: string,
  mimeType?: string
): boolean => {
  try {
    if (!isValidBase64(str)) return false

    if (mimeType === 'application/pdf') {
      try {
        const binaryString = atob(str)
        if (!binaryString.startsWith('%PDF-')) return false
        if (binaryString.length < 100) return false
        const hasXref =
          binaryString.includes('xref') || binaryString.includes('/Root')
        const hasTrailer =
          binaryString.includes('trailer') || binaryString.includes('startxref')
        if (!hasXref || !hasTrailer) return false
        return true
      } catch {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

export const getFileExtension = (
  filename: string,
  mimeType: string
): string => {
  if (filename) {
    const ext = filename.split('.').pop()?.toUpperCase()
    if (ext && ext !== filename.toUpperCase()) return ext
  }
  if (!mimeType) return 'FILE'
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

export const makeEtherscanAddressURL = (
  address: string,
  chainId: CHAIN_ID
): string => {
  const baseUrl = getChainInfo(chainId).explorerUrl
  return new URL(`/address/${address}`, baseUrl).href
}

export const isValidEndorseTransfer = (
  holder?: string,
  newHolder?: string,
  newOwner?: string
): boolean => {
  if (!newHolder || !newOwner) return false
  if (newHolder === holder) return false
  if (!isEthereumAddress(newHolder) || !isEthereumAddress(newOwner))
    return false

  return true
}

export const isEthereumAddress = (address: string): boolean => {
  return utils.isAddress(address)
}

export const convertSecondsToMinAndSec = (seconds: number): string => {
  const sec = seconds % 60
  return `${~~(seconds / 60)}:${sec < 10 ? `0${sec}` : sec}m`
}

export const getSortedByDateDesc = (items: any[]): any[] => {
  items.sort((a, b): number => {
    return compareDesc(new Date(a.attributes.date), new Date(b.attributes.date))
  })

  return items
}

export const getSortedByDateAsc = (items: any[]): any[] => {
  items.sort((a, b): number => {
    return compareAsc(new Date(a.attributes.date), new Date(b.attributes.date))
  })

  return items
}

// https://docs.netlify.com/forms/setup/#submit-javascript-rendered-forms-with-ajax
export const encode: any = (data: {
  [x: string]: string | number | boolean
}) => {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&')
}

export const addClassNameIfExist = (className?: string): string => {
  if (!className) {
    return ''
  }

  return className
}

/**
 * Takes a file path, i.e. "static/img/image.png" , and returns the file name, i.e. "image.png".
 *
 * @param filePath a string that represents the filePath i.e. "static/img/image.png"
 * @returns name of file i.e. "image.png"
 */
export const getFileName = (filePath: string): string => {
  return (
    filePath.match(/[A-Za-z0-9_.-]+\.[A-Za-z0-9]+$/)?.shift() ||
    filePath.match(/[A-Za-z0-9_.-]+$/)?.shift() ||
    filePath
  )
}

export const currentDateStr = (): string => {
  return new Date().toLocaleString('en-SG', {
    hour12: true,
    timeZoneName: 'short',
  })
}

export const isExternalLink = (url: string): boolean => {
  try {
    const currentHostname = location.hostname
    const urlHostname = new URL(url).hostname
    return currentHostname !== urlHostname
  } catch (error) {
    console.log(error)
    return false
  }
}

export const makeAddressURL = (address: string, network: string): string => {
  const explorerUrl = getChainInfoFromNetworkName(network).explorerUrl
  return new URL(`/address/${address}`, explorerUrl).href
}
interface GenerateFileName {
  fileName: string
  extension: string
  hasTimestamp?: boolean
}

export const generateFileName = ({
  fileName,
  extension,
  hasTimestamp,
}: GenerateFileName): string => {
  const timestamp = new Date().toISOString()
  const fileTimestamp = hasTimestamp ? `-${timestamp}` : ''
  return `${fileName}${fileTimestamp}.${extension}`
}

export const getFileSize = (jsonString: string): number => {
  if (!jsonString || !jsonString?.length) return 0
  const m = encodeURIComponent(jsonString).match(/%[89ABab]/g)
  return jsonString.length + (m ? m.length : 0)
}

/**
 * Whether trustvc's verifier will treat this document as a Verifiable Presentation.
 *
 * `vc.isRawPresentation` and `vc.isSignedPresentation` are the library's own predicates and
 * do the work for every well-formed document — they are mutually exclusive (raw = unsigned,
 * signed = has a holder proof), so answering "is this a presentation at all?" needs both.
 *
 * The shape check after them is NOT redundant. trustvc routes documents into its VP
 * verifier fragments with an internal, unexported predicate that looks only at
 * `type` + `verifiableCredential`, so it accepts two shapes the strict predicates reject:
 * a presentation with no `@context`, and one with an empty credential list — the latter
 * being a case its own W3CVpIssuerIdentity fragment reports on explicitly ("Presentation
 * contains no verifiable credentials"). If this predicate disagreed with that router, such
 * a document would be sent down the credential path, where getDocumentData throws and the
 * UI shows a generic failure instead of the verifier's actual finding.
 *
 * `proof` is deliberately not required, so an unsigned presentation is still recognised and
 * can be reported invalid rather than silently treated as a credential.
 */
export const isVerifiablePresentation = (rawDocument: unknown): boolean => {
  if (!rawDocument || typeof rawDocument !== 'object') return false
  if (
    vc.isRawPresentation(rawDocument) ||
    vc.isSignedPresentation(rawDocument)
  ) {
    return true
  }
  const { type, verifiableCredential } = rawDocument as {
    type?: string | string[]
    verifiableCredential?: unknown
  }
  const types = Array.isArray(type) ? type : [type]
  return (
    types.includes('VerifiablePresentation') &&
    verifiableCredential !== undefined
  )
}

/**
 * The credentials embedded in a presentation, always as an array — `verifiableCredential`
 * may be a single object or a list. Returns [] for anything that is not a presentation.
 */
export const getPresentationCredentials = (rawDocument: unknown): any[] => {
  if (!isVerifiablePresentation(rawDocument)) return []
  const credentials = (rawDocument as { verifiableCredential?: unknown })
    .verifiableCredential
  if (!credentials) return []
  return Array.isArray(credentials) ? credentials : [credentials]
}

/**
 * A short label for a credential's tab. Prefers the renderer template name, which is what
 * distinguishes one credential from another on screen; falls back to its `type` (minus the
 * generic `VerifiableCredential`), then to a 1-based position.
 */
export const getCredentialLabel = (credential: any, index: number): string => {
  const templateName = [credential?.renderMethod].flat()?.[0]?.templateName
  if (typeof templateName === 'string' && templateName.trim()) {
    return templateName.replace(/_/g, ' ')
  }
  const types = [credential?.type].flat().filter(Boolean) as string[]
  const specific = types.find(t => t !== 'VerifiableCredential')
  if (specific) return specific
  return `Credential ${index + 1}`
}

/** The VC Data Model 2.0 context URL — the first `@context` entry of a v2 document. */
const VC_V2_CONTEXT = 'https://www.w3.org/ns/credentials/v2'

/**
 * The data-model version label for a credential or presentation: 'V2.0' or 'V1.1'.
 *
 * `vc.isSignedDocumentV2_0` only answers this for signed CREDENTIALS, so it cannot classify
 * a presentation envelope; both are decided the same way, by the first `@context` entry.
 */
export const getW3CVersionLabel = (document: any): 'V2.0' | 'V1.1' => {
  const first = [document?.['@context']].flat()[0]
  return first === VC_V2_CONTEXT ? 'V2.0' : 'V1.1'
}

/**
 * The version tag shown against a credential embedded in a presentation, matching the tag
 * the single-document card shows for a standalone credential.
 */
export const getCredentialVersionTag = (credential: any): string =>
  `W3C VC ${getW3CVersionLabel(credential)}`

/**
 * A download filename for one credential inside a presentation.
 *
 * The renderer names its download after the file that was uploaded. Inside a presentation
 * that would name every credential after the whole VP — two tabs both saving as
 * `presentation.json`, each actually containing a different single credential. Qualify it
 * with the credential's label instead: `presentation-chafta-coo.json`.
 */
export const getCredentialFileName = (
  presentationFileName: string,
  credential: any,
  index: number
): string => {
  const base = (presentationFileName || 'presentation').replace(/\.json$/i, '')
  const slug = getCredentialLabel(credential, index)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}-${slug || `credential-${index + 1}`}.json`
}
