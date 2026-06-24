import ReactGA from 'react-ga4'
import {
  isWrappedV2Document,
  isWrappedV3Document,
  isRawV2Document,
  isRawV3Document,
  isSignedWrappedV2Document,
  isSignedWrappedV3Document,
  vc,
} from '@trustvc/trustvc'
import type { VerificationFragment } from '../components/home/VerifySection/useVerify'
import { ANALYTICS_EVENTS } from '../constants/analyticsEvents'

// ─── Types ───────────────────────────────────────────────────────────────────

export type DocumentSchema =
  | 'OA v2'
  | 'OA v3'
  | 'W3C VC V1.1'
  | 'W3C VC V2.0'
  | 'Unknown'

export type IssuerMethod = 'DNS-TXT' | 'DNS-DID' | 'DID:WEB' | 'Unknown'

export type SigningAlgorithm =
  | 'merkleroot2018'
  | 'BBS2023'
  | 'ECDSA2023'
  | 'Unknown'

export type VerificationResult = 'valid' | 'invalid'

// ─── GTM dataLayer types ──────────────────────────────────────────────────────

export interface GTMEvent {
  event: string
  [key: string]: unknown
}

declare global {
  interface Window {
    dataLayer: GTMEvent[]
  }
}

export type DocumentDroppedSource = 'drop' | 'file_picker' | 'url' | 'demo'

export type WalletType = 'metamask' | 'magic_link'

export interface DocumentDroppedEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.DOCUMENT_DROPPED
  environment: string
  file_name: string
  source: DocumentDroppedSource
}

export interface DocumentVerificationEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.DOCUMENT_VERIFICATION_COMPLETED
  environment: string
  document_schema: DocumentSchema
  document_type: DocumentSchema
  issuer_method: IssuerMethod
  issuer_identity: string
  signing_algorithm: SigningAlgorithm
  verification_result: VerificationResult
  error_code: string | undefined
  is_expired: boolean | undefined
  is_transferable: boolean | undefined
  token_registry_version: string | null | undefined
  chain_id: string | null | undefined
}

export interface NetworkSelectionShownEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.NETWORK_SELECTION_SHOWN
  environment: string
  document_schema: DocumentSchema
}

export interface NetworkSelectedEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.NETWORK_SELECTED
  environment: string
  chain_id: string
}

export interface NetworkSelectionCancelledEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.NETWORK_SELECTION_CANCELLED
  environment: string
}

export interface VerificationResetEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.VERIFICATION_RESET
  environment: string
}

export interface WalletConnectedEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.WALLET_CONNECTED
  environment: string
  wallet_type: WalletType
}

export interface WalletDisconnectedEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.WALLET_DISCONNECTED
  environment: string
  wallet_type: WalletType
}

export interface WalletConnectFailedEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.WALLET_CONNECT_FAILED
  environment: string
  wallet_type: WalletType
  error_code: string
}

export interface AssetActionInitiatedEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.ASSET_ACTION_INITIATED
  environment: string
  action: string
  chain_id: string | undefined
  token_registry_version: string | undefined
}

export interface AssetActionCompletedEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.ASSET_ACTION_COMPLETED
  environment: string
  action: string
  chain_id: string | undefined
}

export interface AssetActionFailedEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.ASSET_ACTION_FAILED
  environment: string
  action: string
  error_code: string
  chain_id: string | undefined
}

export interface SupportFormSubmittedEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.SUPPORT_FORM_SUBMITTED
  environment: string
  enquiry_type: string
}

export interface SupportFormFailedEvent extends GTMEvent {
  event: typeof ANALYTICS_EVENTS.SUPPORT_FORM_FAILED
  environment: string
  enquiry_type: string
  error_code: string
}

// ─── Fragment → label maps ────────────────────────────────────────────────────

/**
 * Maps DOCUMENT_INTEGRITY fragment names to signing algorithm labels.
 * Extend this map to support future signing suites without touching call sites.
 * Sourced from @trustvc/trustvc verifier implementations.
 */
const SIGNING_ALGORITHM_FRAGMENT_MAP: Readonly<
  Record<string, SigningAlgorithm>
> = {
  OpenAttestationHash: 'merkleroot2018',
  Bbs2023W3CSignatureIntegrity: 'BBS2023',
  EcdsaW3CSignatureIntegrity: 'ECDSA2023',
}

/** Maps ISSUER_IDENTITY fragment names to issuer method labels. */
const ISSUER_METHOD_FRAGMENT_MAP: Readonly<Record<string, IssuerMethod>> = {
  OpenAttestationDnsTxtIdentityProof: 'DNS-TXT',
  OpenAttestationDnsDidIdentityProof: 'DNS-DID',
  OpenAttestationDidIdentityProof: 'DID:WEB',
}

// ─── Detection helpers ────────────────────────────────────────────────────────

export const getDocumentSchema = (doc: unknown): DocumentSchema => {
  const d = doc as any
  if (
    isWrappedV2Document(d) ||
    isRawV2Document(d) ||
    isSignedWrappedV2Document(d)
  )
    return 'OA v2'
  if (
    isWrappedV3Document(d) ||
    isRawV3Document(d) ||
    isSignedWrappedV3Document(d)
  )
    return 'OA v3'
  if (vc.isSignedDocument(d) || vc.isRawDocument(d))
    return vc.isSignedDocumentV2_0(d) ? 'W3C VC V2.0' : 'W3C VC V1.1'
  return 'Unknown'
}

export const getIssuerMethod = (
  doc: unknown,
  frags: VerificationFragment[]
): IssuerMethod => {
  // OA: derive from the identity proof fragment that actually ran (not skipped)
  const identityFrag = frags.find(
    f => f.type === 'ISSUER_IDENTITY' && f.status !== 'SKIPPED'
  )
  if (identityFrag) {
    const method = ISSUER_METHOD_FRAGMENT_MAP[identityFrag.name]
    if (method) return method
  }
  // W3C VC: infer from the issuer DID method
  const d = doc as any
  if (vc.isSignedDocument(d) || vc.isRawDocument(d)) {
    const issuer = typeof d?.issuer === 'string' ? d.issuer : d?.issuer?.id
    if (typeof issuer === 'string' && issuer.startsWith('did:'))
      return 'DID:WEB'
  }
  return 'Unknown'
}

export const getSigningAlgorithm = (
  doc: unknown,
  frags: VerificationFragment[]
): SigningAlgorithm => {
  // OA v2/v3 always use SHA3 Merkle proof — no need to inspect fragments
  const d = doc as any
  if (
    isWrappedV2Document(d) ||
    isSignedWrappedV2Document(d) ||
    isRawV2Document(d)
  )
    return 'merkleroot2018'
  if (
    isWrappedV3Document(d) ||
    isSignedWrappedV3Document(d) ||
    isRawV3Document(d)
  )
    return 'merkleroot2018'

  // W3C VC: identify from the active DOCUMENT_INTEGRITY verifier fragment
  const activeFragment = frags.find(
    f =>
      f.type === 'DOCUMENT_INTEGRITY' &&
      f.status !== 'SKIPPED' &&
      f.name in SIGNING_ALGORITHM_FRAGMENT_MAP
  )
  return activeFragment
    ? SIGNING_ALGORITHM_FRAGMENT_MAP[activeFragment.name]
    : 'Unknown'
}

// ─── GTM ─────────────────────────────────────────────────────────────────────

/**
 * Pushes an event to window.dataLayer only — no external calls are made here.
 * GTM (if loaded) reads from dataLayer and forwards events per its own config.
 * Events pushed before GTM loads are queued and replayed when GTM initialises.
 * Safe to call from any context: silently no-ops in SSR, never throws.
 */
export const pushGTMEvent = (eventData: GTMEvent): void => {
  try {
    if (typeof window === 'undefined') return
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push(eventData)
  } catch {
    // Analytics failures must never affect the application
  }
}

// ─── GA4 ─────────────────────────────────────────────────────────────────────

// When GTM is configured it forwards events to GA4 via its own tags — sending
// directly to GA4 as well would double-count every event, including the
// automatic page_view fired by ReactGA.initialize. Only use the GA4 direct
// channel when GTM is absent.
const GTM_CONFIGURED = Boolean(import.meta.env.VITE_GTM_CONTAINER_ID)

let ga4Initialized = false

export const initGA4 = (tagId: string): void => {
  if (!tagId || ga4Initialized || GTM_CONFIGURED) return
  try {
    ReactGA.initialize(tagId)
    ga4Initialized = true
  } catch {
    // Analytics failures must never affect the application
  }
}

const pushGA4Event = (
  eventName: string,
  params: Record<string, unknown>
): void => {
  if (!ga4Initialized) return
  try {
    ReactGA.event(eventName, params as any)
  } catch {
    // Analytics failures must never affect the application
  }
}

// ─── Internal: fire to both channels ─────────────────────────────────────────

const trackEvent = (payload: GTMEvent): void => {
  pushGTMEvent(payload)
  if (!GTM_CONFIGURED) {
    const { event: eventName, ...params } = payload
    pushGA4Event(eventName, params)
  }
}

