import React, { useState } from 'react'

interface AddressBookHelpTooltipProps {
  isDarkMode: boolean
}

const AddressBookHelpTooltip: React.FC<AddressBookHelpTooltipProps> = ({
  isDarkMode,
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="p-1 relative flex items-center">
      <button
        type="button"
        className="min-w-[40px] min-h-[40px] p-[5px] relative overflow-hidden rounded-lg flex justify-center items-center transition-colors duration-200"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = isDarkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)'
          setShowTooltip(true)
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent'
          setShowTooltip(false)
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61524 21.75 2.25 17.3848 2.25 12C2.25 6.61523 6.61524 2.25002 12 2.25ZM12 3.75C7.44366 3.75002 3.75 7.44366 3.75 12C3.75 16.5563 7.44366 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75ZM12.0078 16.25C12.56 16.2502 13.0078 16.6978 13.0078 17.25V17.2578C13.0076 17.8098 12.5598 18.2576 12.0078 18.2578H12C11.4478 18.2578 11.0002 17.8099 11 17.2578V17.25C11 16.6977 11.4477 16.25 12 16.25H12.0078ZM9.2207 6.7666C10.7693 5.41159 13.2317 5.41159 14.7803 6.7666C16.4068 8.19008 16.4068 10.5599 14.7803 11.9834C14.506 12.2234 14.204 12.4197 13.8867 12.5732C13.6008 12.7116 13.3576 12.8882 13.1982 13.0703C13.0442 13.2465 13 13.3879 13 13.5V14.25C13 14.8023 12.5523 15.25 12 15.25C11.4478 15.2499 11 14.8022 11 14.25V13.5C11 12.0709 12.1774 11.1792 13.0156 10.7734C13.179 10.6944 13.3293 10.5954 13.4629 10.4785C14.1791 9.8518 14.1791 8.8982 13.4629 8.27148C12.6683 7.57632 11.3316 7.57628 10.5371 8.27148C10.1215 8.63495 9.4896 8.59326 9.12598 8.17773C8.76231 7.7621 8.80509 7.13028 9.2207 6.7666Z"
            fill={isDarkMode ? '#7D80D7' : '#5B5BB3'}
          />
        </svg>
      </button>
      {showTooltip && (
        <div
          className="w-[240px] p-2 absolute z-10 flex flex-col right-0"
          style={{
            top: 50,
            background: isDarkMode
              ? 'rgba(30, 32, 38, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0px 2px 8px rgba(104, 106, 210, 0.33)',
            borderRadius: 8,
            outline: '1px solid rgba(169, 178, 187, 0.33)',
            outlineOffset: -1,
          }}
        >
          <span
            className="self-stretch text-center font-avenir font-medium text-[12px] leading-[19.8px]"
            style={{ color: isDarkMode ? '#808894' : '#5B6571' }}
          >
            Swap wallet addresses for recognisable names.
            <br />
            Select &apos;Local&apos; to use your local address book contacts, or
            connect an API to automatically label known addresses.
          </span>
        </div>
      )}
    </div>
  )
}

export default AddressBookHelpTooltip
