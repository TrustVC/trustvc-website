import React, { useMemo, useRef, useState } from 'react'
import DocumentRenderer from './DocumentRenderer'
import { useCredentialVerification } from './useCredentialVerification'
import { CheckCircle, CrossCircle } from '../../common/Icons'
import Spinner from '../../icons/Spinner'
import {
  getCredentialFileName,
  getCredentialLabel,
  getCredentialVersionTag,
  getPresentationCredentials,
  DocumentAttachment,
} from '../../../utils/helper'

interface CredentialTabsProps {
  presentation: unknown
  fileName: string
  invalidAttachments?: DocumentAttachment[]
}

/** The same three checks the single-document card reports, in the same order. */
const CREDENTIAL_CHECKS = [
  { type: 'DOCUMENT_STATUS', label: 'Document has been issued' },
  { type: 'ISSUER_IDENTITY', label: "Document's issuer has been identified" },
  { type: 'DOCUMENT_INTEGRITY', label: 'Document has not been tampered with' },
]

/**
 * Renders each credential embedded in a Verifiable Presentation on its own tab.
 *
 * A presentation is a bundle, so there is no single document to render: each credential
 * carries its own renderer template, its own issuer and its own verification result. Each
 * tab therefore shows that credential's identity and checks above the rendered document,
 * while the presentation-level card above reports on the envelope.
 */
const CredentialTabs: React.FC<CredentialTabsProps> = ({
  presentation,
  fileName,
  invalidAttachments = [],
}) => {
  const credentials = useMemo(
    () => getPresentationCredentials(presentation),
    [presentation]
  )
  const verifications = useCredentialVerification(credentials)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  /**
   * The selected tab, stamped with the presentation it was chosen in.
   *
   * Resetting this in an effect instead left one render in between: effects run after paint,
   * so a newly loaded presentation was rendered with the previous one's index still in
   * place. When it held fewer credentials that index pointed past the end and the panel was
   * handed an undefined credential — a mislabelled tab, a "V1.1" tag defaulted from nothing,
   * an empty renderer. Deriving the index below means it is never out of range at all.
   */
  const [selection, setSelection] = useState<{
    presentation: unknown
    index: number
  }>({ presentation, index: 0 })

  const selected =
    selection.presentation === presentation &&
    selection.index < credentials.length
      ? selection.index
      : 0

  const select = (index: number) => setSelection({ presentation, index })

  /**
   * Arrow/Home/End movement between tabs, per the ARIA tabs pattern. Without it the strip
   * was reachable by Tab and activated by Enter, but could not be moved through — and with
   * the roving tabIndex below, Tab now leaves the strip rather than walking every credential.
   */
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const last = credentials.length - 1
    let next: number
    switch (event.key) {
      case 'ArrowRight':
        next = selected === last ? 0 : selected + 1
        break
      case 'ArrowLeft':
        next = selected === 0 ? last : selected - 1
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = last
        break
      default:
        return
    }
    event.preventDefault()
    select(next)
    tabRefs.current[next]?.focus()
  }

  if (credentials.length === 0) return null

  const active = credentials[selected]
  const activeResult = verifications[selected]
  const issuer = activeResult?.issuer

  return (
    <div className="vr-vc-tabs" data-testid="credential-tabs">
      <div className="vr-vc-tabs-caption">Credentials in this presentation</div>

      <div className="vr-vc-tabs-wrapper">
        <div
          className="vr-vc-tablist"
          role="tablist"
          aria-label="Credentials in this presentation"
          onKeyDown={onTabKeyDown}
        >
          {credentials.map((credential, index) => {
            const isActive = index === selected
            const result = verifications[index]
            return (
              <button
                key={credential?.id ?? index}
                id={`credential-tab-${index}`}
                ref={el => {
                  tabRefs.current[index] = el
                }}
                role="tab"
                aria-selected={isActive}
                aria-controls={`credential-panel-${index}`}
                // Roving tabIndex: the strip is one Tab stop and the arrow keys move
                // within it, rather than every credential being its own Tab stop.
                tabIndex={isActive ? 0 : -1}
                className={`vr-vc-tab ${isActive ? 'vr-vc-tab--active' : ''}`}
                onClick={() => select(index)}
              >
                <span className="vr-vc-tab-status" aria-hidden="true">
                  {result?.loading ? (
                    <Spinner />
                  ) : result?.isValid ? (
                    <CheckCircle />
                  ) : (
                    <CrossCircle />
                  )}
                </span>
                <span className="vr-vc-tab-label">
                  {getCredentialLabel(credential, index)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div
        className="vr-vc-panel"
        id={`credential-panel-${selected}`}
        role="tabpanel"
        aria-labelledby={`credential-tab-${selected}`}
      >
        {/* This credential's own identity and checks — the card above covers the
            presentation envelope, not what is inside it. */}
        <div className="vr-vc-identity">
          <div className="vr-vc-identity-info">
            <span className="vr-issued-by-label">Issued by:</span>
            <span className="vr-issued-by-value">{issuer ?? 'Unknown'}</span>
            {/* The data-model version, matching the tag a standalone credential gets. */}
            <div className="vr-issue-tags">
              <div className="vr-tag vr-tag--secondary">
                <span className="vr-tag-text">
                  {getCredentialVersionTag(active)}
                </span>
              </div>
            </div>
          </div>

          <div
            className="vr-vc-checks"
            data-testid={`credential-checks-${selected}`}
          >
            {CREDENTIAL_CHECKS.map(({ type, label }) => {
              const status = activeResult?.status?.[type]
              return (
                <div
                  key={type}
                  className="vr-check-row"
                  data-testid={`credential-check-${type.toLowerCase()}`}
                  data-status={activeResult?.loading ? 'PENDING' : status}
                >
                  {activeResult?.loading ? (
                    <Spinner />
                  ) : status === 'VALID' ? (
                    <CheckCircle />
                  ) : (
                    <CrossCircle />
                  )}
                  <span className="vr-check-label">{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Keyed so switching tabs remounts the renderer — the iframe holds the previous
            credential's template and does not re-render on a prop change alone. */}
        {/* Named per credential: the renderer downloads whatever it is given under this
            name, and every tab sharing the presentation's filename would save different
            credentials over each other. */}
        <DocumentRenderer
          key={selected}
          rawDocument={active}
          fileName={getCredentialFileName(fileName, active, selected)}
          invalidAttachments={invalidAttachments}
        />
      </div>

      {/* Every tab's `aria-controls` must point at an element that exists, but only the
          selected panel is rendered above — so the inactive tabs referenced nothing. These
          stand in for them, empty and hidden. Rendering their content instead would mount a
          DocumentRenderer, and therefore an iframe, per credential. */}
      {credentials.map((_, index) =>
        index === selected ? null : (
          <div
            key={index}
            id={`credential-panel-${index}`}
            role="tabpanel"
            aria-labelledby={`credential-tab-${index}`}
            hidden
          />
        )
      )}
    </div>
  )
}

export default CredentialTabs