// ─── Environment ─────────────────────────────────────────────────────────────

const ENVIRONMENT =
  (import.meta.env.VITE_PLATFORM as string | undefined) ?? 'local'

// ─── Event builders ───────────────────────────────────────────────────────────

export const buildDroppedEvent = (
  fileName: string,
  source: DocumentDroppedSource = 'file_picker'
): DocumentDroppedEvent => ({
  event: ANALYTICS_EVENTS.DOCUMENT_DROPPED,
  environment: ENVIRONMENT,
  file_name: fileName,
  source,
  // Explicitly clear verification fields so GTM doesn't carry stale values
  // from the previous document_verification_completed event into this one.
  verification_result: undefined,
  issuer_identity: undefined,
  document_schema: undefined,
  document_type: undefined,
  issuer_method: undefined,
  signing_algorithm: undefined,
  error_code: undefined,
  is_expired: undefined,
  is_transferable: undefined,
  token_registry_version: undefined,
  chain_id: undefined,
})

export const buildVerificationEvent = (
  doc: unknown,
  frags: VerificationFragment[],
  isValid: boolean,
  issuerIdentity: string,
  errorCode?: string,
  extras?: {
    isExpired?: boolean
    isTransferable?: boolean
    tokenRegistryVersion?: string | null
    chainId?: string | null
  }
): DocumentVerificationEvent => {
  const schema = getDocumentSchema(doc)
  return {
    event: ANALYTICS_EVENTS.DOCUMENT_VERIFICATION_COMPLETED,
    environment: ENVIRONMENT,
    document_schema: schema,
    document_type: schema,
    issuer_method: getIssuerMethod(doc, frags),
    issuer_identity: issuerIdentity || 'Unknown',
    signing_algorithm: getSigningAlgorithm(doc, frags),
    verification_result: isValid ? 'valid' : 'invalid',
    error_code: errorCode,
    is_expired: extras?.isExpired,
    is_transferable: extras?.isTransferable,
    token_registry_version: extras?.tokenRegistryVersion,
    chain_id: extras?.chainId,
  }
}

// ─── Public tracking API ──────────────────────────────────────────────────────

/**
 * Fired when a user drops or selects a file for verification.
 * Captures drop intent — before parsing or verification begins.
 */
export const trackDocumentDropped = (
  fileName: string,
  source: DocumentDroppedSource = 'file_picker'
): void => {
  try {
    trackEvent(buildDroppedEvent(fileName, source))
  } catch {
    // Analytics failures must never affect the application
  }
}

/**
 * Fired when verification completes (valid or invalid).
 * Captures schema, issuer method, identity, signing algorithm, result, and error code.
 */
export const trackDocumentVerified = (
  doc: unknown,
  frags: VerificationFragment[],
  isValid: boolean,
  issuerIdentity: string,
  errorCode?: string,
  extras?: {
    isExpired?: boolean
    isTransferable?: boolean
    tokenRegistryVersion?: string | null
    chainId?: string | null
  }
): void => {
  try {
    trackEvent(
      buildVerificationEvent(
        doc,
        frags,
        isValid,
        issuerIdentity,
        errorCode,
        extras
      )
    )
  } catch {
    // Analytics failures must never affect the application
  }
}

/**
 * Fired when an exception is thrown before fragments are available
 * (parse error, network error, etc.). `doc` may be undefined when the
 * file could not be parsed as JSON.
 */
export const trackDocumentVerifyError = (
  doc: unknown | undefined,
  errorCode: string
): void => {
  try {
    const schema = doc != null ? getDocumentSchema(doc) : 'Unknown'
    const algo = doc != null ? getSigningAlgorithm(doc, []) : 'Unknown'
    trackEvent({
      event: ANALYTICS_EVENTS.DOCUMENT_VERIFICATION_COMPLETED,
      environment: ENVIRONMENT,
      document_schema: schema,
      document_type: schema,
      issuer_method: 'Unknown',
      issuer_identity: 'Unknown',
      signing_algorithm: algo,
      verification_result: 'invalid',
      error_code: errorCode,
      is_expired: undefined,
      is_transferable: undefined,
      token_registry_version: undefined,
      chain_id: undefined,
    })
  } catch {
    // Analytics failures must never affect the application
  }
}

export const trackNetworkSelectionShown = (doc: unknown): void => {
  try {
    trackEvent({
      event: ANALYTICS_EVENTS.NETWORK_SELECTION_SHOWN,
      environment: ENVIRONMENT,
      document_schema: getDocumentSchema(doc),
    })
  } catch {
    // Analytics failures must never affect the application
  }
}

