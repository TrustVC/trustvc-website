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
 * How long one credential's verification may run before it is reported as failed.
 *
 * verifyDocument resolves DID documents and fetches revocation status lists over the
 * network, and takes no abort signal — so a request that never settles would otherwise
 * leave the tab spinning for the life of the page. The ceiling is deliberately generous:
 * a did:web issuer plus a status list is several round trips on a cold cache, and a
 * timeout here is indistinguishable to the user from a genuine failure.
 */
const VERIFY_TIMEOUT_MS = 60_000

/**
 * Rejects if `promise` has not settled within `ms`.
 *
 * The underlying work cannot be cancelled — verifyDocument exposes no signal — so this
 * bounds only how long the UI waits on it, not the request itself.
 */
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('verification timed out')),
      ms
    )
    promise.then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      error => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })

interface VerificationState {
  /** The credential set `results` describes — see credentialsKey below. */
  key: string
  results: CredentialVerification[]
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
  const [state, setState] = useState<VerificationState>({
    key: '',
    results: [],
  })

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
      setState({ key: credentialsKey, results: [] })
      return
    }

    let cancelled = false

    Promise.all(
      credentials.map(async credential => {
        try {
          const fragments = (await withTimeout(
            Promise.resolve(verifyDocument(credential)),
            VERIFY_TIMEOUT_MS
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
          // A credential that cannot be verified at all — including one whose verification
          // outran VERIFY_TIMEOUT_MS — is reported as failing every check rather than
          // silently showing nothing or spinning forever.
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
      if (!cancelled) setState({ key: credentialsKey, results: settled })
    })

    return () => {
      cancelled = true
    }
    // Deliberately keyed on the derived identity rather than the array reference — see
    // credentialsKey above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentialsKey])

  /**
   * Pending is derived HERE, during render, not assigned in the effect above.
   *
   * Effects run after paint, so seeding the pending state there left one render with no
   * results at all: every check read `undefined`, fell through to its INVALID branch, and a
   * red cross flashed before the spinner on every presentation. On a change of presentation
   * it was worse than a flash — the state still held the PREVIOUS set's verdicts, so a
   * stale VALID sat against a new credential, and a shorter new set read past the end.
   *
   * Stamping the results with the set they describe fixes both: they are returned only when
   * they belong to the credentials being rendered, and everything else is pending.
   */
  return state.key === credentialsKey
    ? state.results
    : credentials.map(() => PENDING)
}
