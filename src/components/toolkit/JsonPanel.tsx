import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import ToolkitIcon from './ToolkitIcon'
import { TOOLKIT_ASSETS } from './assets'

type JsonPanelProps = {
  id: string
  label: string
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  isDarkMode: boolean
  showClear?: boolean
  showDownload?: boolean
  downloadName?: string
}

const JsonPanel = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  readOnly,
  isDarkMode,
  showClear = true,
  showDownload = false,
  downloadName = 'document.json',
}: JsonPanelProps) => {
  const [copyError, setCopyError] = useState(false)
  const copyAttemptRef = useRef(0)

  useEffect(() => {
    copyAttemptRef.current += 1
    setCopyError(false)
  }, [value])

  const copyValue = async () => {
    if (!value) return
    const attemptId = ++copyAttemptRef.current
    try {
      await navigator.clipboard.writeText(value)
      if (attemptId !== copyAttemptRef.current) return
      setCopyError(false)
    } catch {
      if (attemptId !== copyAttemptRef.current) return
      setCopyError(true)
    }
  }

  const downloadValue = () => {
    if (!value) return
    const blob = new Blob([value], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = downloadName
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col w-full min-w-0">
      <div className="flex items-center justify-between pb-2">
        <label
          htmlFor={id}
          className={clsx(
            'font-urbanist font-extrabold text-sm sm:text-base tracking-[0.99px] uppercase',
            isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
          )}
        >
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          {copyError && (
            <span
              role="status"
              aria-live="polite"
              className="font-avenir text-xs text-[#E62617]"
            >
              Copy failed
            </span>
          )}
          <button
            type="button"
            onClick={copyValue}
            aria-label={`Copy ${label}`}
            disabled={!value}
            className={iconButtonClass(isDarkMode)}
          >
            <ToolkitIcon src={TOOLKIT_ASSETS.copy} alt="" size={24} />
          </button>
          {showClear && onChange && (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label={`Clear ${label}`}
              disabled={!value}
              className={iconButtonClass(isDarkMode)}
            >
              <ToolkitIcon src={TOOLKIT_ASSETS.trash} alt="" size={24} />
            </button>
          )}
          {showDownload && (
            <button
              type="button"
              onClick={downloadValue}
              aria-label={`Download ${label}`}
              disabled={!value}
              className={iconButtonClass(isDarkMode)}
            >
              <ToolkitIcon src={TOOLKIT_ASSETS.download} alt="" size={24} />
            </button>
          )}
        </div>
      </div>
      <textarea
        id={id}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={event => onChange?.(event.target.value)}
        spellCheck={false}
        className={clsx(
          'w-full h-[180px] sm:h-[260px] lg:h-[360px] min-h-[140px] px-3 sm:px-4 py-3 rounded-lg border text-sm font-avenir leading-[1.55] outline-none resize-y',
          isDarkMode
            ? 'bg-transparent border-white/20 text-neutral-60 placeholder:text-neutral-30 focus:border-primary-60'
            : 'bg-white border-neutral-50 text-neutral-10 placeholder:text-neutral-30 focus:border-primary-60'
        )}
      />
    </div>
  )
}

const iconButtonClass = (_isDarkMode: boolean) =>
  'min-w-10 min-h-10 w-10 h-10 flex items-center justify-center rounded-lg border border-primary-60/40 hover:bg-primary-60/10 disabled:opacity-40'

export default JsonPanel
