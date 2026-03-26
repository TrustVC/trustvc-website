import React, { useState } from 'react'
import type { EnquiryType } from '@/pages/Contact/hooks/useContactForm'
import { FieldError } from '@/components/common/FieldError'

interface SelectFieldProps {
  isDarkMode: boolean
  id: string
  label: string
  value: EnquiryType
  onChange: React.Dispatch<React.SetStateAction<EnquiryType>>
  required?: boolean
  error?: string
  onBlur?: () => void
}

const SelectField = ({
  isDarkMode,
  id,
  label,
  value,
  onChange,
  required,
  error,
  onBlur,
}: SelectFieldProps) => {
  const options: { value: EnquiryType; label: string }[] = [
    { value: '', label: 'Select an option.' },
    { value: 'General_Enquiry', label: 'General Enquiry' },
    { value: 'OpenCerts', label: 'OpenCerts' },
    { value: 'TradeTrust', label: 'TradeTrust' },
  ]

  const selected = options.find(o => o.value === value) ?? options[0]
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <label
        className={`form-label ${
          isDarkMode ? 'text-neutral-50' : 'text-neutral-20'
        }`}
        htmlFor={id}
      >
        {label}
      </label>

      <div
        className="relative"
        tabIndex={-1}
        onBlur={e => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setIsOpen(false)
            onBlur?.()
          }
        }}
      >
        <button
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full min-h-[48px] sm:min-h-[40px] rounded-lg border px-3 pr-10 py-3 sm:py-2 text-left text-base sm:text-sm font-gilroy flex items-center justify-between cursor-pointer transition-colors ${
            error
              ? 'border-red-500'
              : isDarkMode
                ? 'bg-black/10 border-white/15'
                : 'bg-white/90 border-black/15'
          }`}
          onClick={() => setIsOpen(open => !open)}
        >
          <span
            className={
              selected.value === ''
                ? 'text-neutral-30'
                : isDarkMode
                  ? 'text-neutral-60'
                  : 'text-neutral-10'
            }
          >
            {selected.label}
          </span>
          <span
            className={`pointer-events-none inline-flex items-center absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          >
            <img
              src={
                isDarkMode
                  ? '/icons/chevron-down-dark.svg'
                  : '/icons/chevron-down.svg'
              }
              alt=""
              className="h-5 w-5"
              aria-hidden="true"
            />
          </span>
        </button>

        {isOpen && (
          <div
            className={`absolute z-10 mt-1 w-full rounded-lg border shadow-lg ${
              isDarkMode
                ? 'bg-neutral-800 border-white/10'
                : 'bg-white border-black/10'
            }`}
            role="listbox"
            aria-labelledby={id}
          >
            {options.slice(1).map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`block w-full px-3 py-2 text-left text-sm font-gilroy transition-colors ${
                  value === option.value
                    ? 'bg-primary-60/10 text-primary-60'
                    : 'text-neutral-10 hover:bg-neutral-10/5'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <FieldError message={error} id={`${id}-error`} />}
    </div>
  )
}

export default SelectField
