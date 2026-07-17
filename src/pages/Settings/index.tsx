import React, { useEffect, useRef, useState } from 'react'
import { useAddressBook } from '@/hooks/useAddressBook'
import {
  SourceDropdown,
  AddressBookHelpTooltip,
} from '@/components/common/AddressBookShared'

interface SettingsProps {
  isDarkMode: boolean
}

const Settings = ({ isDarkMode }: SettingsProps) => {
  const [activeTab, setActiveTab] = useState<'addressBook' | 'resolver'>(
    'addressBook'
  )
  const { addressBook, addEntries, importFromCsv, downloadTemplate } =
    useAddressBook()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState(() => {
    try {
      return localStorage.getItem('ADDRESS_BOOK_SOURCE') || 'local'
    } catch {
      return 'local'
    }
  })
  const handleSourceChange = (source: string) => {
    setSelectedSource(source)
    localStorage.setItem('ADDRESS_BOOK_SOURCE', source)
    setSearchQuery('')
  }

  const displayedAddresses =
    selectedSource === 'local'
      ? addressBook.filter(e => e.source === 'Local')
      : addressBook.filter(e => e.source === selectedSource)

  // Resolver state
  const [resolvers, setResolvers] = useState<
    { name: string; endpoint: string; apiHeader: string; apiKey: string }[]
  >(() => {
    try {
      const stored = localStorage.getItem('ADDRESS_RESOLVERS')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [showResolverForm, setShowResolverForm] = useState(false)
  const [editingResolverIndex, setEditingResolverIndex] = useState<
    number | null
  >(null)
  const [resolverForm, setResolverForm] = useState({
    name: '',
    endpoint: '',
    apiHeader: '',
    apiKey: '',
  })

  const [resolverErrors, setResolverErrors] = useState<Record<string, string>>(
    {}
  )

  const validateResolverForm = () => {
    const errors: Record<string, string> = {}

    if (!resolverForm.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!resolverForm.endpoint.trim()) {
      errors.endpoint = 'Endpoint is required'
    } else {
      try {
        new URL(resolverForm.endpoint)
      } catch {
        errors.endpoint = 'Please enter a valid URL'
      }
    }

    if (resolverForm.apiHeader.trim() && !resolverForm.apiKey.trim()) {
      errors.apiKey = 'API Key is required when API Header is set'
    }

    if (resolverForm.apiKey.trim() && !resolverForm.apiHeader.trim()) {
      errors.apiHeader = 'API Header is required when API Key is set'
    }

    const duplicate = resolvers.some(
      (r, i) =>
        i !== editingResolverIndex &&
        (r.name.toLowerCase() === resolverForm.name.trim().toLowerCase() ||
          r.endpoint.toLowerCase() ===
            resolverForm.endpoint.trim().toLowerCase())
    )
    if (duplicate) {
      errors.name =
        errors.name || 'A resolver with this name or endpoint already exists'
    }

    return errors
  }

  const isResolverFormValid =
    resolverForm.name.trim() !== '' && resolverForm.endpoint.trim() !== ''

  const saveResolver = async () => {
    const errors = validateResolverForm()
    setResolverErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      // Fetch addresses from endpoint
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (resolverForm.apiHeader && resolverForm.apiKey) {
        headers[resolverForm.apiHeader] = resolverForm.apiKey
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(resolverForm.endpoint, {
        headers,
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) {
        setResolverErrors({
          endpoint: `Failed to fetch: ${res.status} ${res.statusText}`,
        })
        return
      }

      const data = await res.json()
      let entries: { name: string; address: string }[] = []
      if (Array.isArray(data)) entries = data
      else if (data.entries) entries = data.entries
      else if (data.results) entries = data.results
      else if (data.data) entries = data.data

      const validEntries = entries.filter(e => e.name && e.address)

      // If editing and the resolver name changed, remove old resolver's contacts
      if (editingResolverIndex !== null) {
        const oldResolverName = resolvers[editingResolverIndex].name
        if (oldResolverName !== resolverForm.name) {
          const currentBook = JSON.parse(
            localStorage.getItem('ADDRESS_BOOK') || '[]'
          )
          const filteredBook = currentBook.filter(
            (entry: { source: string }) => entry.source !== oldResolverName
          )
          localStorage.setItem('ADDRESS_BOOK', JSON.stringify(filteredBook))
        }
      }

      // Save addresses to ADDRESS_BOOK with resolver name as source
      const result = addEntries(
        validEntries.map(e => ({
          name: e.name,
          address: e.address,
          source: resolverForm.name,
        }))
      )

      // Save resolver config
      let updated: typeof resolvers
      if (editingResolverIndex !== null) {
        updated = resolvers.map((r, i) =>
          i === editingResolverIndex ? { ...resolverForm } : r
        )
      } else {
        updated = [...resolvers, { ...resolverForm }]
      }
      setResolvers(updated)
      localStorage.setItem('ADDRESS_RESOLVERS', JSON.stringify(updated))
      setResolverForm({ name: '', endpoint: '', apiHeader: '', apiKey: '' })
      setResolverErrors({})
      setEditingResolverIndex(null)
      setShowResolverForm(false)
      setImportStatus(
        `Imported ${result.success} address${result.success !== 1 ? 'es' : ''} from "${resolverForm.name}"${result.failed > 0 ? `. ${result.failed} skipped (duplicate).` : '.'}`
      )
      setTimeout(() => setImportStatus(null), 5000)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setResolverErrors({ endpoint: 'Request timed out' })
      } else {
        setResolverErrors({
          endpoint: err instanceof Error ? err.message : 'Failed to fetch',
        })
      }
    }
  }

  const _removeResolver = (index: number) => {
    const updated = resolvers.filter((_, i) => i !== index)
    setResolvers(updated)
    localStorage.setItem('ADDRESS_RESOLVERS', JSON.stringify(updated))
  }

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  // If selected resolver was deleted, fall back to local
  useEffect(() => {
    if (selectedSource !== 'local' && resolvers.length > 0) {
      const exists = resolvers.some(r => r.name === selectedSource)
      if (!exists) {
        setSelectedSource('local')
        localStorage.setItem('ADDRESS_BOOK_SOURCE', 'local')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvers])

  const filteredAddressBook = displayedAddresses.filter(
    entry =>
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await importFromCsv(file)
      setImportStatus(
        `Imported ${result.success} address${result.success !== 1 ? 'es' : ''}${result.failed > 0 ? `. ${result.failed} skipped (duplicate or invalid).` : '.'}`
      )
      setTimeout(() => setImportStatus(null), 5000)
    } catch (err) {
      setImportStatus(
        err instanceof Error ? err.message : 'Failed to import CSV'
      )
      setTimeout(() => setImportStatus(null), 5000)
    }

    e.target.value = ''
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto overflow-hidden flex flex-col items-center pt-[88px]">
      {/* Header Section */}
      <div className="w-full max-w-[1280px] p-4 flex flex-col items-center">
        {/* Heading */}
        <div className="w-full max-w-[720px] p-2 flex flex-col items-center">
          <h1
            className="self-stretch text-center font-urbanist font-bold text-[36px] leading-[43.92px]"
            style={{
              color: isDarkMode ? '#C8CDD3' : '#1E2026',
            }}
          >
            Settings
          </h1>
        </div>
        {/* Description */}
        <div className="w-full max-w-[720px] p-2 flex flex-col items-center">
          <p
            className="self-stretch text-center font-avenir font-medium text-[18px] leading-[24.48px]"
            style={{
              color: isDarkMode ? '#808894' : '#3D444D',
            }}
          >
            Access and update your addresses locally or setup and add
            third-party&apos;s end point to resolve addresses identity.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="w-full max-w-[1280px] p-4 flex flex-col justify-center items-center">
        {/* Tabs */}
        <div
          className="self-stretch px-4 sm:px-8 overflow-x-auto flex justify-start sm:justify-center items-center relative settings-tabs-scroll"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex-1 max-w-[560px] flex items-center">
            {/* Address Book Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('addressBook')}
              className="w-[280px] max-w-[280px] shrink-0 px-4 py-3 rounded-t-xl flex justify-center items-center gap-2 transition-all duration-200"
              style={{
                background:
                  activeTab === 'addressBook'
                    ? isDarkMode
                      ? 'rgba(30, 32, 38, 1)'
                      : 'rgba(255, 255, 255, 1)'
                    : isDarkMode
                      ? 'rgba(30, 32, 38, 0.85)'
                      : 'rgba(255, 255, 255, 1)',
                boxShadow:
                  activeTab === 'addressBook'
                    ? '0px 2px 8px rgba(104, 106, 210, 0.33)'
                    : '0px 2px 8px rgba(104, 106, 210, 0.33)',
                borderLeft: '1px solid rgba(169, 178, 187, 0.33)',
                borderTop: '1px solid rgba(169, 178, 187, 0.33)',
                borderRight: '1px solid rgba(169, 178, 187, 0.33)',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 3C19.6569 3 21 4.34315 21 6V18C20.9998 19.6567 19.6567 21 18 21H6C4.34327 21 3.0002 19.6567 3 18V6C3 4.34315 4.34315 3 6 3H18ZM6 4.5C5.17157 4.5 4.5 5.17157 4.5 6V18C4.5002 18.8283 5.1717 19.5 6 19.5H18C18.8283 19.5 19.4998 18.8283 19.5 18V6C19.5 5.17157 18.8284 4.5 18 4.5H17.3496C17.2946 4.50021 17.25 4.54452 17.25 4.59961V16.5C17.2499 16.7597 17.1154 17.0011 16.8945 17.1377C16.6736 17.2742 16.3974 17.2868 16.165 17.1709L12.0449 15.1104C12.0168 15.0963 11.9832 15.0963 11.9551 15.1104L7.83496 17.1709C7.60264 17.2868 7.32638 17.2742 7.10547 17.1377C6.88464 17.0011 6.75013 16.7597 6.75 16.5V4.59961C6.74999 4.54452 6.70543 4.50021 6.65039 4.5H6ZM8.34961 4.5C8.29457 4.50021 8.25001 4.54452 8.25 4.59961V15.124C8.25003 15.1982 8.32812 15.2468 8.39453 15.2139L11.665 13.5791L11.7451 13.5449C11.937 13.4755 12.1502 13.4868 12.335 13.5791L15.6055 15.2139C15.6719 15.2468 15.75 15.1982 15.75 15.124V4.59961C15.75 4.54452 15.7054 4.50021 15.6504 4.5H8.34961Z"
                  fill={
                    activeTab === 'addressBook'
                      ? isDarkMode
                        ? '#C8CDD3'
                        : '#1E2026'
                      : isDarkMode
                        ? '#808894'
                        : '#5B6571'
                  }
                />
              </svg>
              <span
                className="font-urbanist font-bold text-[18px] leading-[24.48px]"
                style={{
                  color:
                    activeTab === 'addressBook'
                      ? isDarkMode
                        ? '#C8CDD3'
                        : '#1E2026'
                      : isDarkMode
                        ? '#808894'
                        : '#5B6571',
                }}
              >
                Address Book
              </span>
            </button>

            {/* Address Book Resolver Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('resolver')}
              className="w-[280px] max-w-[280px] shrink-0 px-4 py-3 rounded-t-xl flex justify-center items-center gap-2 transition-all duration-200"
              style={{
                background:
                  activeTab === 'resolver'
                    ? isDarkMode
                      ? 'rgba(30, 32, 38, 1)'
                      : 'rgba(255, 255, 255, 1)'
                    : isDarkMode
                      ? 'rgba(30, 32, 38, 0.85)'
                      : 'rgba(255, 255, 255, 1)',
                boxShadow: '0px 2px 8px rgba(104, 106, 210, 0.33)',
                borderLeft: '1px solid rgba(169, 178, 187, 0.33)',
                borderTop: '1px solid rgba(169, 178, 187, 0.33)',
                borderRight: '1px solid rgba(169, 178, 187, 0.33)',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.25 1.5C11.8028 1.5 12.3454 1.54608 12.874 1.63477C17.4859 2.40849 21 6.41814 21 11.25V16.125C21 17.1605 20.1605 18 19.125 18H16.5996C16.5447 18.0002 16.5002 18.0447 16.5 18.0996V20.625C16.5 21.6605 15.6605 22.5 14.625 22.5H4.875C3.83947 22.5 3 21.6605 3 20.625V7.875C3 6.83947 3.83947 6 4.875 6H6.75C6.96577 6 7.18015 6.00747 7.39258 6.02148C7.45043 6.02519 7.49973 5.9798 7.5 5.92188V3.375C7.5 2.33947 8.33947 1.5 9.375 1.5H11.25ZM4.875 7.5C4.66789 7.5 4.5 7.66789 4.5 7.875V20.625C4.5 20.8321 4.66789 21 4.875 21H14.625C14.8321 21 15 20.8321 15 20.625V18.0996C14.9998 18.0447 14.9553 18.0002 14.9004 18H9.375C8.33947 18 7.5 17.1605 7.5 16.125V7.62598C7.5 7.57431 7.46065 7.53058 7.40918 7.52637C7.1919 7.50909 6.97192 7.5 6.75 7.5H4.875ZM9.375 3C9.16789 3 9 3.16789 9 3.375V16.125C9 16.3321 9.16789 16.5 9.375 16.5H19.125C19.3321 16.5 19.5 16.3321 19.5 16.125V11.625C19.5 10.1753 18.3247 9 16.875 9H15.375C14.3395 9 13.5 8.16053 13.5 7.125V5.625C13.5 4.17525 12.3247 3 10.875 3H9.375ZM14.7686 3.78711C14.6829 3.74696 14.5957 3.84051 14.6348 3.92676C14.8692 4.44466 15 5.01951 15 5.625V7.125C15 7.33211 15.1679 7.5 15.375 7.5H16.875C17.4805 7.5 18.0553 7.63076 18.5732 7.86523C18.6595 7.90429 18.753 7.81706 18.7129 7.73145C17.8964 6.00282 16.4971 4.60356 14.7686 3.78711Z"
                  fill={
                    activeTab === 'resolver'
                      ? isDarkMode
                        ? '#C8CDD3'
                        : '#1E2026'
                      : isDarkMode
                        ? '#808894'
                        : '#5B6571'
                  }
                />
              </svg>
              <span
                className="text-center font-urbanist font-bold text-[18px] leading-[24.48px]"
                style={{
                  color:
                    activeTab === 'resolver'
                      ? isDarkMode
                        ? '#C8CDD3'
                        : '#1E2026'
                      : isDarkMode
                        ? '#808894'
                        : '#5B6571',
                }}
              >
                Address Book Resolver
              </span>
            </button>
          </div>
        </div>

        {/* Card Container */}
        <div
          className="self-stretch p-4 rounded-2xl flex flex-col gap-2.5"
          style={{
            background: isDarkMode
              ? 'rgba(30, 32, 38, 0.66)'
              : 'rgba(255, 255, 255, 0.66)',
            boxShadow: '0px 2px 8px rgba(104, 106, 210, 0.33)',
            outline: '1px solid rgba(169, 178, 187, 0.33)',
            outlineOffset: '-1px',
          }}
        >
          {activeTab === 'addressBook' ? (
            <div className="self-stretch rounded-xl flex flex-col justify-center items-center gap-4">
              {/* Toolbar Row */}
              <div
                className="self-stretch p-2 rounded-xl flex flex-wrap items-center overflow-visible"
                style={{
                  background: isDarkMode ? 'rgba(30, 32, 38, 1)' : 'white',
                  outline: '1px solid rgba(169, 178, 187, 0.33)',
                  outlineOffset: '-1px',
                }}
              >
                {/* Left Side - Label + Dropdown + Help */}
                <div className="flex-1 basis-0 min-w-[290px] p-1 flex items-center overflow-visible">
                  <div className="p-1 shrink-0">
                    <span
                      className="font-urbanist font-medium text-[16px] leading-[20px] whitespace-nowrap"
                      style={{
                        color: isDarkMode ? '#808894' : '#3D444D',
                      }}
                    >
                      Address Book
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 flex items-center">
                    <div className="flex-1 min-w-0 p-1 flex items-center gap-2">
                      <SourceDropdown
                        selectedSource={selectedSource}
                        resolvers={resolvers}
                        onSourceChange={handleSourceChange}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                    <AddressBookHelpTooltip isDarkMode={isDarkMode} />
                  </div>
                </div>

                {/* Right Side - Action Buttons (only for Local) */}
                <div className="flex-1 basis-0 min-w-[290px] p-1 flex flex-wrap items-center">
                  <div className="flex-1 min-w-[290px] p-1 flex justify-end items-stretch gap-2.5">
                    {/* Hidden file input for CSV import */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleImport}
                    />
                    {/* Download Template Button */}
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="flex-1 min-w-[156px] min-h-[32px] px-3 py-0.5 relative overflow-hidden rounded-md flex justify-center items-center gap-1.5 whitespace-nowrap transition-colors duration-200"
                      style={{
                        border: '1px solid rgba(169, 178, 187, 0.33)',
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = isDarkMode
                          ? 'rgba(125, 128, 215, 0.1)'
                          : 'rgba(91, 91, 179, 0.05)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0"
                      >
                        <path
                          d="M13.7998 9.44922C14.2138 9.44933 14.5496 9.78521 14.5498 10.1992V11.7988C14.5498 13.3175 13.3185 14.5487 11.7998 14.5488H4.2002C2.68141 14.5488 1.4502 13.3176 1.4502 11.7988V10.1992C1.45035 9.78514 1.78608 9.44922 2.2002 9.44922C2.61421 9.44933 2.95004 9.78521 2.9502 10.1992V11.7988C2.9502 12.4892 3.50984 13.0488 4.2002 13.0488H11.7998C12.4901 13.0487 13.0498 12.4891 13.0498 11.7988V10.1992C13.05 9.78527 13.3859 9.44943 13.7998 9.44922ZM7.97949 1.44922C8.39342 1.44944 8.72934 1.78528 8.72949 2.19922V9.58301L10.5859 8.35352C10.9311 8.12505 11.3962 8.21944 11.625 8.56445C11.8537 8.90965 11.7591 9.37467 11.4141 9.60352L8.39551 11.6035C8.17472 11.7497 7.89574 11.768 7.66113 11.6572L7.56348 11.6016L4.58203 9.60156C4.23824 9.3708 4.14635 8.90446 4.37695 8.56055C4.60774 8.21688 5.0741 8.12494 5.41797 8.35547L7.22949 9.57031V2.19922C7.22965 1.78514 7.56538 1.44922 7.97949 1.44922Z"
                          fill={isDarkMode ? '#7D80D7' : '#5B5BB3'}
                        />
                      </svg>
                      <span
                        className="font-urbanist font-bold text-[12px] leading-[19.8px]"
                        style={{
                          color: isDarkMode ? '#7D80D7' : '#5B5BB3',
                        }}
                      >
                        Download Template
                      </span>
                    </button>

                    {/* Import Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 min-w-[82px] min-h-[32px] px-3 py-0.5 relative overflow-hidden rounded-md flex justify-center items-center gap-1.5 whitespace-nowrap transition-colors duration-200"
                      style={{
                        border: '1px solid rgba(169, 178, 187, 0.33)',
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = isDarkMode
                          ? 'rgba(125, 128, 215, 0.1)'
                          : 'rgba(91, 91, 179, 0.05)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0"
                      >
                        <path
                          d="M7 0.75C10.7279 0.75 13.75 3.77212 13.75 7.5V13.75C13.75 14.5784 13.0784 15.25 12.25 15.25H3.75C2.92159 15.25 2.25 14.5784 2.25 13.75V2.25C2.25004 1.42162 2.92161 0.750016 3.75 0.75H7ZM3.84961 2.25C3.79473 2.25023 3.75025 2.29474 3.75 2.34961V13.6504C3.75017 13.7053 3.79468 13.7498 3.84961 13.75H12.1504C12.2053 13.7498 12.2498 13.7054 12.25 13.6504V7.75C12.25 6.92161 11.5784 6.25 10.75 6.25H9.75C8.92159 6.24998 8.25 5.57842 8.25 4.75V3.75C8.24996 2.92161 7.5784 2.25 6.75 2.25H3.84961ZM8.00586 6.80859C8.41992 6.80913 8.75518 7.14556 8.75488 7.55957L8.75293 8.70996C8.75306 8.765 8.79843 8.80948 8.85352 8.80957L10.0029 8.81152C10.4169 8.81226 10.7524 9.14844 10.752 9.5625C10.7511 9.97633 10.4148 10.3119 10.001 10.3115L8.85156 10.3096C8.79651 10.3095 8.75131 10.3542 8.75098 10.4092L8.75 11.5586C8.74926 11.9725 8.41297 12.308 7.99902 12.3076C7.58507 12.3069 7.24966 11.9706 7.25 11.5566L7.25098 10.4072C7.25079 10.3522 7.20641 10.3077 7.15137 10.3076L6.00195 10.3057C5.58799 10.3049 5.25253 9.96866 5.25293 9.55469C5.25369 9.14078 5.58999 8.80532 6.00391 8.80566L7.15332 8.80762C7.20839 8.80766 7.25265 8.76304 7.25293 8.70801L7.25488 7.55762C7.25567 7.14371 7.59194 6.80822 8.00586 6.80859ZM9.85059 3.0918C9.7755 3.04314 9.68053 3.11426 9.69727 3.20215C9.73106 3.37975 9.74999 3.56264 9.75 3.75V4.65039C9.75017 4.70534 9.79468 4.74977 9.84961 4.75H10.75C10.9371 4.75 11.1204 4.76825 11.2979 4.80176C11.3856 4.81797 11.4558 4.72339 11.4072 4.64844C11.0039 4.02628 10.4728 3.495 9.85059 3.0918Z"
                          fill={isDarkMode ? '#7D80D7' : '#5B5BB3'}
                        />
                      </svg>
                      <span
                        className="font-urbanist font-bold text-[12px] leading-[19.8px]"
                        style={{
                          color: isDarkMode ? '#7D80D7' : '#5B5BB3',
                        }}
                      >
                        Import
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Import Status Message */}
              {importStatus && (
                <div
                  className="self-stretch p-3 rounded-lg text-center font-avenir font-medium text-[14px]"
                  style={{
                    background: isDarkMode
                      ? 'rgba(125, 128, 215, 0.15)'
                      : 'rgba(91, 91, 179, 0.1)',
                    color: isDarkMode ? '#7D80D7' : '#5B5BB3',
                  }}
                >
                  {importStatus}
                </div>
              )}

              {/* Address Book Content */}
              <div className="self-stretch flex flex-col">
                <div
                  className="self-stretch p-2 rounded-xl flex flex-col justify-center items-center"
                  style={{
                    background: isDarkMode ? 'rgba(30, 32, 38, 1)' : 'white',
                    outline: '1px solid rgba(169, 178, 187, 0.33)',
                  }}
                >
                  {displayedAddresses.length === 0 ? (
                    /* Empty State */
                    <div className="self-stretch min-w-[280px] min-h-[134px] p-2 flex items-start">
                      <div
                        className="flex-1 self-stretch p-6 rounded-xl flex flex-col justify-center items-center"
                        style={{
                          background: isDarkMode
                            ? 'rgba(42, 44, 52, 0.33)'
                            : 'rgba(222, 228, 233, 0.33)',
                        }}
                      >
                        <div className="self-stretch p-2 flex justify-center items-center gap-2.5">
                          <p
                            className="flex-1 text-center font-avenir font-medium text-[14px] leading-[21.7px]"
                            style={{
                              color: isDarkMode ? '#808894' : '#3D444D',
                            }}
                          >
                            {selectedSource === 'local'
                              ? 'No address found. Try importing a CSV file?'
                              : 'No addresses found from this resolver.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Search Field */}
                      <div className="self-stretch p-2 overflow-hidden rounded-xl flex items-center">
                        <div
                          className="min-h-[32px] p-1 rounded-lg flex items-center"
                          style={{
                            background: isDarkMode
                              ? 'rgba(30, 32, 38, 1)'
                              : 'white',
                            border: `1px solid ${isDarkMode ? '#A9B2BB' : '#A9B2BB'}`,
                          }}
                        >
                          {/* Search Icon */}
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
                              <path
                                d="M4 4V28"
                                stroke="rgba(169, 178, 187, 0.33)"
                              />
                            </svg>
                          </div>
                          {/* Search Input */}
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search"
                            className="flex-1 min-w-0 min-h-[32px] px-2 py-[5px] bg-transparent outline-none font-avenir font-medium text-[14px] leading-[21.7px]"
                            style={{
                              color: isDarkMode ? '#C8CDD3' : '#1E2026',
                            }}
                            onFocus={e => {
                              const container = e.currentTarget.parentElement
                              if (container)
                                container.style.borderColor = isDarkMode
                                  ? '#7D80D7'
                                  : '#5B5BB3'
                            }}
                            onBlur={e => {
                              const container = e.currentTarget.parentElement
                              if (container)
                                container.style.borderColor = '#A9B2BB'
                            }}
                          />
                        </div>
                      </div>

                      {/* Search Results Message */}
                      {searchQuery && (
                        <div className="self-stretch p-4 overflow-hidden rounded-xl flex flex-wrap items-center">
                          <span
                            className="flex-1 font-avenir font-medium text-[14px] leading-[21.7px]"
                            style={{
                              color: isDarkMode ? '#808894' : '#5B6571',
                            }}
                          >
                            Showing all results for &ldquo;{searchQuery}&rdquo;
                          </span>
                        </div>
                      )}

                      {/* Address Entries */}
                      <div className="self-stretch px-4">
                        {filteredAddressBook.map((entry, index) => (
                          <div key={entry.address} className="flex flex-col">
                            <div className="self-stretch min-w-[240px] py-2 rounded-xl flex flex-col">
                              <div className="self-stretch flex flex-wrap items-start">
                                {/* Wallet Name */}
                                <div className="flex-1 basis-0 max-w-[320px] min-w-[240px] p-2 rounded-lg flex flex-col justify-center gap-1">
                                  <span
                                    className="self-stretch font-urbanist font-bold text-[14px] leading-[21.7px]"
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
                                        color: isDarkMode
                                          ? '#7D80D7'
                                          : '#5B5BB3',
                                      }}
                                    >
                                      {entry.address}
                                    </span>
                                  </div>
                                  {/* Copy Button */}
                                  <div className="p-1 flex items-center">
                                    {copiedAddress === entry.address ? (
                                      <span
                                        className="min-w-[32px] min-h-[32px] flex items-center justify-center font-urbanist font-bold text-[11px]"
                                        style={{
                                          color: isDarkMode
                                            ? '#7D80D7'
                                            : '#5B5BB3',
                                        }}
                                      >
                                        Copied!
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCopy(entry.address)
                                        }
                                        className="min-w-[32px] min-h-[32px] p-0.5 relative overflow-hidden rounded-md flex justify-center items-center transition-colors duration-200"
                                        style={{
                                          backgroundColor: 'transparent',
                                        }}
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
                                              fill={
                                                isDarkMode
                                                  ? '#808894'
                                                  : '#5B6571'
                                              }
                                            />
                                          </svg>
                                        </div>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Divider */}
                            {index < filteredAddressBook.length - 1 && (
                              <div className="self-stretch px-2 py-2 flex items-start gap-1">
                                <div
                                  className="flex-1 h-px"
                                  style={{
                                    background: 'rgba(169, 178, 187, 0.33)',
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Resolver Tab Content */
            <div className="self-stretch rounded-xl flex flex-col justify-center items-center gap-4">
              <div
                className="self-stretch min-w-[340px] min-h-[214px] p-2 rounded-xl flex flex-col"
                style={{
                  background: isDarkMode ? 'rgba(30, 32, 38, 1)' : 'white',
                  outline: '1px solid rgba(169, 178, 187, 0.33)',
                }}
              >
                {/* Add Button Row */}
                {!showResolverForm && (
                  <div className="self-stretch p-2 overflow-hidden rounded-xl flex flex-wrap items-center">
                    <div className="flex-1 min-w-[290px] p-1 flex justify-end items-center">
                      <button
                        type="button"
                        onClick={() => setShowResolverForm(true)}
                        className="min-h-[32px] px-3 py-0.5 relative overflow-hidden rounded-md flex justify-center items-center gap-1.5 whitespace-nowrap transition-colors duration-200"
                        style={{
                          border: '1px solid rgba(169, 178, 187, 0.33)',
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = isDarkMode
                            ? 'rgba(125, 128, 215, 0.1)'
                            : 'rgba(91, 91, 179, 0.05)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8.00586 2.99805C8.42001 2.99859 8.75533 3.33489 8.75488 3.74902L8.75098 7.15039C8.75102 7.20549 8.79547 7.24987 8.85059 7.25L12.252 7.25488C12.666 7.25558 13.0015 7.59174 13.001 8.00586C13.0004 8.41991 12.664 8.75526 12.25 8.75488L8.84863 8.75C8.79345 8.74998 8.7491 8.79539 8.74902 8.85059L8.74414 12.251C8.7436 12.6652 8.40738 13.0005 7.99316 13C7.57897 12.9994 7.2436 12.6632 7.24414 12.249L7.24902 8.84863C7.2491 8.7934 7.20367 8.74812 7.14844 8.74805L3.74805 8.74414C3.334 8.7436 2.99875 8.40715 2.99902 7.99316C2.99956 7.57895 3.33579 7.2436 3.75 7.24414L7.15039 7.24805C7.20555 7.24812 7.25079 7.20357 7.25098 7.14844L7.25488 3.74707C7.25552 3.33306 7.59188 2.99771 8.00586 2.99805Z"
                            fill={isDarkMode ? '#7D80D7' : '#5B5BB3'}
                          />
                        </svg>
                        <span
                          className="font-urbanist font-bold text-[12px] leading-[19.8px]"
                          style={{ color: isDarkMode ? '#7D80D7' : '#5B5BB3' }}
                        >
                          Add
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Resolver Form (shown after clicking Add) */}
                {showResolverForm && (
                  <div className="self-stretch min-w-[280px] px-4">
                    <div className="self-stretch min-w-[240px] py-2 flex flex-col">
                      <div className="self-stretch flex flex-wrap items-start">
                        {/* Form Fields */}
                        <div
                          className="flex-1 min-w-[176px] p-1 rounded-2xl flex flex-wrap"
                          style={{
                            background: isDarkMode
                              ? 'rgba(42, 44, 52, 0.33)'
                              : 'rgba(222, 228, 233, 0.33)',
                          }}
                        >
                          <div className="flex-1 min-w-[160px] flex flex-wrap">
                            <div className="flex-1 basis-0 max-w-[320px] min-w-[160px] p-1 pb-8 relative">
                              <input
                                type="text"
                                placeholder="Name"
                                value={resolverForm.name}
                                onChange={e => {
                                  setResolverForm(f => ({
                                    ...f,
                                    name: e.target.value,
                                  }))
                                  setResolverErrors(err => ({
                                    ...err,
                                    name: '',
                                  }))
                                }}
                                className="w-full min-h-[32px] px-3 py-1 rounded-lg bg-transparent font-avenir font-medium text-[12px] leading-[19.8px] outline-none"
                                style={{
                                  border: `1px solid ${resolverErrors.name ? '#E53E3E' : isDarkMode ? '#A9B2BB' : '#A9B2BB'}`,
                                  color: isDarkMode ? '#C8CDD3' : '#1E2026',
                                  background: isDarkMode
                                    ? 'rgba(30, 32, 38, 1)'
                                    : 'white',
                                }}
                              />
                              {resolverErrors.name && (
                                <p
                                  style={{
                                    color: '#E53E3E',
                                    WebkitTextFillColor: '#E53E3E',
                                    background: 'none',
                                    WebkitBackgroundClip: 'unset',
                                    backgroundClip: 'unset',
                                  }}
                                  className="absolute left-1 top-[36px] font-avenir font-medium text-[11px] leading-[14px] text-left pl-3"
                                >
                                  {resolverErrors.name}
                                </p>
                              )}
                            </div>
                            <div className="flex-1 basis-0 max-w-[320px] min-w-[160px] p-1 pb-8 relative">
                              <input
                                type="text"
                                placeholder="Endpoint"
                                value={resolverForm.endpoint}
                                onChange={e => {
                                  setResolverForm(f => ({
                                    ...f,
                                    endpoint: e.target.value,
                                  }))
                                  setResolverErrors(err => ({
                                    ...err,
                                    endpoint: '',
                                  }))
                                }}
                                className="w-full min-h-[32px] px-3 py-1 rounded-lg bg-transparent font-avenir font-medium text-[12px] leading-[19.8px] outline-none"
                                style={{
                                  border: `1px solid ${resolverErrors.endpoint ? '#E53E3E' : isDarkMode ? '#A9B2BB' : '#A9B2BB'}`,
                                  color: isDarkMode ? '#C8CDD3' : '#1E2026',
                                  background: isDarkMode
                                    ? 'rgba(30, 32, 38, 1)'
                                    : 'white',
                                }}
                              />
                              {resolverErrors.endpoint && (
                                <p
                                  style={{
                                    color: '#E53E3E',
                                    WebkitTextFillColor: '#E53E3E',
                                    background: 'none',
                                    WebkitBackgroundClip: 'unset',
                                    backgroundClip: 'unset',
                                  }}
                                  className="absolute left-1 top-[36px] font-avenir font-medium text-[11px] leading-[14px] text-left pl-3"
                                >
                                  {resolverErrors.endpoint}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-[160px] flex flex-wrap">
                            <div className="flex-1 basis-0 max-w-[320px] min-w-[160px] p-1 pb-8 relative">
                              <input
                                type="text"
                                placeholder="API Header"
                                value={resolverForm.apiHeader}
                                onChange={e => {
                                  setResolverForm(f => ({
                                    ...f,
                                    apiHeader: e.target.value,
                                  }))
                                  setResolverErrors(err => ({
                                    ...err,
                                    apiHeader: '',
                                  }))
                                }}
                                className="w-full min-h-[32px] px-3 py-1 rounded-lg bg-transparent font-avenir font-medium text-[12px] leading-[19.8px] outline-none"
                                style={{
                                  border: `1px solid ${resolverErrors.apiHeader ? '#E53E3E' : isDarkMode ? '#A9B2BB' : '#A9B2BB'}`,
                                  color: isDarkMode ? '#C8CDD3' : '#1E2026',
                                  background: isDarkMode
                                    ? 'rgba(30, 32, 38, 1)'
                                    : 'white',
                                }}
                              />
                              {resolverErrors.apiHeader && (
                                <p
                                  style={{
                                    color: '#E53E3E',
                                    WebkitTextFillColor: '#E53E3E',
                                    background: 'none',
                                    WebkitBackgroundClip: 'unset',
                                    backgroundClip: 'unset',
                                  }}
                                  className="absolute left-1 top-[36px] font-avenir font-medium text-[11px] leading-[14px] text-left pl-3"
                                >
                                  {resolverErrors.apiHeader}
                                </p>
                              )}
                            </div>
                            <div className="flex-1 basis-0 max-w-[320px] min-w-[160px] p-1 pb-8 relative">
                              <input
                                type="text"
                                placeholder="API Key"
                                value={resolverForm.apiKey}
                                onChange={e => {
                                  setResolverForm(f => ({
                                    ...f,
                                    apiKey: e.target.value,
                                  }))
                                  setResolverErrors(err => ({
                                    ...err,
                                    apiKey: '',
                                  }))
                                }}
                                className="w-full min-h-[32px] px-3 py-1 rounded-lg bg-transparent font-avenir font-medium text-[12px] leading-[19.8px] outline-none"
                                style={{
                                  border: `1px solid ${resolverErrors.apiKey ? '#E53E3E' : isDarkMode ? '#A9B2BB' : '#A9B2BB'}`,
                                  color: isDarkMode ? '#C8CDD3' : '#1E2026',
                                  background: isDarkMode
                                    ? 'rgba(30, 32, 38, 1)'
                                    : 'white',
                                }}
                              />
                              {resolverErrors.apiKey && (
                                <p
                                  style={{
                                    color: '#E53E3E',
                                    WebkitTextFillColor: '#E53E3E',
                                    background: 'none',
                                    WebkitBackgroundClip: 'unset',
                                    backgroundClip: 'unset',
                                  }}
                                  className="absolute left-1 top-[36px] font-avenir font-medium text-[11px] leading-[14px] text-left pl-3"
                                >
                                  {resolverErrors.apiKey}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Cancel / Save Buttons */}
                        <div className="flex-1 basis-0 max-w-[200px] min-w-[120px] p-2 rounded-lg flex flex-wrap justify-center items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowResolverForm(false)
                              setResolverForm({
                                name: '',
                                endpoint: '',
                                apiHeader: '',
                                apiKey: '',
                              })
                              setResolverErrors({})
                              setEditingResolverIndex(null)
                            }}
                            className="flex-1 min-w-[86px] min-h-[32px] p-0.5 overflow-hidden rounded-md flex justify-center items-center gap-1.5 transition-colors duration-200"
                            style={{ background: '#B83152' }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M10.8697 4.06928C11.1625 3.77642 11.6373 3.77648 11.9302 4.06928C12.223 4.36218 12.2231 4.83698 11.9302 5.12983L9.06009 7.99897L11.9302 10.8691C12.223 11.162 12.2231 11.6368 11.9302 11.9296C11.6373 12.2222 11.1625 12.2223 10.8697 11.9296L7.99955 9.05951L5.1304 11.9296C4.83753 12.2222 4.36266 12.2223 4.06986 11.9296C3.77716 11.6368 3.77731 11.162 4.06986 10.8691L6.939 7.99897L4.06986 5.12983C3.77707 4.83704 3.77727 4.3622 4.06986 4.06928C4.36275 3.77639 4.83751 3.77639 5.1304 4.06928L7.99955 6.93842L10.8697 4.06928Z"
                                fill="white"
                              />
                            </svg>
                            <span className="font-urbanist font-bold text-[12px] leading-[19.8px] text-white">
                              Cancel
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={saveResolver}
                            disabled={!isResolverFormValid}
                            className="flex-1 min-w-[86px] min-h-[32px] p-0.5 overflow-hidden rounded-md flex justify-center items-center gap-1.5 transition-colors duration-200"
                            style={{
                              background: '#5B5BB3',
                              opacity: isResolverFormValid ? 1 : 0.33,
                              cursor: isResolverFormValid
                                ? 'pointer'
                                : 'not-allowed',
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M10.8935 4.5585C11.1374 4.22402 11.6067 4.1499 11.9413 4.39346C12.2757 4.6374 12.3499 5.10672 12.1064 5.44131L7.73136 11.4413C7.60313 11.6171 7.40424 11.7288 7.18742 11.747C6.9706 11.765 6.75607 11.6881 6.6005 11.536L3.9755 8.96377C3.67968 8.67393 3.67402 8.19911 3.96378 7.90322C4.25353 7.6075 4.72843 7.60299 5.02433 7.89248L7.02921 9.85635L10.8935 4.5585Z"
                                fill="white"
                              />
                            </svg>
                            <span className="font-urbanist font-bold text-[12px] leading-[19.8px] text-white">
                              Save
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="self-stretch px-2 py-2">
                      <div
                        className="flex-1 h-px"
                        style={{ background: 'rgba(169, 178, 187, 0.33)' }}
                      />
                    </div>
                  </div>
                )}

                {/* Saved Resolvers / Empty State */}
                {resolvers.length === 0 && !showResolverForm ? (
                  <div className="self-stretch min-w-[280px] min-h-[134px] p-2 flex items-start">
                    <div
                      className="flex-1 self-stretch p-6 rounded-xl flex flex-col justify-center items-center"
                      style={{
                        background: isDarkMode
                          ? 'rgba(42, 44, 52, 0.33)'
                          : 'rgba(222, 228, 233, 0.33)',
                      }}
                    >
                      <div className="self-stretch p-2 flex justify-center items-center gap-2.5">
                        <p
                          className="flex-1 text-center font-avenir font-medium text-[14px] leading-[21.7px]"
                          style={{ color: isDarkMode ? '#808894' : '#3D444D' }}
                        >
                          No third party&apos;s endpoint found.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  resolvers.map((resolver, index) => (
                    <div key={index} className="self-stretch px-4">
                      <div className="self-stretch min-w-[240px] py-2 flex flex-col">
                        <div className="self-stretch flex flex-wrap items-start">
                          {/* Resolver Info */}
                          <div className="flex-1 min-w-[176px] p-1 flex flex-col">
                            {/* Name */}
                            <div className="w-full max-w-[320px] min-w-[160px] p-2 rounded-lg">
                              <span
                                className="font-urbanist font-bold text-[14px] leading-[21.7px]"
                                style={{
                                  color: isDarkMode ? '#C8CDD3' : '#1E2026',
                                }}
                              >
                                {resolver.name}
                              </span>
                            </div>
                            {/* Endpoint + API Header + API Key */}
                            <div className="self-stretch min-w-[160px] p-1 flex flex-wrap items-start">
                              <div className="flex-1 basis-0 max-w-[320px] min-w-[200px] p-1 rounded-lg">
                                <span
                                  className="font-avenir font-medium text-[14px] leading-[21.7px] break-all"
                                  style={{
                                    color: isDarkMode ? '#7D80D7' : '#5B5BB3',
                                  }}
                                >
                                  {resolver.endpoint}
                                </span>
                              </div>
                              {resolver.apiHeader && (
                                <div className="flex-1 basis-0 max-w-[320px] min-w-[200px] p-1 rounded-lg">
                                  <span
                                    className="font-avenir font-medium text-[14px] leading-[21.7px]"
                                    style={{
                                      color: isDarkMode ? '#808894' : '#3D444D',
                                    }}
                                  >
                                    {resolver.apiHeader}
                                  </span>
                                </div>
                              )}
                              {resolver.apiKey && (
                                <div className="flex-1 basis-0 max-w-[320px] min-w-[200px] p-1 rounded-lg">
                                  <span
                                    className="font-avenir font-medium text-[14px] leading-[21.7px]"
                                    style={{
                                      color: isDarkMode ? '#808894' : '#3D444D',
                                    }}
                                  >
                                    {resolver.apiKey}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Edit Button */}
                          <div className="flex-1 basis-0 max-w-[200px] min-w-[120px] p-2 rounded-lg flex justify-end items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setResolverForm({ ...resolver })
                                setEditingResolverIndex(index)
                                setShowResolverForm(true)
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
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M6.41699 3.49985C6.83106 3.50002 7.16699 3.83574 7.16699 4.24985C7.16678 4.66377 6.83092 4.99967 6.41699 4.99985H3.25C2.8358 4.99986 2.5 5.33564 2.5 5.74985V12.7498C2.50022 13.1639 2.83593 13.4998 3.25 13.4998H10.25C10.6641 13.4998 10.9998 13.1639 11 12.7498V9.58286C11.0002 9.1688 11.3359 8.83287 11.75 8.83286C12.1641 8.83286 12.4998 9.16879 12.5 9.58286V12.7498C12.4998 13.9923 11.4925 14.9998 10.25 14.9998H3.25C2.00751 14.9998 1.00022 13.9923 1 12.7498V5.74985C1 4.50722 2.00737 3.49986 3.25 3.49985H6.41699ZM11.5859 1.58579C12.367 0.804738 13.633 0.804738 14.4141 1.58579C15.1949 2.36685 15.195 3.63292 14.4141 4.41391L7.33496 11.493C6.89444 11.9335 6.35093 12.2576 5.75391 12.4354L3.96387 12.9686C3.70012 13.047 3.41437 12.9746 3.21973 12.7801C3.02514 12.5855 2.95292 12.2997 3.03125 12.036L3.56445 10.2459C3.7423 9.64892 4.06638 9.10541 4.50684 8.66489L11.5859 1.58579ZM11.0615 4.37192C11.0225 4.33318 10.9599 4.33316 10.9209 4.37192L5.56738 9.72544C5.30324 9.98965 5.10867 10.3156 5.00195 10.6737L4.91699 10.9569C4.89429 11.0329 4.96497 11.1041 5.04102 11.0819L5.32617 10.9979C5.68422 10.8912 6.01019 10.6966 6.27441 10.4325L11.6279 5.07895C11.6667 5.0399 11.6668 4.97634 11.6279 4.93735L11.0615 4.37192ZM13.3535 2.64633C13.1583 2.45107 12.8417 2.45107 12.6465 2.64633L12.1221 3.16977C12.0832 3.20875 12.0833 3.27233 12.1221 3.31137L12.6885 3.8768C12.7275 3.91575 12.7901 3.91574 12.8291 3.8768L13.3535 3.35336C13.5487 3.15816 13.5486 2.84161 13.3535 2.64633Z"
                                    fill={isDarkMode ? '#808894' : '#5B6571'}
                                  />
                                </svg>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Divider - not on last entry */}
                      {index < resolvers.length - 1 && (
                        <div className="self-stretch px-2 py-2 flex items-start gap-1">
                          <div
                            className="flex-1 h-px"
                            style={{ background: 'rgba(169, 178, 187, 0.33)' }}
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
