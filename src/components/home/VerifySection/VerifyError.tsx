import React from 'react'
import { MESSAGES, type VerifyErrorType } from './verifyErrorUtils'

const ErrorDocumentIcon: React.FC = () => (
  <svg
    width="115"
    height="145"
    viewBox="0 0 115 145"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M45.0068 0C83.6668 0 115.007 31.3401 115.007 70V72.4189C115.007 72.4453 115.008 72.4717 115.008 72.498V77.4805C115.008 77.4925 115.007 77.5046 115.007 77.5166V129.995C115.007 138.279 108.291 144.995 100.007 144.995H15C6.71573 144.995 0 138.279 0 129.995V15C5.0105e-06 6.71574 6.71573 1.43614e-07 15 0H45.0068ZM15 10C12.2386 10 10 12.2386 10 15V129.995C10 132.757 12.2386 134.995 15 134.995H100.007C102.768 134.995 105.007 132.757 105.007 129.995V72.4219C104.966 62.7921 97.1473 54.998 87.5078 54.998H73.7549C66.8515 54.9979 61.2549 49.4015 61.2549 42.498V27.5C61.2549 17.835 53.4199 10 43.7549 10H15ZM70.8008 102.48C73.5622 102.48 75.8008 104.719 75.8008 107.48C75.8008 110.242 73.5622 112.48 70.8008 112.48H50.8008C48.0394 112.48 45.8008 110.242 45.8008 107.48C45.8008 104.719 48.0394 102.48 50.8008 102.48H70.8008ZM42.2656 63.9453C44.2182 61.9927 47.3833 61.9927 49.3359 63.9453C51.2886 65.8979 51.2886 69.063 49.3359 71.0156L45.7246 74.6269C45.5294 74.8222 45.5294 75.1388 45.7246 75.334L49.3359 78.9453C51.2886 80.8979 51.2886 84.063 49.3359 86.0156C47.3833 87.9682 44.2182 87.9682 42.2656 86.0156L38.6543 82.4043C38.4591 82.2091 38.1425 82.2091 37.9472 82.4043L34.3359 86.0156C32.3833 87.9682 29.2182 87.9682 27.2656 86.0156C25.313 84.063 25.313 80.8979 27.2656 78.9453L30.8769 75.334C31.0722 75.1388 31.0722 74.8222 30.8769 74.6269L27.2656 71.0156C25.313 69.063 25.313 65.8979 27.2656 63.9453C29.2182 61.9927 32.3833 61.9927 34.3359 63.9453L37.9472 67.5566C38.1425 67.7519 38.4591 67.7519 38.6543 67.5566L42.2656 63.9453ZM82.2656 63.9453C84.2182 61.9927 87.3833 61.9927 89.3359 63.9453C91.2886 65.8979 91.2886 69.063 89.3359 71.0156L85.7246 74.6269C85.5294 74.8222 85.5294 75.1388 85.7246 75.334L89.3359 78.9453C91.2886 80.8979 91.2886 84.063 89.3359 86.0156C87.3833 87.9682 84.2182 87.9682 82.2656 86.0156L78.6543 82.4043C78.4591 82.2091 78.1425 82.2091 77.9472 82.4043L74.3359 86.0156C72.3833 87.9682 69.2182 87.9682 67.2656 86.0156C65.313 84.063 65.313 80.8979 67.2656 78.9453L70.8769 75.334C71.0722 75.1388 71.0722 74.8222 70.8769 74.6269L67.2656 71.0156C65.313 69.063 65.313 65.8979 67.2656 63.9453C69.2182 61.9927 72.3833 61.9927 74.3359 63.9453L77.9472 67.5566C78.1425 67.7519 78.4591 67.7519 78.6543 67.5566L82.2656 63.9453ZM69.3193 15.1305C68.89 14.94 68.461 15.4033 68.6606 15.8284C70.3242 19.3715 71.2549 23.3269 71.2549 27.5V42.498C71.2549 43.8787 72.3743 44.9979 73.7549 44.998H87.5078C91.9404 44.998 96.1278 46.0474 99.8358 47.9105C100.255 48.1211 100.729 47.7058 100.551 47.2718C94.6834 32.9462 83.4354 21.3946 69.3193 15.1305Z"
      fill="currentColor"
    />
  </svg>
)

const ErrorCircleIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM12 3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75ZM13.7197 9.21973C14.0126 8.92683 14.4874 8.92683 14.7803 9.21973C15.0732 9.51262 15.0732 9.98738 14.7803 10.2803L13.1309 11.9297C13.0923 11.9686 13.0923 12.0314 13.1309 12.0703L14.7803 13.7197C15.0732 14.0126 15.0732 14.4874 14.7803 14.7803C14.4874 15.0732 14.0126 15.0732 13.7197 14.7803L12.0703 13.1309C12.0314 13.0923 11.9686 13.0923 11.9297 13.1309L10.2803 14.7803C9.98738 15.0732 9.51262 15.0732 9.21973 14.7803C8.92683 14.4874 8.92683 14.0126 9.21973 13.7197L10.8691 12.0703C10.9077 12.0314 10.9077 11.9686 10.8691 11.9297L9.21973 10.2803C8.92683 9.98738 8.92683 9.51262 9.21973 9.21973C9.51262 8.92683 9.98738 8.92683 10.2803 9.21973L11.9297 10.8691C11.9686 10.9077 12.0314 10.9077 12.0703 10.8691L13.7197 9.21973Z"
      fill="currentColor"
    />
  </svg>
)

interface VerifyErrorProps {
  errorType: VerifyErrorType
  onReset: () => void
}

const VerifyError: React.FC<VerifyErrorProps> = ({ errorType, onReset }) => {
  const { failureTitle, failureMessage } = MESSAGES[errorType]

  return (
    <div className="self-stretch rounded-xl flex flex-col justify-center items-center gap-4">
      <div className="self-stretch flex flex-col">
        {/* Alert card */}
        <div className="self-stretch p-6 bg-alert-100 rounded-xl border border-alert-50 flex flex-col items-center">
          {/* Document icon */}
          <div className="self-stretch p-2 flex flex-col gap-2.5">
            <div className="self-stretch p-2 flex justify-center items-center gap-2.5 text-alert-50">
              <ErrorDocumentIcon />
            </div>
          </div>

          {/* Error & recovery messages */}
          <div className="self-stretch p-2 flex flex-col gap-2.5">
            <div className="self-stretch p-1 flex flex-col justify-center items-center">
              {/* Error message row */}
              <div className="self-stretch p-1 flex justify-center items-center gap-2.5">
                <span className="text-alert-50">
                  <ErrorCircleIcon />
                </span>
                <div
                  data-testid="error-message"
                  className="text-center text-alert-50 text-lg font-gilroy font-bold leading-relaxed break-words"
                >
                  {failureTitle}
                </div>
              </div>

              {/* Recovery message */}
              <div className="self-stretch p-1 flex justify-center items-center gap-2.5">
                <div
                  data-testid="recovery-message"
                  className="text-center text-neutral-20 text-sm font-avenir font-medium leading-snug break-words"
                >
                  {failureMessage}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="self-stretch p-2 flex flex-col gap-2.5">
            <div className="self-stretch p-1 flex justify-center items-center flex-wrap content-center">
              {/* What Should I Do? button */}
              <div className="flex-1 max-w-[360px] min-w-[240px] p-1 flex flex-col justify-center items-center gap-2.5">
                <button
                  type="button"
                  data-testid="what-should-i-do-btn"
                  className="self-stretch min-w-[40px] min-h-[40px] p-[5px] relative overflow-hidden rounded-lg flex justify-center items-center border border-[rgba(169,178,187,0.33)] !bg-transparent hover:!bg-alert-50/10 transition-colors cursor-pointer"
                  onClick={() =>
                    window.open(
                      'https://docs.trustvc.io',
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                >
                  <div className="p-1 flex items-center gap-2.5">
                    <span className="text-center text-alert-50 text-sm font-gilroy font-bold leading-snug">
                      What Should I Do?
                    </span>
                  </div>
                </button>
              </div>

              {/* Try Another Document button */}
              <div className="flex-1 max-w-[360px] min-w-[240px] p-1 flex flex-col justify-center items-center gap-2.5">
                <button
                  type="button"
                  data-testid="try-another-btn"
                  className="self-stretch min-w-[40px] min-h-[40px] p-[5px] relative bg-alert-50 overflow-hidden rounded-lg flex justify-center items-center hover:bg-alert-20 transition-colors cursor-pointer"
                  onClick={onReset}
                >
                  <div className="p-1 flex items-center gap-2.5">
                    <span className="text-center text-white text-sm font-gilroy font-bold leading-snug">
                      Try Another Document
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* File info */}
        <div className="self-stretch p-2 flex justify-center items-center gap-2.5">
          <div className="flex-1 text-neutral-30 text-xs font-avenir font-medium leading-relaxed">
            Maximum 10 MB. Supported files include .tt, .oa, and .json.
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyError
