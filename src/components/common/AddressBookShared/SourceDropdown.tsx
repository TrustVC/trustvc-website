import React, { useCallback, useEffect, useRef, useState } from 'react'

interface SourceDropdownProps {
  selectedSource: string
  resolvers: { name: string }[]
  onSourceChange: (source: string) => void
  isDarkMode: boolean
}

const SourceDropdown: React.FC<SourceDropdownProps> = ({
  selectedSource,
  resolvers,
  onSourceChange,
  isDarkMode,
}) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node)
    ) {
      setShowDropdown(false)
    }
  }, [])

  useEffect(() => {
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown, handleClickOutside])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && showDropdown) {
      setShowDropdown(false)
    }
  }

  const displayName = selectedSource === 'local' ? 'Local' : selectedSource
  const hasResolvers = resolvers.length > 0

  return (
    <div
      ref={dropdownRef}
      className="flex-1 min-w-0 min-h-[32px] p-1 relative rounded-lg flex items-center"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          border: isDarkMode ? '1px solid #808894' : '1px solid #5B6571',
        }}
      />
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={!hasResolvers}
        aria-haspopup="listbox"
        aria-expanded={showDropdown}
        aria-label="Select address book source"
        className={`relative z-10 w-full min-h-[32px] overflow-hidden rounded-md flex items-center bg-transparent ${hasResolvers ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="w-1 self-stretch" />
        <div className="flex-1 min-h-[32px] px-1 py-[5px] flex items-center justify-start">
          <span
            className="flex-1 font-avenir font-medium text-[14px] leading-[21.7px] truncate text-left"
            style={{ color: isDarkMode ? '#C8CDD3' : '#1E2026' }}
          >
            <span style={{ opacity: hasResolvers ? 1 : 0.33 }}>
              {displayName}
            </span>
          </span>
        </div>
        <svg
          width="8"
          height="32"
          viewBox="0 0 8 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: hasResolvers ? 1 : 0 }}
        >
          <path d="M4 4V28" stroke="rgba(169, 178, 187, 0.33)" />
        </svg>
        <div
          className="min-h-[32px] overflow-hidden flex justify-center items-center"
          style={{ opacity: hasResolvers ? 1 : 0.33 }}
        >
          <div className="min-w-[32px] min-h-[32px] p-0.5 overflow-hidden rounded-md flex justify-center items-center">
            <div className="p-1 flex justify-center items-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  transform: showDropdown ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.5898 5.41489C11.8828 5.12235 12.3577 5.12189 12.6503 5.41489C12.9428 5.70786 12.942 6.18275 12.6493 6.47543L8.54095 10.5799C8.53824 10.5827 8.5359 10.5859 8.53314 10.5887C8.47725 10.6447 8.4123 10.686 8.34564 10.7205C8.29429 10.7472 8.24152 10.7681 8.18646 10.7821C7.93902 10.8448 7.66655 10.7827 7.47259 10.5897L3.35052 6.47641C3.05764 6.18389 3.05731 5.709 3.34954 5.41586C3.64215 5.12276 4.11791 5.12231 4.41107 5.41489L7.93158 8.9266C7.97055 8.9652 8.03324 8.96521 8.0722 8.9266L11.5898 5.41489Z"
                  fill={isDarkMode ? '#808894' : '#5B6571'}
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="w-1 self-stretch" />
      </button>
      {showDropdown && (
        <div
          role="listbox"
          aria-label="Address book sources"
          className="absolute left-0 top-full mt-1 w-full z-[100] rounded-lg overflow-hidden"
          style={{
            background: isDarkMode ? '#1E2026' : '#ffffff',
            boxShadow: '0px 2px 8px rgba(104, 106, 210, 0.33)',
            border: '1px solid rgba(169, 178, 187, 0.33)',
          }}
        >
          <button
            type="button"
            role="option"
            aria-selected={selectedSource === 'local'}
            onClick={() => {
              onSourceChange('local')
              setShowDropdown(false)
            }}
            className="w-full px-3 py-2 text-left font-avenir font-medium text-[14px] leading-[21.7px] transition-colors duration-150"
            style={{
              color: isDarkMode ? '#C8CDD3' : '#1E2026',
              background:
                selectedSource === 'local'
                  ? isDarkMode
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)'
                  : 'transparent',
              fontWeight: selectedSource === 'local' ? '700' : '500',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = isDarkMode
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)'
            }}
            onMouseLeave={e => {
              if (selectedSource !== 'local')
                e.currentTarget.style.background = 'transparent'
            }}
          >
            Local
          </button>
          {resolvers.map(r => (
            <button
              key={r.name}
              type="button"
              role="option"
              aria-selected={selectedSource === r.name}
              onClick={() => {
                onSourceChange(r.name)
                setShowDropdown(false)
              }}
              className="w-full px-3 py-2 text-left font-avenir font-medium text-[14px] leading-[21.7px] transition-colors duration-150"
              style={{
                color: isDarkMode ? '#C8CDD3' : '#1E2026',
                background:
                  selectedSource === r.name
                    ? isDarkMode
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.04)'
                    : 'transparent',
                fontWeight: selectedSource === r.name ? '700' : '500',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = isDarkMode
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)'
              }}
              onMouseLeave={e => {
                if (selectedSource !== r.name)
                  e.currentTarget.style.background = 'transparent'
              }}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SourceDropdown
