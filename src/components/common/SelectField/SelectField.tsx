import React, { useState } from 'react'
import clsx from 'clsx'
import type { EnquiryType } from '@/hooks/useContactForm'
import { FieldError } from '@/components/common/FieldError'

interface SelectFieldProps {
  isDarkMode: boolean
  id: string
  label: string
  value: EnquiryType
  onChange: React.Dispatch<React.SetStateAction<EnquiryType>>
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
  const hasError = Boolean(error)

  const triggerClassName = clsx(
    'select-field-trigger',
    isDarkMode ? 'select-field-trigger--dark' : 'select-field-trigger--light',
    hasError && 'select-field-trigger--error'
  )

  const selectedTextClassName = clsx(
    'select-field-value',
    selected.value === ''
      ? isDarkMode
        ? 'select-field-value--placeholder-dark'
        : 'select-field-value--placeholder-light'
      : isDarkMode
        ? 'select-field-value--selected-dark'
        : 'select-field-value--selected-light'
  )

  const menuClassName = clsx(
    'select-field-menu',
    isDarkMode ? 'select-field-menu--dark' : 'select-field-menu--light'
  )

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
            onBlur?.()
          }
        }}
      >
        <button
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={triggerClassName}
          onClick={() => setIsOpen(open => !open)}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className={selectedTextClassName}>{selected.label}</span>
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
          <div className={menuClassName} role="listbox" aria-labelledby={id}>
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
                className={clsx(
                  'select-field-option',
                  value === option.value
                    ? isDarkMode
                      ? 'select-field-option--selected-dark'
                      : 'select-field-option--selected-light'
                    : isDarkMode
                      ? 'select-field-option--dark'
                      : 'select-field-option--light'
                )}
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
