import React, { useState } from 'react'
import { DocumentAttachment } from '../../../utils/helper'
import { ExclamationCircle, ChevronUp, ChevronDown } from '../../common/Icons'

interface InvalidAttachmentsBannerProps {
  invalidAttachments: DocumentAttachment[]
}

const InvalidAttachmentsBanner: React.FC<InvalidAttachmentsBannerProps> = ({
  invalidAttachments,
}) => {
  const [expanded, setExpanded] = useState(false)

  if (invalidAttachments.length === 0) return null

  return (
    <div className="vr-invalid-banner" role="alert">
      <div className="vr-invalid-banner-header">
        <div className="vr-invalid-banner-title-row">
          <ExclamationCircle />
          <span className="vr-invalid-banner-title">
            Unable To Load Attachment
          </span>
        </div>
        <button
          type="button"
          className="vr-invalid-banner-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <span className="vr-invalid-banner-toggle-label">Show Less</span>
              <ChevronUp />
            </>
          ) : (
            <>
              <span className="vr-invalid-banner-toggle-label">Show More</span>
              <ChevronDown />
            </>
          )}
        </button>
      </div>
      {expanded && (
        <div className="vr-invalid-banner-body">
          <div className="vr-invalid-banner-spacer" />
          <div className="vr-invalid-banner-text">
            <span className="vr-invalid-banner-desc">
              There is a problem loading the following attachments:
            </span>
            <ul className="vr-invalid-banner-list">
              {invalidAttachments.map((att, idx) => (
                <li
                  key={`${idx}-${att.filename}`}
                  className="vr-invalid-banner-file"
                >
                  {att.filename || `Attachment ${idx + 1}`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvalidAttachmentsBanner
