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

      expect(type).toBe(errorMessages.TYPES.HASH)
      expect(title).toMatch(/tampered/i)
      // No override: the established HASH copy reads better than "Invalid signature."
      expect(body).toBeUndefined()
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
    const frag = (
      name: string,
      type: string,
      status: string,
      message?: string
    ) =>
      ({
        name,
        type,
        status,
        ...(message ? { reason: { message } } : {}),
      }) as unknown as VerificationFragment

    /** A fragment set: integrity/status/identity, with one carrying the failure reason. */
    const frags = ({
      integrity = 'VALID',
      status = 'VALID',
      identity = 'VALID',
      integrityReason,
      statusReason,
      identityReason,
    }: {
      integrity?: string
      status?: string
      identity?: string
      integrityReason?: string
      statusReason?: string
      identityReason?: string
    }): VerificationFragment[] => [
      frag(
        'W3CVpSignatureIntegrity',
        'DOCUMENT_INTEGRITY',
        integrity,
        integrityReason
      ),
      frag('W3CVpCredentialStatus', 'DOCUMENT_STATUS', status, statusReason),
      frag('W3CVpIssuerIdentity', 'ISSUER_IDENTITY', identity, identityReason),
    ]

    // `vp` carries two credentials, labelled "CHAFTA COO" and "BILL OF LADING" by the tabs, so
    // copy that names one can be checked against what is actually on screen.
    const CREDENTIAL_1 = 'Credential 1 ("CHAFTA COO")'
    const CREDENTIAL_2 = 'Credential 2 ("BILL OF LADING")'

    describe('a valid presentation', () => {
      it('has no error type and no copy', () => {
        const valid = frags({})
        expect(getErrorMessageFromFragments(valid, vp)).toBeUndefined()
      })
    })

    describe('an EMBEDDED CREDENTIAL is at fault — copy blames the issuer', () => {
      const cases: Array<{
        what: string
        reason: string
        type: string
        expected: string
      }> = [
        {
          what: 'expired',
          reason:
            'Embedded credential at index 1 has expired (validUntil 2020-01-01T00:00:00Z).',
          type: errorMessages.TYPES.INVALID,
          expected: `${CREDENTIAL_2} in this presentation has expired.`,
        },
        {
          what: 'not yet valid',
          reason:
            'Embedded credential at index 0 is not yet valid (validFrom 2099-01-01T00:00:00Z).',
          type: errorMessages.TYPES.INVALID,
          expected: `${CREDENTIAL_1} in this presentation is not valid yet.`,
        },
        {
          what: 'revoked',
          reason:
            'Embedded credential at index 0 has been revoked (status purpose "revocation").',
          type: errorMessages.TYPES.REVOKED,
          expected: `${CREDENTIAL_1} in this presentation has been revoked by its issuer.`,
        },
      ]

      for (const { what, reason, type, expected } of cases) {
        it(`${what}: names the credential and sends the user to the issuer`, () => {
          const set = frags({ status: 'INVALID', statusReason: reason })

          expect(getErrorTypeFromFragments(set)).toBe(type)
          const message = getErrorMessageFromFragments(set, vp)
          expect(message).toContain(expected)
          expect(message).toContain('issuer')
          // The bug this guards: the presentation is fine, so never tell the user to ask the
          // holder to present again — nothing the holder does can fix a bad credential.
          expect(message).not.toMatch(/ask the holder/i)
          // And never blame the presentation as a whole.
          expect(message).not.toMatch(/^this (presentation|document)/i)
        })
      }

      it('falls back to the position when no document is available', () => {
        const set = frags({
          status: 'INVALID',
          statusReason:
            'Embedded credential at index 1 has expired (validUntil 2020-01-01T00:00:00Z).',
        })
        // Same credential, named without the tab label rather than named wrongly.
        expect(getErrorMessageFromFragments(set)).toContain('Credential 2 ')
      })

      it('names every credential when several are at fault', () => {
        const set = frags({
          identity: 'INVALID',
          identityReason:
            'Could not resolve issuer(s): index 0 (did:web:a), index 1 (did:web:b).',
        })
        const message = getErrorMessageFromFragments(set, vp)
        expect(message).toContain(CREDENTIAL_1)
        expect(message).toContain(CREDENTIAL_2)
      })
    })

    describe('the PRESENTATION is at fault — copy blames the holder', () => {
      it('expired: asks the holder to present again', () => {
        const set = frags({
          status: 'INVALID',
          statusReason:
            'Presentation has expired (validUntil 2020-01-01T00:00:00Z).',
        })

        expect(getErrorTypeFromFragments(set)).toBe(errorMessages.TYPES.INVALID)
        const message = getErrorMessageFromFragments(set, vp)
        expect(message).toMatch(/this presentation has expired/i)
        expect(message).toMatch(/holder/i)
        // It must not claim a specific credential expired — none did.
        expect(message).not.toMatch(/^credential \d/i)
      })

      it('unsigned: says ownership cannot be proven', () => {
        const set = frags({
          integrity: 'INVALID',
          integrityReason:
            'Presentation is not signed (no holder "proof"), so ownership cannot be proven.',
        })
        expect(getErrorMessageFromFragments(set, vp)).toMatch(/not signed/i)
      })

      it('signed by the wrong party: says so, rather than "not valid"', () => {
        const set = frags({
          integrity: 'INVALID',
          integrityReason:
            'the presentation was signed by "did:key:zAAA", which does not match the declared holder "did:key:zBBB".',
        })
        expect(getErrorMessageFromFragments(set, vp)).toMatch(
          /signed by someone other than the holder/i
        )
      })
    })

    describe('root cause wins over its symptoms', () => {
      it('an unresolvable issuer is an identity failure, not tampering', () => {
        // Verifying a credential's signature needs its issuer's key, so an unpublished DID
        // fails integrity too — with a raw TypeError from the failed lookup. Matched the other
        // way round, the user is told a perfectly intact document was tampered with.
        const set = frags({
          integrity: 'INVALID',
          integrityReason:
            "Embedded credential at index 0 has an invalid signature: Cannot read properties of null (reading 'verificationMethod')",
          identity: 'INVALID',
          identityReason:
            'Could not resolve issuer(s): index 0 (did:web:nope.invalid).',
        })

        expect(getErrorTypeFromFragments(set)).toBe(
          errorMessages.TYPES.IDENTITY
        )
        const message = getErrorMessageFromFragments(set, vp)
        expect(message).toContain(CREDENTIAL_1)
        expect(message).not.toMatch(/tampered/i)
        // The raw TypeError must never reach the user.
        expect(message).not.toMatch(/cannot read properties/i)
      })

      it('revocation wins over a broken signature', () => {
        // Deliberate: revocation is the more actionable answer for the holder.
        const set = frags({
          integrity: 'INVALID',
          integrityReason: 'Invalid signature.',
          status: 'INVALID',
          statusReason:
            'Embedded credential at index 0 has been revoked (status purpose "revocation").',
        })
        expect(getErrorTypeFromFragments(set)).toBe(errorMessages.TYPES.REVOKED)
      })

      it('a genuinely edited credential is still reported as tampered', () => {
        const set = frags({
          integrity: 'INVALID',
          integrityReason: 'Invalid signature.',
        })
        expect(getErrorTypeFromFragments(set)).toBe(errorMessages.TYPES.HASH)
      })
    })

    /**
     * The same matrix again, but VERIFIED FOR REAL — `verifyDocument` against the fixture, then
     * the copy. The fragment sets above pin the mapping; these pin the thing the mapping depends
     * on, which is the verifier's own wording. Change `Embedded credential at index 0 has
     * expired` upstream and the tests above keep passing while production silently reverts to
     * telling users to ask the holder to present again. These fail instead.
     *
     * One fixture per row of the matrix, mirroring the CLI's `tests/fixtures/vp`.
     */
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
          expect: /^$/, // no copy at all — nothing failed
        },
        {
          fixture: 'valid/mixed_suites',
          doc: mixedSuitesVp,
          expect: /^$/,
        },
        {
          fixture: 'invalid/presentation_expired',
          doc: expiredVp,
          type: errorMessages.TYPES.INVALID,
          expect: /this presentation has expired.*ask the holder/i,
        },
        {
          fixture: 'invalid/credential_expired',
          doc: credentialExpiredVp,
          type: errorMessages.TYPES.INVALID,
          expect: /^Credential 1 .*has expired\. Ask the issuer/i,
        },
        {
          fixture: 'invalid/credential_revoked',
          doc: credentialRevokedVp,
          type: errorMessages.TYPES.REVOKED,
          expect: /^Credential 1 .*has been revoked by its issuer/i,
          network: true,
        },
        {
          fixture: 'invalid/holder_mismatch',
          doc: holderMismatchVp,
          type: errorMessages.TYPES.INVALID,
          expect: /signed by someone other than the holder/i,
        },
        {
          fixture: 'invalid/tampered_credential',
          doc: tamperedCredentialVp,
          type: errorMessages.TYPES.HASH,
          expect: /^$/, // no override; the HASH copy already says "tampered with"
        },
        {
          fixture: 'invalid/unresolvable_issuer',
          doc: unresolvableIssuerVp,
          type: errorMessages.TYPES.IDENTITY,
          expect: /^Credential 1 .*cannot be identified/i,
          network: true,
        },
        {
          fixture: 'invalid/unsigned',
          doc: unsignedVp,
          type: errorMessages.TYPES.INVALID,
          expect: /is not signed/i,
        },
      ]

      for (const { fixture, doc, type, expect: pattern, network } of cases) {
        it(`${fixture}${network ? ' (needs network)' : ''}`, async () => {
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
          expect(message).not.toMatch(/validUntil|validFrom|did:key:|did:web:/)
          expect(message).not.toMatch(/cannot read properties|proofValue/i)
        }, 30000)
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
    it('verifies end to end, resolving the hosted DID document', async () => {
      const fragments = (await verifyDocument(
        didWebVp as never
      )) as VerificationFragment[]

      expect(groupStatus(fragments, 'DOCUMENT_INTEGRITY')).toBe('VALID')
      expect(groupStatus(fragments, 'DOCUMENT_STATUS')).toBe('VALID')
      expect(groupStatus(fragments, 'ISSUER_IDENTITY')).toBe('VALID')
    }, 120000)
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
