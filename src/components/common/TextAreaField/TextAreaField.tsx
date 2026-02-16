import React from 'react'

interface TextAreaFieldProps {
  isDarkMode: boolean
  id: string
  label: string
  value: string
  onChange: React.Dispatch<React.SetStateAction<string>>
  placeholder?: string
  required?: boolean
  rows?: number
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
}: TextAreaFieldProps) => {
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
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={`w-full px-3 py-2 rounded-lg border text-sm font-medium font-gilroy outline-none transition-colors resize-none ${
          isDarkMode
            ? 'bg-transparent border-white/10 text-neutral-60 placeholder:text-neutral-30 focus:border-primary-60'
            : 'bg-white/70 border-black/10 text-neutral-10 placeholder:text-neutral-30 focus:border-primary-60'
        }`}
      />
    </div>
  )
}

export default TextAreaField
