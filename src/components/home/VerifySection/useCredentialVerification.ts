import { useEffect, useState } from 'react'
import { verifyDocument } from '@trustvc/trustvc'

/**
 * The shape this hook reads off a verification fragment. Declared here rather than imported
 * from ./useVerify so the hook does not pull that module — and with it sentry, analytics and
 * the whole verify stack — into anything that imports it.
 */
interface VerificationFragment {
  name: string
  status: 'VALID' | 'INVALID' | 'SKIPPED' | 'ERROR'
  type: string
}

export type CheckStatus = 'VALID' | 'INVALID'

export interface CredentialVerification {
  /** Still verifying — checks are not known yet. */
  loading: boolean
  /** Per-fragment-type verdict, keyed the same way the single-document card is. */
  status: Record<string, CheckStatus>
  /** The credential's own issuer DID, or undefined when it declares none. */
  issuer?: string
  /** Overall: every group valid. */
  isValid: boolean
}

const groupStatus = (
  fragments: VerificationFragment[],
  type: string
): CheckStatus => {
  const group = fragments.filter(f => f.type === type && f.status !== 'SKIPPED')
  if (group.length === 0) return 'INVALID'
  if (group.some(f => f.status === 'INVALID' || f.status === 'ERROR'))
    return 'INVALID'
  return group.some(f => f.status === 'VALID') ? 'VALID' : 'INVALID'
}

/**
 * The credential's issuer DID, upper-cased to match how every other identity in the verify
 * UI is rendered (getIssuerName does the same for the single-document card and for the
 * presentation holder).
 */
const readIssuer = (credential: any): string | undefined => {
  const issuer = credential?.issuer
  const id = typeof issuer === 'string' ? issuer : issuer?.id
  return id?.toUpperCase()
}

const PENDING: CredentialVerification = {
  loading: true,
  status: {},
  isValid: false,
}

/**
 * Verifies each credential embedded in a presentation on its own.
 *
 * The presentation's own fragments are aggregates — one verdict covering every embedded
 * credential — so they cannot say which credential failed, or fill in a per-credential
 * panel. Only DOCUMENT_INTEGRITY carries any per-credential detail, and none of them
 * attribute status or issuer. Running each credential through verifyDocument gives the
 * real three checks for each, which is what the per-credential panel reports.
 *
 * These results are for DISPLAY. The presentation's own fragments remain the source of
 * truth for the overall verdict — they additionally check holder binding and the
 * presentation proof, which verifying a credential in isolation cannot see.
 */
export const useCredentialVerification = (
  credentials: any[]
): CredentialVerification[] => {
  const [results, setResults] = useState<CredentialVerification[]>([])

  /**
   * Identity of the credential SET, not of the array holding it.
   *
   * Keying the effect on `credentials` itself means any caller passing a fresh array each
   * render — the ordinary thing to write — re-runs verification, sets state, re-renders and
   * loops until the heap gives out. This key only changes when the credentials do.
   *
   * It must cover the whole CONTENT, not an identifier. Keying on `id` (falling back to a
   * slice of `proofValue`) let a tampered credential reuse the verdict of the untampered
   * one: tampering edits the claims and leaves the id and the proof untouched, so the key
   * was identical while the document was not, and the tab kept showing the stale VALID.
   * `presentations/valid/single_credential.json` and
   * `presentations/invalid/tampered_credential.json` collide in exactly that way.
   *
   * Stringifying a few KB per render costs nothing next to the verification it guards.
   */
  const credentialsKey = JSON.stringify(credentials)

  useEffect(() => {
    if (credentials.length === 0) {
      setResults([])
      return
    }

    let cancelled = false
    setResults(credentials.map(() => PENDING))

    Promise.all(
      credentials.map(async credential => {
        try {
          const fragments = (await verifyDocument(
            credential
          )) as VerificationFragment[]
          const status = {
            DOCUMENT_STATUS: groupStatus(fragments, 'DOCUMENT_STATUS'),
            ISSUER_IDENTITY: groupStatus(fragments, 'ISSUER_IDENTITY'),
            DOCUMENT_INTEGRITY: groupStatus(fragments, 'DOCUMENT_INTEGRITY'),
          }
          return {
            loading: false,
            status,
            issuer: readIssuer(credential),
            isValid: Object.values(status).every(s => s === 'VALID'),
          }
        } catch {
          // A credential that cannot be verified at all is reported as failing every
          // check rather than silently showing nothing.
          return {
            loading: false,
            status: {
              DOCUMENT_STATUS: 'INVALID' as CheckStatus,
              ISSUER_IDENTITY: 'INVALID' as CheckStatus,
              DOCUMENT_INTEGRITY: 'INVALID' as CheckStatus,
            },
            issuer: readIssuer(credential),
            isValid: false,
          }
        }
      })
    ).then(settled => {
      if (!cancelled) setResults(settled)
    })

    return () => {
      cancelled = true
    }
    // Deliberately keyed on the derived identity rather than the array reference — see
    // credentialsKey above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentialsKey])

  return results
}
