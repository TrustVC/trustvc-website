import { ReactNode } from 'react'

interface JsonTextareaProps {
  id: string
  label: string
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  actions?: ReactNode
}

const JsonTextarea = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
  actions,
}: JsonTextareaProps) => (
  <div className="flex w-full flex-col gap-2">
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-sm font-semibold text-neutral-10">
        {label}
      </label>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
    <textarea
      id={id}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      rows={16}
      spellCheck={false}
      className="w-full rounded-lg border border-neutral-60 bg-white px-3 py-2 font-mono text-sm text-neutral-10 placeholder:text-neutral-50 focus:border-primary-60 focus:outline-none"
    />
  </div>
)

export default JsonTextarea
