import React from 'react'

interface TextFieldProps {
  isDarkMode: boolean
  id: string
  label: string
  value: string
  onChange: React.Dispatch<React.SetStateAction<string>>
  placeholder?: string
  type?: string
  required?: boolean
  error?: string
}

const TextField = ({
  isDarkMode,
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  error,
}: TextFieldProps) => {
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
      <input
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full h-10 px-3 rounded-lg border text-sm font-medium font-gilroy outline-none transition-colors ${
          error
            ? 'border-red-500 focus:border-red-500'
            : isDarkMode
              ? 'bg-transparent border-white/10 text-neutral-60 placeholder:text-neutral-30 focus:border-primary-60'
              : 'bg-white/70 border-black/10 text-neutral-10 placeholder:text-neutral-30 focus:border-primary-60'
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default TextField
