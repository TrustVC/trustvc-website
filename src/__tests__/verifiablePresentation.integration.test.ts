// @vitest-environment node
//
// Real verification of a Verifiable Presentation — no mocks. Runs under the node
// environment because ECDSA verification needs real WebCrypto; under jsdom the holder
// proof fails to verify and every assertion here would be meaningless.
import { describe, it, expect } from 'vitest'
import {
  verifyDocument,
  vc,
  errorMessages,
  VerificationFragment,
} from '@trustvc/trustvc'
import {
  getErrorMessageFromFragments,
  getErrorTypeFromFragments,
} from '../components/home/VerifySection/useVerify'
import {
  getCredentialFileName,
  getCredentialLabel,
  getIsExpired,
  getOpenAttestationData,
  getPresentationCredentials,
  isVerifiablePresentation,
} from '../utils/helper'

import vp from './__fixtures__/w3c/presentations/valid/two_credentials.json'
import didWebVp from './__fixtures__/w3c/presentations/valid/didweb_issuer.json'
import attachmentsVp from './__fixtures__/w3c/presentations/valid/with_attachments.json'
import expiredVp from './__fixtures__/w3c/presentations/invalid/presentation_expired.json'
import w3cCredential from './__fixtures__/w3c/ecdsa_w3c_verifiable_document_v2_0.json'

// One fixture per outcome. Verified for real below rather than through hand-built fragments,
// so a change to the verifier's wording breaks these tests instead of silently changing what users are told.
import singleCredentialVp from './__fixtures__/w3c/presentations/valid/single_credential.json'
import mixedSuitesVp from './__fixtures__/w3c/presentations/valid/mixed_suites.json'
import credentialExpiredVp from './__fixtures__/w3c/presentations/invalid/credential_expired.json'
import credentialRevokedVp from './__fixtures__/w3c/presentations/invalid/credential_revoked.json'
import holderMismatchVp from './__fixtures__/w3c/presentations/invalid/holder_mismatch.json'
import tamperedCredentialVp from './__fixtures__/w3c/presentations/invalid/tampered_credential.json'
import unresolvableIssuerVp from './__fixtures__/w3c/presentations/invalid/unresolvable_issuer.json'
import unsignedVp from './__fixtures__/w3c/presentations/invalid/unsigned.json'
import proofIncompleteVp from './__fixtures__/w3c/presentations/invalid/presentation_proof_incomplete.json'
import tamperedPresentationVp from './__fixtures__/w3c/presentations/invalid/tampered_presentation.json'
import notYetValidVp from './__fixtures__/w3c/presentations/invalid/presentation_not_yet_valid.json'
import presentationDateInvalidVp from './__fixtures__/w3c/presentations/invalid/presentation_date_invalid.json'
import presentationEmptyVp from './__fixtures__/w3c/presentations/invalid/presentation_empty.json'
import credentialNotYetValidVp from './__fixtures__/w3c/presentations/invalid/credential_not_yet_valid.json'
import credentialDateInvalidVp from './__fixtures__/w3c/presentations/invalid/credential_date_invalid.json'
import credentialNoHolderVp from './__fixtures__/w3c/presentations/invalid/credential_no_holder.json'
import credentialSuspendedVp from './__fixtures__/w3c/presentations/invalid/credential_suspended.json'
import credentialStatusUnreachableVp from './__fixtures__/w3c/presentations/invalid/credential_status_unreachable.json'
import credentialStatusUnsupportedVp from './__fixtures__/w3c/presentations/invalid/credential_status_unsupported.json'

/**
 * Cases that reach the internet — resolving a hosted DID document, fetching a revocation
 * status list — get this timeout rather than the offline one. Two round trips on a cold
 * cache do not fit in the 30s the local-only cases use.
 */
const NETWORK_TIMEOUT_MS = 120000

/**
 * Network cases run by DEFAULT: skipping them quietly would drop exactly the coverage that
 * matters most here, and they were the reason this suite exists. Set SKIP_NETWORK_TESTS=1
 * to leave them out where there is no egress (a sandboxed CI runner, an offline laptop).
 *
 * Marking a case `network: true` previously only appended "(needs network)" to its name —
 * nothing was gated on it and nothing was skipped.
 */
const skipNetwork = process.env.SKIP_NETWORK_TESTS === '1'
const itNetwork = skipNetwork ? it.skip : it

const groupStatus = (frags: VerificationFragment[], type: string) => {
  const group = frags.filter(f => f.type === type && f.status !== 'SKIPPED')
  if (group.length === 0) return 'MISSING'
  if (group.some(f => f.status === 'INVALID' || f.status === 'ERROR'))
    return 'INVALID'
  return 'VALID'
}

describe('Verifiable Presentation', () => {
  describe('detection', () => {
    it('recognises a presentation', () => {
      expect(isVerifiablePresentation(vp)).toBe(true)
    })

    it('does not mistake a credential for one', () => {
      expect(isVerifiablePresentation(w3cCredential)).toBe(false)
    })

    it('ignores the proof, so an unsigned presentation is still routed in', () => {
      const { proof: _proof, ...unsigned } = vp as Record<string, unknown>
      expect(isVerifiablePresentation(unsigned)).toBe(true)
    })

    it('uses the library predicates for well-formed documents', () => {
      // Signed and raw are mutually exclusive in the library, so both are consulted.
      expect(vc.isSignedPresentation(vp as never)).toBe(true)
      const { proof: _proof, ...unsigned } = vp as Record<string, unknown>
      expect(vc.isRawPresentation(unsigned as never)).toBe(true)
    })

    // These two shapes are why the shape fallback exists: trustvc's verifier routes them
    // into its VP fragments, but the strict library predicates reject them. Without the
    // fallback they would fall through to the credential path, where getDocumentData
    // throws and the UI reports a generic failure instead of the verifier's finding.
    it.each([
      [
        'an empty credential list',
        (() => {
          const d = JSON.parse(JSON.stringify(vp))
          d.verifiableCredential = []
          return d
        })(),
      ],
      [
        'a missing @context',
        (() => {
          const d = JSON.parse(JSON.stringify(vp))
          delete d['@context']
          return d
        })(),
      ],
    ])('still recognises a presentation with %s', (_label, doc) => {
      expect(vc.isRawPresentation(doc) || vc.isSignedPresentation(doc)).toBe(
        false
      )
      expect(isVerifiablePresentation(doc)).toBe(true)
      expect(() => getOpenAttestationData(doc)).not.toThrow()
    })

    it('reports the empty-credential case the way the verifier does', async () => {
      const doc = JSON.parse(JSON.stringify(vp))
      doc.verifiableCredential = []
      const fragments = (await verifyDocument(doc)) as VerificationFragment[]
      const issuer = fragments.find(f => f.name === 'W3CVpIssuerIdentity')

      expect(issuer?.status).toBe('INVALID')
      expect(
        (issuer as { reason?: { message?: string } })?.reason?.message
      ).toMatch(/no verifiable credentials/i)
    }, 60000)
  })

  describe('verification', () => {
    it('verifies every fragment of a valid presentation', async () => {
      const fragments = (await verifyDocument(
        vp as never
      )) as VerificationFragment[]

      expect(groupStatus(fragments, 'DOCUMENT_INTEGRITY')).toBe('VALID')
      expect(groupStatus(fragments, 'DOCUMENT_STATUS')).toBe('VALID')
      expect(groupStatus(fragments, 'ISSUER_IDENTITY')).toBe('VALID')
    }, 60000)

    it('reports an unsigned presentation as tampered rather than skipping it', async () => {
      const { proof: _proof, ...unsigned } = vp as Record<string, unknown>
      const fragments = (await verifyDocument(
        unsigned as never
      )) as VerificationFragment[]

      expect(groupStatus(fragments, 'DOCUMENT_INTEGRITY')).toBe('INVALID')
    }, 60000)

    it('reports a presentation whose credential was edited after signing', async () => {
      const tampered = JSON.parse(JSON.stringify(vp))
      tampered.verifiableCredential[0].credentialSubject.id =
        'did:key:zSomeoneElse'
      const fragments = (await verifyDocument(
        tampered
      )) as VerificationFragment[]

      expect(groupStatus(fragments, 'DOCUMENT_INTEGRITY')).toBe('INVALID')
    }, 60000)
  })

  describe('document helpers', () => {
    // getOpenAttestationData used to throw on a presentation, which took getIsExpired —
    // and so the whole verification run — down with it.
    it('treats the presentation as its own document data', () => {
      expect(() => getOpenAttestationData(vp)).not.toThrow()
      expect(getOpenAttestationData(vp)).toHaveProperty('verifiableCredential')
    })

    it('reads the presentation expiry without throwing', () => {
      expect(getIsExpired(vp)).toBe(false)
    })

    it('reports an expired presentation as expired', () => {
      expect(getIsExpired({ ...vp, validUntil: '2020-01-01T00:00:00Z' })).toBe(
        true
      )
    })

    it('extracts every embedded credential', () => {
      const credentials = getPresentationCredentials(vp)
      expect(credentials).toHaveLength(2)
      expect(credentials[0]).toHaveProperty('proof')
    })

    it('labels each credential by its renderer template', () => {
      const labels = getPresentationCredentials(vp).map(getCredentialLabel)
      expect(labels).toEqual(['CHAFTA COO', 'BILL OF LADING'])
    })

    it('returns no credentials for a plain credential', () => {
      expect(getPresentationCredentials(w3cCredential)).toEqual([])
    })
  })
  /**
   * The verdicts the CLI reaches for the same documents. Both call verifyDocument and
   * derive the overall result the same way, so they cannot legitimately disagree — this
   * pins that. A presentation MUST carry a holder proof: the shared
   * W3CVpSignatureIntegrity fragment fails an unsigned one outright.
   */
  describe('parity with the trustvc CLI', () => {
    const overall = (frags: VerificationFragment[]) => {
      const types = [...new Set(frags.map(f => f.type))]
      const statuses = types.map(t => groupStatus(frags, t))
      return statuses.some(s => s === 'VALID') &&
        statuses.every(s => s !== 'INVALID')
        ? 'valid'
        : 'invalid'
    }
    const tamper = (mutate: (d: any) => void) => {
      const d = JSON.parse(JSON.stringify(vp))
      mutate(d)
      return d
    }

    it('a valid presentation passes every check', async () => {
      const frags = (await verifyDocument(
        vp as never
      )) as VerificationFragment[]
      expect(overall(frags)).toBe('valid')
    }, 60000)

    it('an UNSIGNED presentation fails integrity — a VP must prove ownership', async () => {
      const frags = (await verifyDocument(
        tamper(d => delete d.proof)
      )) as VerificationFragment[]

      expect(groupStatus(frags, 'DOCUMENT_INTEGRITY')).toBe('INVALID')
      expect(overall(frags)).toBe('invalid')
    }, 60000)

    it('an edited credential fails integrity', async () => {
      const frags = (await verifyDocument(
        tamper(d => {
          d.verifiableCredential[0].credentialSubject.id =
            'did:key:zSomeoneElse'
        })
      )) as VerificationFragment[]

      expect(groupStatus(frags, 'DOCUMENT_INTEGRITY')).toBe('INVALID')
    }, 60000)

    it('an edited holder fails integrity — holder is inside the signed payload', async () => {
      const frags = (await verifyDocument(
        tamper(d => {
          d.holder = 'did:key:zSomeoneElse'
        })
      )) as VerificationFragment[]

      expect(groupStatus(frags, 'DOCUMENT_INTEGRITY')).toBe('INVALID')
    }, 60000)

    it('an expired presentation fails STATUS while its signature stays sound', async () => {
      // Signed with a past window, so only the expiry has lapsed — editing validUntil on a
      // signed VP would break the proof instead and prove nothing about expiry handling.
      const frags = (await verifyDocument(
        expiredVp as never
      )) as VerificationFragment[]

      expect(groupStatus(frags, 'DOCUMENT_INTEGRITY')).toBe('VALID')
      expect(groupStatus(frags, 'DOCUMENT_STATUS')).toBe('INVALID')
      expect(overall(frags)).toBe('invalid')
    }, 60000)

    it('a presentation carrying no credentials fails issuer identity', async () => {
      const frags = (await verifyDocument(
        tamper(d => {
          d.verifiableCredential = []
        })
      )) as VerificationFragment[]

      expect(groupStatus(frags, 'ISSUER_IDENTITY')).toBe('INVALID')
      expect(overall(frags)).toBe('invalid')
    }, 60000)
  })
  /**
   * trustvc's errorMessageHandling was written for OpenAttestation: it sees an invalid
   * DOCUMENT_INTEGRITY and returns HASH, whose copy reads "Document has been tampered
   * with". For a presentation that is wrong for every failure except an actual bad
   * signature, and it discards the verifier's own explanation. These pin the mapping.
   */
  describe('error reporting', () => {
    const tamper = (mutate: (d: any) => void) => {
      const d = JSON.parse(JSON.stringify(vp))
      mutate(d)
      return d
    }
    const report = async (doc: unknown) => {
      const frags = (await verifyDocument(
        doc as never
      )) as VerificationFragment[]
      const type = getErrorTypeFromFragments(frags)
      return {
        type,
        title: (
          errorMessages.MESSAGES as Record<string, { failureTitle: string }>
        )[type]?.failureTitle,
        body: getErrorMessageFromFragments(frags),
      }
    }

    it('never calls an expired presentation tampered, and states the expiry', async () => {
      const { title, body } = await report(expiredVp)

      expect(title).not.toMatch(/tampered/i)
      // Plain copy, not the verifier's "Presentation has expired (validUntil …)".
      expect(body).toMatch(/expired/i)
      expect(body).not.toMatch(/validUntil/)
    }, 60000)

    it('never calls an unsigned presentation tampered, and says it is unsigned', async () => {
      const { title, body } = await report(tamper(d => delete d.proof))

      expect(title).not.toMatch(/tampered/i)
      expect(body).toMatch(/not signed/i)
    }, 60000)

    it('explains a presentation carrying no credentials', async () => {
      const { title, body } = await report(
        tamper(d => {
          d.verifiableCredential = []
        })
      )

      expect(title).not.toMatch(/tampered/i)
      // Beats the co-occurring generic "Presentation proof is invalid."
      expect(body).toMatch(/does not contain any credentials/i)
    }, 60000)

    it('does call an edited credential tampered — the existing copy fits', async () => {
      const { type, title, body } = await report(
        tamper(d => {
          d.verifiableCredential[0].credentialSubject.id =
            'did:key:zSomeoneElse'
        })
      )

      expect(type).toBe(errorMessages.TYPES.CREDENTIAL_TAMPERED)
      expect(title).toMatch(/tampered/i)
      // It names the credential that changed rather than blaming the envelope the holder
      // signed over it — editing a credential breaks BOTH signatures, and the credential is
      // the thing that actually changed.
      expect(body).toMatch(
        /contents of Credential 1 .*do not match its signature/i
      )
    }, 60000)

    it('never shows raw verifier wording to the user', async () => {
      const docs = [
        expiredVp,
        tamper(d => delete d.proof),
        tamper(d => {
          d.verifiableCredential = []
        }),
      ]
      for (const doc of docs) {
        const { body } = await report(doc)
        if (body)
          expect(body).not.toMatch(/validUntil|"proof"|Invalid signature/)
      }
    }, 120000)

    it('leaves a valid presentation with no error at all', async () => {
      const frags = (await verifyDocument(
        vp as never
      )) as VerificationFragment[]
      expect(getErrorMessageFromFragments(frags)).toBeUndefined()
    }, 60000)
  })
  /**
   * Every way a presentation can pass or fail, and the copy each produces.
   *
   * The distinction that matters: a failure belonging to an EMBEDDED CREDENTIAL must name that
   * credential and point at its ISSUER, while a failure belonging to the PRESENTATION points at
   * the HOLDER. They need opposite remedies — an expired presentation can be re-presented, an
   * expired credential can only be reissued — so collapsing them tells the user to do something
   * that cannot work. Both read "... has expired (validUntil ...)", which is exactly how they
   * came to be conflated.
   */
  describe('what the user is told', () => {
    describe('against the real documents', () => {
      const cases: Array<{
        fixture: string
        doc: unknown
        type?: string
        expect: RegExp
        network?: boolean
      }> = [
        {
          fixture: 'valid/single_credential',
          doc: singleCredentialVp,
          expect: /^$/,
        },
        { fixture: 'valid/mixed_suites', doc: mixedSuitesVp, expect: /^$/ },

        // The ENVELOPE is at fault — the remedy is the holder's.
        {
          fixture: 'invalid/unsigned',
          doc: unsignedVp,
          type: errorMessages.TYPES.PRESENTATION_UNSIGNED,
          expect: /is not signed.*ask the holder/i,
        },
        {
          fixture: 'invalid/presentation_proof_incomplete',
          doc: proofIncompleteVp,
          type: errorMessages.TYPES.PRESENTATION_PROOF_INCOMPLETE,
          expect: /no usable signature/i,
        },
        {
          fixture: 'invalid/tampered_presentation',
          doc: tamperedPresentationVp,
          type: errorMessages.TYPES.PRESENTATION_TAMPERED,
          expect: /signature does not match the contents/i,
        },
        {
          fixture: 'invalid/holder_mismatch',
          doc: holderMismatchVp,
          type: errorMessages.TYPES.PRESENTATION_HOLDER_MISMATCH,
          expect: /signed by someone other than the holder/i,
        },
        {
          fixture: 'invalid/presentation_expired',
          doc: expiredVp,
          type: errorMessages.TYPES.PRESENTATION_EXPIRED,
          expect: /this presentation has expired.*ask the holder/i,
        },
        {
          fixture: 'invalid/presentation_not_yet_valid',
          doc: notYetValidVp,
          type: errorMessages.TYPES.PRESENTATION_NOT_YET_VALID,
          expect: /does not take effect yet/i,
        },
        {
          fixture: 'invalid/presentation_date_invalid',
          doc: presentationDateInvalidVp,
          type: errorMessages.TYPES.PRESENTATION_DATE_INVALID,
          expect: /unreadable expiry date/i,
        },
        {
          fixture: 'invalid/presentation_empty',
          doc: presentationEmptyVp,
          type: errorMessages.TYPES.PRESENTATION_EMPTY,
          expect: /does not contain any credentials/i,
        },

        // An EMBEDDED CREDENTIAL is at fault — it must be NAMED, and the remedy is the
        // issuer's. Telling the holder to present again cannot fix any of these.
        {
          fixture: 'invalid/credential_expired',
          doc: credentialExpiredVp,
          type: errorMessages.TYPES.CREDENTIAL_EXPIRED,
          expect:
            /^Credential 2 \(.*has expired\. Please ask the issuing authority/i,
        },
        {
          fixture: 'invalid/credential_not_yet_valid',
          doc: credentialNotYetValidVp,
          type: errorMessages.TYPES.CREDENTIAL_NOT_YET_VALID,
          expect: /^Credential 2 \(.*does not take effect yet/i,
        },
        {
          fixture: 'invalid/credential_date_invalid',
          doc: credentialDateInvalidVp,
          type: errorMessages.TYPES.CREDENTIAL_DATE_INVALID,
          expect: /^Credential 2 \(.*unreadable date/i,
        },
        {
          fixture: 'invalid/credential_no_holder',
          doc: credentialNoHolderVp,
          type: errorMessages.TYPES.CREDENTIAL_NO_HOLDER,
          expect: /^Credential 2 \(.*does not say who it was issued to/i,
        },
        {
          fixture: 'invalid/tampered_credential',
          doc: tamperedCredentialVp,
          type: errorMessages.TYPES.CREDENTIAL_TAMPERED,
          expect: /contents of Credential 2 \(.*do not match its signature/i,
        },
        {
          fixture: 'invalid/credential_status_unsupported',
          doc: credentialStatusUnsupportedVp,
          type: errorMessages.TYPES.CREDENTIAL_STATUS_UNSUPPORTED,
          expect: /records its status in a way we do not support/i,
        },
        {
          fixture: 'invalid/credential_revoked',
          doc: credentialRevokedVp,
          type: errorMessages.TYPES.CREDENTIAL_REVOKED,
          expect:
            /^Credential 2 \(.*has been revoked by the issuing authority/i,
          network: true,
        },
        {
          fixture: 'invalid/credential_suspended',
          doc: credentialSuspendedVp,
          type: errorMessages.TYPES.CREDENTIAL_SUSPENDED,
          expect: /has been suspended by the issuing authority/i,
          network: true,
        },
        {
          fixture: 'invalid/credential_status_unreachable',
          doc: credentialStatusUnreachableVp,
          type: errorMessages.TYPES.CREDENTIAL_STATUS_UNREACHABLE,
          expect: /could not reach the status list/i,
          network: true,
        },
        {
          fixture: 'invalid/unresolvable_issuer',
          doc: unresolvableIssuerVp,
          type: errorMessages.TYPES.CREDENTIAL_ISSUER_UNRESOLVABLE,
          expect: /could not identify who issued Credential 2 \(/i,
          network: true,
        },
      ]

      for (const { fixture, doc, type, expect: pattern, network } of cases) {
        const runCase = network ? itNetwork : it
        runCase(
          `${fixture}${network ? ' (needs network)' : ''}`,
          async () => {
            const fragments = (await verifyDocument(
              doc as never
            )) as unknown as VerificationFragment[]
            const message = getErrorMessageFromFragments(fragments, doc) ?? ''

            if (pattern.source === '^$') {
              // Either a valid presentation, or one whose type copy already fits.
              expect(message).toBe('')
            } else {
              expect(message).toMatch(pattern)
            }
            if (type) expect(getErrorTypeFromFragments(fragments)).toBe(type)

            // Whatever the outcome, the raw verifier wording never reaches the user.
            expect(message).not.toMatch(
              /validUntil|validFrom|did:key:|did:web:/
            )
            expect(message).not.toMatch(/cannot read properties|proofValue/i)
          },
          network ? NETWORK_TIMEOUT_MS : 30000
        )
      }
    })
  })
  /**
   * Fixtures that exist for manual testing but were previously asserted nowhere, so a
   * regeneration that broke them would have gone unnoticed.
   */
  describe('the did:web-issuer fixture', () => {
    it('is issued by a did:web and presented by a different did:key holder', () => {
      const credentials = getPresentationCredentials(didWebVp)
      const holder = (didWebVp as { holder: string }).holder

      expect(holder).toMatch(/^did:key:/)
      for (const credential of credentials) {
        expect(credential.issuer).toBe('did:web:trustvc.github.io:did:1')
        expect(credential.issuer).not.toBe(holder)
      }
    })

    // Needs network: the did:web document is fetched to resolve the issuer's key.
    itNetwork(
      'verifies end to end, resolving the hosted DID document',
      async () => {
        const fragments = (await verifyDocument(
          didWebVp as never
        )) as VerificationFragment[]

        expect(groupStatus(fragments, 'DOCUMENT_INTEGRITY')).toBe('VALID')
        expect(groupStatus(fragments, 'DOCUMENT_STATUS')).toBe('VALID')
        expect(groupStatus(fragments, 'ISSUER_IDENTITY')).toBe('VALID')
      },
      NETWORK_TIMEOUT_MS
    )
  })

  describe('the attachments fixture', () => {
    it('keeps its attachments through selective disclosure', () => {
      // They live under credentialSubject, so they only survive when explicitly revealed —
      // leave the pointer out when regenerating and they vanish silently.
      const [first, second] = getPresentationCredentials(attachmentsVp)

      expect(
        first.credentialSubject.attachments.map((a: any) => a.filename)
      ).toEqual(['certificate-of-origin.pdf', 'packing-list.txt'])
      expect(second.credentialSubject.attachments).toHaveLength(1)
    })

    it('still verifies with attachments embedded', async () => {
      const fragments = (await verifyDocument(
        attachmentsVp as never
      )) as VerificationFragment[]

      expect(groupStatus(fragments, 'DOCUMENT_INTEGRITY')).toBe('VALID')
    }, 60000)
  })

  describe('per-credential download names', () => {
    it('qualifies each credential so tabs do not overwrite each other', () => {
      const credentials = getPresentationCredentials(vp)
      const names = credentials.map((c, i) =>
        getCredentialFileName('presentation.json', c, i)
      )

      expect(names).toEqual([
        'presentation-chafta-coo.json',
        'presentation-bill-of-lading.json',
      ])
      expect(new Set(names).size).toBe(names.length)
    })

    it('falls back to a position when a credential has no label', () => {
      expect(
        getCredentialFileName('vp.json', { type: ['VerifiableCredential'] }, 2)
      ).toBe('vp-credential-3.json')
    })
  })
})
