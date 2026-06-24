import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ReactGA from 'react-ga4'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-ga4', () => ({
  default: {
    initialize: vi.fn(),
    event: vi.fn(),
  },
}))

vi.mock('@trustvc/trustvc', async () => {
  return {
    isWrappedV2Document: vi.fn(),
    isWrappedV3Document: vi.fn(),
    isRawV2Document: vi.fn(),
    isRawV3Document: vi.fn(),
    isSignedWrappedV2Document: vi.fn(),
    isSignedWrappedV3Document: vi.fn(),
    vc: {
      isSignedDocument: vi.fn(),
      isRawDocument: vi.fn(),
      isSignedDocumentV2_0: vi.fn(),
    },
  }
})

// ─── Imports ──────────────────────────────────────────────────────────────────
// GTM_CONFIGURED and ENVIRONMENT are computed at analytics.ts module load.
// .env.test sets VITE_GTM_CONTAINER_ID= and VITE_PLATFORM=test so Vitest
// injects the correct values before any module evaluates.

import * as trustvc from '@trustvc/trustvc'
import type { VerificationFragmentType } from '../components/home/VerifySection/useVerify'
import {
  getDocumentSchema,
  getIssuerMethod,
  getSigningAlgorithm,
  pushGTMEvent,
  initGA4,
  buildDroppedEvent,
  buildVerificationEvent,
  trackDocumentDropped,
  trackDocumentVerified,
  trackDocumentVerifyError,
  trackNetworkSelectionShown,
  trackNetworkSelected,
  trackNetworkSelectionCancelled,
  trackVerificationReset,
  trackWalletConnected,
  trackWalletDisconnected,
  trackWalletConnectFailed,
  trackAssetActionInitiated,
  trackAssetActionFailed,
  trackSupportFormSubmitted,
  trackSupportFormFailed,
} from './analytics'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockAllFalse = () => {
  vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(false)
  vi.mocked(trustvc.isWrappedV3Document).mockReturnValue(false)
  vi.mocked(trustvc.isRawV2Document).mockReturnValue(false)
  vi.mocked(trustvc.isRawV3Document).mockReturnValue(false)
  vi.mocked(trustvc.isSignedWrappedV2Document).mockReturnValue(false)
  vi.mocked(trustvc.isSignedWrappedV3Document).mockReturnValue(false)
  vi.mocked(trustvc.vc.isSignedDocument).mockReturnValue(false)
  vi.mocked(trustvc.vc.isRawDocument).mockReturnValue(false)
  vi.mocked(trustvc.vc.isSignedDocumentV2_0).mockReturnValue(false)
}

const makeFragment = (
  name: string,
  type: VerificationFragmentType,
  status: 'VALID' | 'INVALID' | 'SKIPPED' | 'ERROR' = 'VALID'
) => ({ name, type, status, data: {} })

// All verification-related fields that GTM carries between events
const VERIFICATION_RESET_FIELDS = [
  'verification_result',
  'issuer_identity',
  'document_schema',
  'document_type',
  'issuer_method',
  'signing_algorithm',
  'error_code',
  'is_expired',
  'is_transferable',
  'token_registry_version',
  'chain_id',
]

const DOCUMENT_RESET_FIELDS = [
  'file_name',
  'source',
  ...VERIFICATION_RESET_FIELDS,
]

beforeEach(() => {
  window.dataLayer = []
  mockAllFalse()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

// ─── getDocumentSchema ────────────────────────────────────────────────────────

describe('getDocumentSchema', () => {
  it('returns OA v2 for wrapped v2 document', () => {
    vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(true)
    expect(getDocumentSchema({})).toBe('OA v2')
  })

  it('returns OA v2 for raw v2 document', () => {
    vi.mocked(trustvc.isRawV2Document).mockReturnValue(true)
    expect(getDocumentSchema({})).toBe('OA v2')
  })

  it('returns OA v2 for signed wrapped v2 document', () => {
    vi.mocked(trustvc.isSignedWrappedV2Document).mockReturnValue(true)
    expect(getDocumentSchema({})).toBe('OA v2')
  })

  it('returns OA v3 for wrapped v3 document', () => {
    vi.mocked(trustvc.isWrappedV3Document).mockReturnValue(true)
    expect(getDocumentSchema({})).toBe('OA v3')
  })

  it('returns OA v3 for raw v3 document', () => {
    vi.mocked(trustvc.isRawV3Document).mockReturnValue(true)
    expect(getDocumentSchema({})).toBe('OA v3')
  })

  it('returns W3C VC V2.0 for signed VC v2', () => {
    vi.mocked(trustvc.vc.isSignedDocument).mockReturnValue(true)
    vi.mocked(trustvc.vc.isSignedDocumentV2_0).mockReturnValue(true)
    expect(getDocumentSchema({})).toBe('W3C VC V2.0')
  })

  it('returns W3C VC V1.1 for signed VC v1', () => {
    vi.mocked(trustvc.vc.isSignedDocument).mockReturnValue(true)
    vi.mocked(trustvc.vc.isSignedDocumentV2_0).mockReturnValue(false)
    expect(getDocumentSchema({})).toBe('W3C VC V1.1')
  })

  it('returns W3C VC V1.1 for raw VC', () => {
    vi.mocked(trustvc.vc.isRawDocument).mockReturnValue(true)
    vi.mocked(trustvc.vc.isSignedDocumentV2_0).mockReturnValue(false)
    expect(getDocumentSchema({})).toBe('W3C VC V1.1')
  })

  it('returns Unknown for unrecognised document', () => {
    expect(getDocumentSchema({})).toBe('Unknown')
  })
})

// ─── getIssuerMethod ──────────────────────────────────────────────────────────

describe('getIssuerMethod', () => {
  it('returns DNS-TXT from DNS-TXT identity fragment', () => {
    const frags = [
      makeFragment('OpenAttestationDnsTxtIdentityProof', 'ISSUER_IDENTITY'),
    ]
    expect(getIssuerMethod({}, frags)).toBe('DNS-TXT')
  })

  it('returns DNS-DID from DNS-DID identity fragment', () => {
    const frags = [
      makeFragment('OpenAttestationDnsDidIdentityProof', 'ISSUER_IDENTITY'),
    ]
    expect(getIssuerMethod({}, frags)).toBe('DNS-DID')
  })

  it('returns DID:WEB from DID identity fragment', () => {
    const frags = [
      makeFragment('OpenAttestationDidIdentityProof', 'ISSUER_IDENTITY'),
    ]
    expect(getIssuerMethod({}, frags)).toBe('DID:WEB')
  })

  it('ignores SKIPPED identity fragments', () => {
    const frags = [
      makeFragment(
        'OpenAttestationDnsTxtIdentityProof',
        'ISSUER_IDENTITY',
        'SKIPPED'
      ),
    ]
    expect(getIssuerMethod({}, frags)).toBe('Unknown')
  })

  it('returns DID:WEB for W3C VC with did: issuer', () => {
    vi.mocked(trustvc.vc.isSignedDocument).mockReturnValue(true)
    const doc = { issuer: 'did:web:example.com' }
    expect(getIssuerMethod(doc, [])).toBe('DID:WEB')
  })

  it('returns Unknown when no fragments match', () => {
    expect(getIssuerMethod({}, [])).toBe('Unknown')
  })
})

// ─── getSigningAlgorithm ──────────────────────────────────────────────────────

describe('getSigningAlgorithm', () => {
  it('returns merkleroot2018 for OA v2 documents', () => {
    vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(true)
    expect(getSigningAlgorithm({}, [])).toBe('merkleroot2018')
  })

  it('returns merkleroot2018 for OA v3 documents', () => {
    vi.mocked(trustvc.isWrappedV3Document).mockReturnValue(true)
    expect(getSigningAlgorithm({}, [])).toBe('merkleroot2018')
  })

  it('returns BBS2023 from BBS integrity fragment', () => {
    const frags = [
      makeFragment('Bbs2023W3CSignatureIntegrity', 'DOCUMENT_INTEGRITY'),
    ]
    expect(getSigningAlgorithm({}, frags)).toBe('BBS2023')
  })

  it('returns ECDSA2023 from ECDSA integrity fragment', () => {
    const frags = [
      makeFragment('EcdsaW3CSignatureIntegrity', 'DOCUMENT_INTEGRITY'),
    ]
    expect(getSigningAlgorithm({}, frags)).toBe('ECDSA2023')
  })

  it('ignores SKIPPED integrity fragments', () => {
    const frags = [
      makeFragment(
        'Bbs2023W3CSignatureIntegrity',
        'DOCUMENT_INTEGRITY',
        'SKIPPED'
      ),
    ]
    expect(getSigningAlgorithm({}, frags)).toBe('Unknown')
  })

  it('returns Unknown for unrecognised document with no fragments', () => {
    expect(getSigningAlgorithm({}, [])).toBe('Unknown')
  })
})

// ─── pushGTMEvent ─────────────────────────────────────────────────────────────

describe('pushGTMEvent', () => {
  it('pushes event to window.dataLayer', () => {
    pushGTMEvent({ event: 'TEST_EVENT', foo: 'bar' })
    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0]).toEqual({ event: 'TEST_EVENT', foo: 'bar' })
  })

  it('initialises dataLayer if absent', () => {
    delete (window as any).dataLayer
    pushGTMEvent({ event: 'INIT_TEST' })
    expect(window.dataLayer).toBeDefined()
    expect(window.dataLayer[0].event).toBe('INIT_TEST')
  })

  it('does not throw when window is undefined (SSR-like)', () => {
    const originalWindow = global.window
    // @ts-expect-error simulating SSR
    delete global.window
    expect(() => pushGTMEvent({ event: 'SSR' })).not.toThrow()
    global.window = originalWindow
  })
})