export const trackNetworkSelected = (chainId: string): void => {
  try {
    trackEvent({
      event: ANALYTICS_EVENTS.NETWORK_SELECTED,
      environment: ENVIRONMENT,
      chain_id: chainId,
    })
  } catch {
    // Analytics failures must never affect the application
  }
}

export const trackNetworkSelectionCancelled = (): void => {
  try {
    trackEvent({
      event: ANALYTICS_EVENTS.NETWORK_SELECTION_CANCELLED,
      environment: ENVIRONMENT,
    })
  } catch {
    // Analytics failures must never affect the application
  }
}

export const trackVerificationReset = (): void => {
  try {
    trackEvent({
      event: ANALYTICS_EVENTS.VERIFICATION_RESET,
      environment: ENVIRONMENT,
    })
  } catch {
    // Analytics failures must never affect the application
  }
}

export const trackWalletConnected = (walletType: WalletType): void => {
  try {
    trackEvent({
      event: ANALYTICS_EVENTS.WALLET_CONNECTED,
      environment: ENVIRONMENT,
      wallet_type: walletType,
    })
  } catch {
    // Analytics failures must never affect the application
  }
}

export const trackWalletDisconnected = (walletType: WalletType): void => {
  try {
    trackEvent({
      event: ANALYTICS_EVENTS.WALLET_DISCONNECTED,
      environment: ENVIRONMENT,
      wallet_type: walletType,
    })
  } catch {
    // Analytics failures must never affect the application
  }
}

export const trackWalletConnectFailed = (
  walletType: WalletType,
  errorCode: string
): void => {
  try {
    trackEvent({
      event: ANALYTICS_EVENTS.WALLET_CONNECT_FAILED,
      environment: ENVIRONMENT,
      wallet_type: walletType,
      error_code: errorCode,
    })
  } catch {
    // Analytics failures must never affect the application
  }
}

export const trackAssetActionInitiated = (
  action: string,
  chainId?: string,
  tokenRegistryVersion?: string
): void => {
  try {
    trackEvent({
      event: ANALYTICS_EVENTS.ASSET_ACTION_INITIATED,
      environment: ENVIRONMENT,
      action,
      chain_id: chainId,
      token_registry_version: tokenRegistryVersion,
    })
  } catch {
    // Analytics failures must never affect the application
  }
}

export const trackAssetActionCompleted = (
  action: string,
  chainId?: string
): void => {
  try {
    trackEvent({
      event: ANALYTICS_EVENTS.ASSET_ACTION_COMPLETED,
      environment: ENVIRONMENT,
      action,
      chain_id: chainId,
    })
  } catch {
    // Analytics failures must never affect the application
  }
}

export const trackAssetActionFailed = (
  action: string,
  errorCode: string,
  chainId?: string
): void => {
  try {
    trackEvent({
      event: ANALYTICS_EVENTS.ASSET_ACTION_FAILED,
      environment: ENVIRONMENT,
      action,
      error_code: errorCode,
      chain_id: chainId,
    })
  } catch {
    // Analytics failures must never affect the application
  }
}

export const trackSupportFormSubmitted = (enquiryType: string): void => {
  try {
    trackEvent({
      event: ANALYTICS_EVENTS.SUPPORT_FORM_SUBMITTED,
      environment: ENVIRONMENT,
      enquiry_type: enquiryType,
      // Clear document fields that persist in GTM's dataLayer from prior events
      file_name: undefined,
      source: undefined,
      verification_result: undefined,
      issuer_identity: undefined,
      document_schema: undefined,
      document_type: undefined,
      issuer_method: undefined,
      signing_algorithm: undefined,
      error_code: undefined,
      is_expired: undefined,
      is_transferable: undefined,
      token_registry_version: undefined,
      chain_id: undefined,
    })
  } catch {
    // Analytics failures must never affect the application
  }
}

export const trackSupportFormFailed = (
  enquiryType: string,
  errorCode: string
): void => {
  try {
    trackEvent({
      event: ANALYTICS_EVENTS.SUPPORT_FORM_FAILED,
      environment: ENVIRONMENT,
      enquiry_type: enquiryType,
      error_code: errorCode,
      // Clear document fields that persist in GTM's dataLayer from prior events
      file_name: undefined,
      source: undefined,
      verification_result: undefined,
      issuer_identity: undefined,
      document_schema: undefined,
      document_type: undefined,
      issuer_method: undefined,
      signing_algorithm: undefined,
      is_expired: undefined,
      is_transferable: undefined,
      token_registry_version: undefined,
      chain_id: undefined,
    })
  } catch {
    // Analytics failures must never affect the application
  }
}
