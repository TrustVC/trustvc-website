import React from 'react'

interface VerifyResultProps {
  fileName: string
  getGroupStatus: (_type: string) => 'VALID' | 'INVALID'
  onReset: () => void
}

const FRAGMENT_GROUPS = [
  { type: 'DOCUMENT_INTEGRITY', label: 'Document Integrity' },
  { type: 'DOCUMENT_STATUS', label: 'Document Status' },
  { type: 'ISSUER_IDENTITY', label: 'Issuer Identity' },
]

const VerifyResult: React.FC<VerifyResultProps> = ({
  fileName,
  getGroupStatus,
  onReset,
}) => (
  <div className="frame-dropbox">
    <div className="dropbox-area dropbox-area--result">
      {/* Status header */}
      <div className="verify-status-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#22c55e" />
          <path
            d="M7 12.5l3.5 3.5 6.5-7"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <div className="verify-status-title verify-status-title--valid">
            Document Verified
          </div>
          <div className="verify-status-filename">{fileName}</div>
        </div>
      </div>

      {/* Fragment checks */}
      <div className="verify-fragment-list">
        {FRAGMENT_GROUPS.map(({ type, label }) => {
          const groupStatus = getGroupStatus(type)
          return (
            <div key={type} className="verify-fragment-row">
              {groupStatus === 'VALID' && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="8" fill="#22c55e" />
                  <path
                    d="M4.5 8.5l2.5 2.5 4.5-5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {groupStatus === 'INVALID' && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="8" fill="#ef4444" />
                  <path
                    d="M5 5l6 6M11 5l-6 6"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <span className="verify-fragment-label">{label}</span>
              <span
                className={`verify-fragment-status verify-fragment-status--${groupStatus.toLowerCase()}`}
              >
                {groupStatus}
              </span>
            </div>
          )
        })}
      </div>

      {/* Reset button */}
      <button onClick={onReset} className="verify-ghost-button">
        Verify another document
      </button>
    </div>
  </div>
)

export default VerifyResult
