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
  const optionItems = options.slice(1)

  const handleTriggerKeyDown: React.KeyboardEventHandler<
    HTMLButtonElement
  > = e => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(true)
      return
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextId = `${id}-option-${(index + 1) % optionItems.length}`
      document.getElementById(nextId)?.focus()
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevId =
        index === 0
          ? `${id}-option-${optionItems.length - 1}`
          : `${id}-option-${index - 1}`
      document.getElementById(prevId)?.focus()
    }
  }

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
          }
          onBlur?.()
        }}
      >
        <button
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full min-h-[48px] sm:min-h-[40px] rounded-lg border px-3 pr-10 py-3 sm:py-2 text-left text-base sm:text-sm font-gilroy flex items-center justify-between cursor-pointer transition-colors ${
            error
              ? 'border-red-500'
              : isDarkMode
                ? 'bg-black/10 border-white/15'
                : 'bg-white/90 border-black/15'
          }`}
          onClick={() => setIsOpen(open => !open)}
          onKeyDown={handleTriggerKeyDown}
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
                ? 'border-white/15 bg-[#1E2026]'
                : 'border-black/10 bg-white'
            }`}
            role="listbox"
            aria-labelledby={id}
          >
            {optionItems.map((option, index) => (
              <button
                key={option.value}
                id={`${id}-option-${index}`}
                type="button"
                role="option"
                aria-selected={value === option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                onKeyDown={e => handleOptionKeyDown(e, index)}
                className={`block w-full px-3 py-2 text-left text-sm font-gilroy transition-colors ${
                  value === option.value
                    ? 'bg-primary-60/10 text-primary-60'
                    : isDarkMode
                      ? 'text-neutral-60 hover:bg-white/10'
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
