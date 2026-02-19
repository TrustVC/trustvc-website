import React from 'react'
import { EnquiryType } from '@/hooks/useContactForm'

interface SelectFieldProps {
  isDarkMode: boolean
  id: string
  label: string
  value: EnquiryType
  onChange: React.Dispatch<React.SetStateAction<EnquiryType>>
  required?: boolean
  error?: string
}

const SelectField = ({
  isDarkMode,
  id,
  label,
  value,
  onChange,
  required,
  error,
}: SelectFieldProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label
        className={`text-xs font-semibold font-gilroy ${
          isDarkMode ? 'text-neutral-50' : 'text-neutral-20'
        }`}
        htmlFor={id}
      >
        {label}
      </label>

      <div
        className={`relative w-full min-h-[48px] sm:min-h-[40px] rounded-lg border flex items-center cursor-pointer ${
          error
            ? 'border-red-500'
            : isDarkMode
              ? 'bg-black/10 border-white/15'
              : 'bg-white/90 border-black/15'
        }`}
      >
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value as EnquiryType)}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full min-h-[48px] sm:min-h-[40px] bg-transparent text-base sm:text-sm font-gilroy outline-none appearance-none pl-3 pr-10 py-3 sm:py-2 cursor-pointer ${
            value === ''
              ? 'text-neutral-30'
              : isDarkMode
                ? 'text-neutral-60'
                : 'text-neutral-10'
          }`}
        >
          <option value="" disabled>
            Select an option.
          </option>
          <option value="General_Enquiry">General Enquiry</option>
          <option value="OpenCerts">OpenCerts</option>
          <option value="TradeTrust">TradeTrust</option>
        </select>

        <div className="absolute right-3 pointer-events-none">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.7 9.7a1 1 0 0 1 1.4 0L12 13.6l3.9-3.9a1 1 0 1 1 1.4 1.4l-4.6 4.6a1 1 0 0 1-1.4 0L6.7 11.1a1 1 0 0 1 0-1.4Z"
              fill={isDarkMode ? '#A9B2BB' : '#5B6571'}
            />
          </svg>
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default SelectField