// ─── initGA4 ─────────────────────────────────────────────────────────────────

describe('initGA4', () => {
  it('calls ReactGA.initialize with the tag id', () => {
    initGA4('G-TEST123')
    expect(vi.mocked(ReactGA.initialize)).toHaveBeenCalledWith('G-TEST123')
  })

  it('is safe to call multiple times (idempotent)', () => {
    expect(() => {
      initGA4('G-TEST123')
      initGA4('G-TEST123')
    }).not.toThrow()
  })

  it('does nothing for empty tag id', () => {
    initGA4('')
    expect(vi.mocked(ReactGA.initialize)).not.toHaveBeenCalled()
  })
})

// ─── buildDroppedEvent ────────────────────────────────────────────────────────

describe('buildDroppedEvent', () => {
  it('includes file_name and default source', () => {
    const evt = buildDroppedEvent('test.json')
    expect(evt.event).toBe('DOCUMENT_DROPPED')
    expect(evt.file_name).toBe('test.json')
    expect(evt.source).toBe('file_picker')
  })

  it('uses the provided source', () => {
    expect(buildDroppedEvent('a.json', 'drop').source).toBe('drop')
    expect(buildDroppedEvent('b.json', 'url').source).toBe('url')
    expect(buildDroppedEvent('c.json', 'demo').source).toBe('demo')
  })

  it('includes environment', () => {
    const evt = buildDroppedEvent('x.json', 'file_picker')
    expect(evt.environment).toBeDefined()
  })

  it('explicitly resets all verification fields to undefined to clear GTM state', () => {
    const evt = buildDroppedEvent('test.json') as Record<string, unknown>
    for (const field of VERIFICATION_RESET_FIELDS) {
      expect(evt[field]).toBeUndefined()
      // The key must be present (explicit undefined) so GTM clears stale values
      expect(Object.prototype.hasOwnProperty.call(evt, field)).toBe(true)
    }
  })
})

// ─── buildVerificationEvent ───────────────────────────────────────────────────

describe('buildVerificationEvent', () => {
  it('builds a valid event payload', () => {
    vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(true)
    const frags = [
      makeFragment('OpenAttestationDnsTxtIdentityProof', 'ISSUER_IDENTITY'),
    ]
    const evt = buildVerificationEvent({}, frags, true, 'dns-name.com')
    expect(evt.event).toBe('DOCUMENT_VERIFICATION_COMPLETED')
    expect(evt.verification_result).toBe('valid')
    expect(evt.document_schema).toBe('OA v2')
    expect(evt.issuer_method).toBe('DNS-TXT')
    expect(evt.issuer_identity).toBe('dns-name.com')
    expect(evt.signing_algorithm).toBe('merkleroot2018')
    expect(evt.error_code).toBeUndefined()
  })

  it('sets verification_result to invalid', () => {
    const evt = buildVerificationEvent({}, [], false, 'id.com', 'HASH_ERROR')
    expect(evt.verification_result).toBe('invalid')
    expect(evt.error_code).toBe('HASH_ERROR')
  })

  it('includes extras when provided', () => {
    const evt = buildVerificationEvent({}, [], true, 'id.com', undefined, {
      isExpired: true,
      isTransferable: false,
      tokenRegistryVersion: 'V5',
      chainId: '1',
    })
    expect(evt.is_expired).toBe(true)
    expect(evt.is_transferable).toBe(false)
    expect(evt.token_registry_version).toBe('V5')
    expect(evt.chain_id).toBe('1')
  })

  it('uses Unknown for empty issuer identity', () => {
    const evt = buildVerificationEvent({}, [], true, '')
    expect(evt.issuer_identity).toBe('Unknown')
  })
})

// ─── trackDocumentDropped ─────────────────────────────────────────────────────

describe('trackDocumentDropped', () => {
  it('pushes DOCUMENT_DROPPED to dataLayer with correct source', () => {
    trackDocumentDropped('doc.json', 'drop')
    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0].event).toBe('DOCUMENT_DROPPED')
    expect(window.dataLayer[0].file_name).toBe('doc.json')
    expect(window.dataLayer[0].source).toBe('drop')
  })

  it('defaults source to file_picker', () => {
    trackDocumentDropped('doc.json')
    expect(window.dataLayer[0].source).toBe('file_picker')
  })

  it('resets all verification fields to undefined in the dataLayer push', () => {
    trackDocumentDropped('doc.json', 'drop')
    const evt = window.dataLayer[0] as Record<string, unknown>
    for (const field of VERIFICATION_RESET_FIELDS) {
      expect(Object.prototype.hasOwnProperty.call(evt, field)).toBe(true)
      expect(evt[field]).toBeUndefined()
    }
  })

  it('never throws', () => {
    expect(() => trackDocumentDropped(null as any)).not.toThrow()
  })
})

// ─── trackDocumentVerified ────────────────────────────────────────────────────

describe('trackDocumentVerified', () => {
  it('pushes DOCUMENT_VERIFICATION_COMPLETED with valid result', () => {
    vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(true)
    const frags = [
      makeFragment('OpenAttestationDnsTxtIdentityProof', 'ISSUER_IDENTITY'),
    ]
    trackDocumentVerified({}, frags, true, 'issuer.com')
    expect(window.dataLayer[0].event).toBe('DOCUMENT_VERIFICATION_COMPLETED')
    expect(window.dataLayer[0].verification_result).toBe('valid')
  })

  it('passes extras to the event', () => {
    trackDocumentVerified({}, [], true, 'id.com', undefined, {
      isExpired: false,
      isTransferable: true,
      tokenRegistryVersion: 'V4',
      chainId: '137',
    })
    expect(window.dataLayer[0].is_transferable).toBe(true)
    expect(window.dataLayer[0].chain_id).toBe('137')
    expect(window.dataLayer[0].token_registry_version).toBe('V4')
  })

  it('never throws', () => {
    expect(() => trackDocumentVerified(null as any, [], true, '')).not.toThrow()
  })
})

// ─── trackDocumentVerifyError ─────────────────────────────────────────────────

describe('trackDocumentVerifyError', () => {
  it('pushes invalid DOCUMENT_VERIFICATION_COMPLETED with error_code', () => {
    trackDocumentVerifyError(undefined, 'PARSE_ERROR')
    const evt = window.dataLayer[0]
    expect(evt.event).toBe('DOCUMENT_VERIFICATION_COMPLETED')
    expect(evt.verification_result).toBe('invalid')
    expect(evt.error_code).toBe('PARSE_ERROR')
    expect(evt.document_schema).toBe('Unknown')
  })

  it('detects schema when doc is provided', () => {
    vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(true)
    trackDocumentVerifyError({}, 'NETWORK_ERROR')
    expect(window.dataLayer[0].document_schema).toBe('OA v2')
  })

  it('never throws', () => {
    expect(() => trackDocumentVerifyError(null as any, 'ERR')).not.toThrow()
  })
})

// ─── trackNetworkSelectionShown ───────────────────────────────────────────────

describe('trackNetworkSelectionShown', () => {
  it('pushes NETWORK_SELECTION_SHOWN with document_schema', () => {
    vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(true)
    trackNetworkSelectionShown({})
    expect(window.dataLayer[0].event).toBe('NETWORK_SELECTION_SHOWN')
    expect(window.dataLayer[0].document_schema).toBe('OA v2')
  })

  it('never throws', () => {
    expect(() => trackNetworkSelectionShown(null as any)).not.toThrow()
  })
})

// ─── trackNetworkSelected ─────────────────────────────────────────────────────

describe('trackNetworkSelected', () => {
  it('pushes NETWORK_SELECTED with chain_id', () => {
    trackNetworkSelected('137')
    expect(window.dataLayer[0].event).toBe('NETWORK_SELECTED')
    expect(window.dataLayer[0].chain_id).toBe('137')
  })

  it('never throws', () => {
    expect(() => trackNetworkSelected('')).not.toThrow()
  })
})

// ─── trackNetworkSelectionCancelled ──────────────────────────────────────────

describe('trackNetworkSelectionCancelled', () => {
  it('pushes NETWORK_SELECTION_CANCELLED', () => {
    trackNetworkSelectionCancelled()
    expect(window.dataLayer[0].event).toBe('NETWORK_SELECTION_CANCELLED')
  })
})

// ─── trackVerificationReset ───────────────────────────────────────────────────

describe('trackVerificationReset', () => {
  it('pushes VERIFICATION_RESET', () => {
    trackVerificationReset()
    expect(window.dataLayer[0].event).toBe('VERIFICATION_RESET')
  })
})

// ─── trackWalletConnected ─────────────────────────────────────────────────────

describe('trackWalletConnected', () => {
  it('pushes WALLET_CONNECTED with metamask wallet_type', () => {
    trackWalletConnected('metamask')
    expect(window.dataLayer[0].event).toBe('WALLET_CONNECTED')
    expect(window.dataLayer[0].wallet_type).toBe('metamask')
  })

  it('pushes WALLET_CONNECTED with magic_link wallet_type', () => {
    trackWalletConnected('magic_link')
    expect(window.dataLayer[0].wallet_type).toBe('magic_link')
  })
})

// ─── trackWalletDisconnected ──────────────────────────────────────────────────

describe('trackWalletDisconnected', () => {
  it('pushes WALLET_DISCONNECTED with correct wallet_type', () => {
    trackWalletDisconnected('metamask')
    expect(window.dataLayer[0].event).toBe('WALLET_DISCONNECTED')
    expect(window.dataLayer[0].wallet_type).toBe('metamask')
  })
})

// ─── trackWalletConnectFailed ─────────────────────────────────────────────────

describe('trackWalletConnectFailed', () => {
  it('pushes WALLET_CONNECT_FAILED with wallet_type and error_code', () => {
    trackWalletConnectFailed('metamask', 'User Rejected Transaction')
    const evt = window.dataLayer[0]
    expect(evt.event).toBe('WALLET_CONNECT_FAILED')
    expect(evt.wallet_type).toBe('metamask')
    expect(evt.error_code).toBe('User Rejected Transaction')
  })
})

// ─── trackAssetActionInitiated ────────────────────────────────────────────────

describe('trackAssetActionInitiated', () => {
  it('pushes ASSET_ACTION_INITIATED with action, chain_id, and version', () => {
    trackAssetActionInitiated('TransferHolder', '137', 'V5')
    const evt = window.dataLayer[0]
    expect(evt.event).toBe('ASSET_ACTION_INITIATED')
    expect(evt.action).toBe('TransferHolder')
    expect(evt.chain_id).toBe('137')
    expect(evt.token_registry_version).toBe('V5')
  })

  it('works without optional params', () => {
    trackAssetActionInitiated('ReturnToIssuer')
    expect(window.dataLayer[0].action).toBe('ReturnToIssuer')
    expect(window.dataLayer[0].chain_id).toBeUndefined()
  })
})

// ─── trackAssetActionFailed ───────────────────────────────────────────────────

describe('trackAssetActionFailed', () => {
  it('pushes ASSET_ACTION_FAILED with error_code', () => {
    trackAssetActionFailed(
      'NominateBeneficiary',
      'User Rejected Transaction',
      '1'
    )
    const evt = window.dataLayer[0]
    expect(evt.event).toBe('ASSET_ACTION_FAILED')
    expect(evt.action).toBe('NominateBeneficiary')
    expect(evt.error_code).toBe('User Rejected Transaction')
    expect(evt.chain_id).toBe('1')
  })
})

// ─── trackSupportFormSubmitted ────────────────────────────────────────────────

describe('trackSupportFormSubmitted', () => {
  it('pushes SUPPORT_FORM_SUBMITTED with enquiry_type', () => {
    trackSupportFormSubmitted('TradeTrust')
    expect(window.dataLayer[0].event).toBe('SUPPORT_FORM_SUBMITTED')
    expect(window.dataLayer[0].enquiry_type).toBe('TradeTrust')
  })

  it('resets all document and verification fields to clear GTM state', () => {
    trackSupportFormSubmitted('General_Enquiry')
    const evt = window.dataLayer[0] as Record<string, unknown>
    for (const field of DOCUMENT_RESET_FIELDS) {
      expect(Object.prototype.hasOwnProperty.call(evt, field)).toBe(true)
      expect(evt[field]).toBeUndefined()
    }
  })
})

// ─── trackSupportFormFailed ───────────────────────────────────────────────────

describe('trackSupportFormFailed', () => {
  it('pushes SUPPORT_FORM_FAILED with enquiry_type and error_code', () => {
    trackSupportFormFailed('General_Enquiry', 'Server Error')
    const evt = window.dataLayer[0]
    expect(evt.event).toBe('SUPPORT_FORM_FAILED')
    expect(evt.enquiry_type).toBe('General_Enquiry')
    expect(evt.error_code).toBe('Server Error')
  })

  it('resets document and file fields (excluding its own error_code) to clear GTM state', () => {
    trackSupportFormFailed('General_Enquiry', 'Server Error')
    const evt = window.dataLayer[0] as Record<string, unknown>
    const docFields = DOCUMENT_RESET_FIELDS.filter(f => f !== 'error_code')
    for (const field of docFields) {
      expect(Object.prototype.hasOwnProperty.call(evt, field)).toBe(true)
      expect(evt[field]).toBeUndefined()
    }
    // error_code belongs to this event itself — must not be cleared
    expect(evt.error_code).toBe('Server Error')
  })
})
