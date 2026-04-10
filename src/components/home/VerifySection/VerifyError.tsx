import React from 'react'

interface VerifyErrorProps {
  errorMessage: string
  onReset: () => void
}

const VerifyError: React.FC<VerifyErrorProps> = ({ errorMessage, onReset }) => (
  <div className="frame-dropbox">
    <div className="dropbox-area dropbox-area--home dropbox-area--centered">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#ef4444" />
        <path
          d="M10 10l12 12M22 10l-12 12"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <div className="verify-error-message">{errorMessage}</div>
      <button type="button" onClick={onReset} className="verify-ghost-button">
        Try again
      </button>
    </div>
  </div>
)

export default VerifyError
