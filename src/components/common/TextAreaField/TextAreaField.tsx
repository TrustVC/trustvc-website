import React from 'react'
import { FieldError } from '@/components/common/FieldError'

interface TextAreaFieldProps {
  isDarkMode: boolean
  id: string
  label: string
  value: string
  onChange: React.Dispatch<React.SetStateAction<string>>
  placeholder?: string
  required?: boolean
  rows?: number
  error?: string
  onBlur?: () => void
}

const TextAreaField = ({
  isDarkMode,
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  rows = 4,
  error,
  onBlur,
}: TextAreaFieldProps) => {
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
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full px-3 py-2 rounded-lg border text-sm font-medium font-gilroy outline-none transition-colors resize-none ${
          error
            ? 'border-red-500 focus:border-red-500'
            : isDarkMode
              ? 'bg-transparent border-white/10 text-neutral-60 placeholder:text-neutral-30 focus:border-primary-60'
              : 'bg-white/70 border-black/10 text-neutral-10 placeholder:text-neutral-30 focus:border-primary-60'
        }`}
      />
      {error && <FieldError message={error} id={`${id}-error`} />}
    </div>
  )
}

export default TextAreaField
