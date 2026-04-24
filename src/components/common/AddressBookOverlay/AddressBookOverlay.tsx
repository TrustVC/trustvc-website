import React, { useState } from 'react'
import { useAddressBook } from '../../../hooks/useAddressBook'
import { SourceDropdown, AddressBookHelpTooltip } from '../AddressBookShared'

interface AddressBookOverlayProps {
  onAddressSelected?: (address: string) => void
  onDismiss: () => void
  isDarkMode?: boolean
}

const AddressBookOverlay: React.FC<AddressBookOverlayProps> = ({
  onAddressSelected,
  onDismiss,
  isDarkMode = false,
}) => {
  const { addressBook } = useAddressBook()
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const [selectedSource, setSelectedSource] = useState(
    () => localStorage.getItem('ADDRESS_BOOK_SOURCE') || 'local'
  )
  const sourceName = selectedSource === 'local' ? 'Local' : selectedSource

  // Get resolvers from localStorage
  const resolvers: { name: string; endpoint: string }[] = (() => {
    try {
      return JSON.parse(localStorage.getItem('ADDRESS_RESOLVERS') || '[]')
    } catch {
      return []
    }
  })()

  const handleSourceChange = (source: string) => {
    setSelectedSource(source)
    localStorage.setItem('ADDRESS_BOOK_SOURCE', source)
    setSearchQuery('')
  }

  const displayedAddresses = addressBook.filter(e => e.source === sourceName)

  const filteredAddresses = displayedAddresses.filter(
    entry =>
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const handleSelect = (address: string) => {
    onAddressSelected?.(address)
    onDismiss()
  }

  return (
    <div
      className="w-full max-w-[1280px] min-w-[308px] flex flex-col"
      style={{
        background: isDarkMode
          ? 'linear-gradient(0deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0)), linear-gradient(0deg, rgba(30, 32, 38, 0.66), rgba(30, 32, 38, 0.66))'
          : 'linear-gradient(0deg, rgba(255, 255, 255, 0.66), rgba(255, 255, 255, 0.66)), linear-gradient(0deg, rgba(222, 228, 233, 0), rgba(222, 228, 233, 0))',
        boxShadow: '0px 8px 32px rgba(104, 106, 210, 0.33)',
        borderRadius: 16,
        border: isDarkMode
          ? '1px solid rgba(61, 68, 77, 0.33)'
          : '1px solid rgba(169, 178, 187, 0.33)',
      }}
    >
      {/* Header */}
      <div className="self-stretch pt-6 pb-4 px-6 flex items-start gap-4">
        <span
          className="flex-1 font-['Gilroy'] font-bold text-[24px] leading-[31.92px]"
          style={{ color: isDarkMode ? '#C8CDD3' : '#1E2026' }}
        >
          Address Book
        </span>
      </div>

      {/* Content */}
      <div
        className="self-stretch p-4 overflow-hidden flex flex-col items-center"
        style={{
          borderTop: '1px solid rgba(169, 178, 187, 0.33)',
          borderBottom: '1px solid rgba(169, 178, 187, 0.33)',
        }}
      >
        <div className="self-stretch rounded-xl flex flex-col justify-center items-center gap-4">
          {/* Source + Help Row */}
          <div
            className="self-stretch p-2 rounded-xl flex flex-wrap items-center"
            style={{
              background: isDarkMode ? 'rgba(30, 32, 38, 1)' : 'white',
              outline: '1px solid rgba(169, 178, 187, 0.33)',
              outlineOffset: -1,
            }}
          >
            {/* Left - Label + Dropdown */}
            <div className="flex-1 basis-0 min-w-[290px] max-w-[600px] p-1 flex items-center overflow-visible">
              <div className="p-1 shrink-0">
                <span
                  className="font-['Gilroy'] font-medium text-[16px] leading-[20px] whitespace-nowrap"
                  style={{ color: isDarkMode ? '#808894' : '#3D444D' }}
                >
                  Address Book
                </span>
              </div>
              <div className="flex-1 min-w-0 p-1 flex items-center gap-2">
                <SourceDropdown
                  selectedSource={selectedSource}
                  resolvers={resolvers}
                  onSourceChange={handleSourceChange}
                  isDarkMode={isDarkMode}
                />
              </div>
              {/* Help Icon */}
              <AddressBookHelpTooltip isDarkMode={isDarkMode} />
            </div>
          </div>

          {/* Address List */}
          <div
            className="self-stretch p-2 rounded-xl flex flex-col"
            style={{
              background: isDarkMode ? 'rgba(30, 32, 38, 1)' : 'white',
              outline: '1px solid rgba(169, 178, 187, 0.33)',
            }}
          >
            {/* Search */}
            <div className="self-stretch p-2 overflow-hidden rounded-xl flex items-center">
              <div
                className="min-h-[32px] p-1 rounded-lg flex items-center"
                style={{
                  background: isDarkMode ? 'rgba(30, 32, 38, 1)' : 'white',
                  border: `1px solid ${isDarkMode ? '#A9B2BB' : '#A9B2BB'}`,
                }}
              >
                <div className="min-h-[32px] flex justify-center items-center">
                  <div className="min-w-[32px] min-h-[32px] p-0.5 overflow-hidden rounded-md flex justify-center items-center opacity-[0.33]">
                    <div className="p-1 flex justify-center items-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.07666 1.71094C10.0398 1.71094 12.4418 4.11302 12.4419 7.07617C12.4418 8.25561 12.0596 9.34603 11.4146 10.2314C11.3852 10.2717 11.3891 10.328 11.4243 10.3633L14.0688 13.0078C14.3614 13.3007 14.3616 13.7756 14.0688 14.0684C13.776 14.3608 13.3011 14.3608 13.0083 14.0684L10.3638 11.4238C10.3285 11.3886 10.2732 11.3847 10.2329 11.4141C9.34741 12.0592 8.25622 12.4414 7.07666 12.4414C4.11376 12.4412 1.71163 10.0391 1.71143 7.07617C1.71151 4.11316 4.11368 1.71116 7.07666 1.71094ZM7.07666 3.21094C4.94211 3.21116 3.21151 4.94159 3.21143 7.07617C3.21163 9.21065 4.94219 10.9412 7.07666 10.9414C8.1441 10.9414 9.10977 10.5097 9.81006 9.80957C10.5103 9.10934 10.9418 8.14363 10.9419 7.07617C10.9418 4.94145 9.2114 3.21094 7.07666 3.21094Z"
                          fill={isDarkMode ? '#808894' : '#5B6571'}
                        />
                      </svg>
                    </div>
                  </div>
                  <svg
                    width="8"
                    height="32"
                    viewBox="0 0 8 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 4V28" stroke="rgba(169, 178, 187, 0.33)" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="flex-1 min-w-0 min-h-[32px] px-2 py-[5px] bg-transparent outline-none font-avenir font-medium text-[14px] leading-[21.7px]"
                  style={{ color: isDarkMode ? '#C8CDD3' : '#1E2026' }}
                />
              </div>
            </div>

            {/* Search Results Message */}
            {searchQuery && (
              <div className="self-stretch p-4 overflow-hidden rounded-xl flex flex-wrap items-center">
                <span
                  className="flex-1 font-avenir font-medium text-[14px] leading-[21.7px]"
                  style={{ color: isDarkMode ? '#808894' : '#5B6571' }}
                >
                  Showing all results for &ldquo;{searchQuery}&rdquo;
                </span>
              </div>
            )}

            {/* Entries */}
            {filteredAddresses.length === 0 ? (
              !searchQuery ? (
                <div className="self-stretch min-w-[280px] min-h-[134px] p-2 flex items-start">
                  <div
                    className="flex-1 self-stretch p-6 rounded-xl flex flex-col justify-center items-center"
                    style={{
                      background: isDarkMode
                        ? 'rgba(42, 44, 52, 0.33)'
                        : 'rgba(222, 228, 233, 0.33)',
                    }}
                  >
                    <p
                      className="self-stretch text-center font-avenir font-medium text-[14px] leading-[21.7px]"
                      style={{ color: isDarkMode ? '#808894' : '#3D444D' }}
                    >
                      No address found. Try importing a CSV file?
                    </p>
                  </div>
                </div>
              ) : null
            ) : (
              <div className="self-stretch px-4 max-h-[400px] overflow-y-auto">
                {filteredAddresses.map((entry, index) => (
                  <div
                    key={`${entry.address}-${index}`}
                    className="flex flex-col"
                  >
                    <button
                      type="button"
                      className="self-stretch min-w-[240px] py-2 rounded-xl flex flex-col cursor-pointer transition-colors duration-150 text-left w-full border-0"
                      style={{ backgroundColor: 'transparent' }}
                      onClick={() => handleSelect(entry.address)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelect(entry.address)
                        }
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = isDarkMode
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.02)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                      aria-label={`Select ${entry.name} - ${entry.address}`}
                    >
                      <div className="self-stretch flex flex-wrap items-start">
                        {/* Wallet Name */}
                        <div className="flex-1 basis-0 max-w-[320px] min-w-[240px] p-2 rounded-lg flex flex-col justify-center gap-1">
                          <span
                            className="self-stretch font-['Gilroy'] font-bold text-[14px] leading-[21.7px]"
                            style={{
                              color: isDarkMode ? '#C8CDD3' : '#1E2026',
                            }}
                          >
                            {entry.name}
                          </span>
                        </div>
                        {/* Wallet Address + Copy */}
                        <div className="flex-1 min-w-[172px] flex items-start">
                          <div className="flex-1 min-w-[160px] p-2 rounded-lg flex items-center gap-1">
                            <span
                              className="flex-1 font-avenir font-medium text-[14px] leading-[21.7px] break-all"
                              style={{
                                color: isDarkMode ? '#7D80D7' : '#5B5BB3',
                              }}
                            >
                              {entry.address}
                            </span>
                          </div>
                          <div className="p-1 flex items-center">
                            {copiedAddress === entry.address ? (
                              <span
                                className="min-w-[32px] min-h-[32px] flex items-center justify-center font-['Gilroy'] font-bold text-[11px]"
                                style={{
                                  color: isDarkMode ? '#7D80D7' : '#5B5BB3',
                                }}
                              >
                                Copied!
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation()
                                  handleCopy(entry.address)
                                }}
                                className="min-w-[32px] min-h-[32px] p-0.5 overflow-hidden rounded-md flex justify-center items-center transition-colors duration-200"
                                style={{ backgroundColor: 'transparent' }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.backgroundColor =
                                    isDarkMode
                                      ? 'rgba(255, 255, 255, 0.1)'
                                      : 'rgba(0, 0, 0, 0.05)'
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.backgroundColor =
                                    'transparent'
                                }}
                              >
                                <div className="h-6 p-1 overflow-hidden flex flex-col items-center">
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M9.5 1.75C10.7426 1.75 11.75 2.7574 11.75 4V4.65039C11.7502 4.70534 11.7947 4.74977 11.8496 4.75H12C13.2426 4.75 14.25 5.7574 14.25 7V12C14.25 13.2426 13.2426 14.25 12 14.25H7C5.75737 14.25 4.75 13.2426 4.75 12V11.8496C4.74975 11.7947 4.7053 11.7502 4.65039 11.75H4C2.75737 11.75 1.75 10.7426 1.75 9.5V4C1.75004 2.75741 2.7574 1.75002 4 1.75H9.5ZM7 6.25C6.58583 6.25002 6.25004 6.58583 6.25 7V12C6.25 12.4142 6.5858 12.75 7 12.75H12C12.4142 12.75 12.75 12.4142 12.75 12V7C12.75 6.58582 12.4142 6.25 12 6.25H7ZM4 3.25C3.58583 3.25002 3.25004 3.58583 3.25 4V9.5C3.25 9.9142 3.5858 10.25 4 10.25H4.65039C4.70535 10.2498 4.74983 10.2054 4.75 10.1504V7C4.75004 5.75741 5.7574 4.75002 7 4.75H10.1504C10.2053 4.74981 10.2498 4.70536 10.25 4.65039V4C10.25 3.58582 9.91419 3.25 9.5 3.25H4Z"
                                      fill={isDarkMode ? '#808894' : '#5B6571'}
                                    />
                                  </svg>
                                </div>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                    {index < filteredAddresses.length - 1 && (
                      <div className="self-stretch px-2 py-2 flex items-start gap-1">
                        <div
                          className="flex-1 h-px"
                          style={{ background: 'rgba(169, 178, 187, 0.33)' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Dismiss */}
      <div className="self-stretch pt-4 pb-6 px-6 flex justify-end items-center gap-4">
        <div className="flex-1 flex justify-end items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 max-w-[260px] min-w-[160px] min-h-[40px] p-[5px] overflow-hidden rounded-lg flex justify-center items-center transition-colors duration-200"
            style={{
              background: '#5B5BB3',
              border: '1px solid rgba(169, 178, 187, 0.33)',
            }}
          >
            <span className="px-1 py-1 text-center text-white text-[14px] font-bold font-['Gilroy'] leading-[21.7px]">
              Dismiss
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddressBookOverlay
