import { useState, useCallback, useEffect } from 'react'

export interface AddressBookEntry {
  name: string
  address: string
  source: string
}

const ADDRESS_BOOK_KEY = 'ADDRESS_BOOK'
export interface ResolverEntry {
  name: string
  endpoint: string
  apiHeader: string
  apiKey: string
}

const getStoredAddressBook = (): AddressBookEntry[] => {
  try {
    const stored = localStorage.getItem(ADDRESS_BOOK_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveAddressBook = (entries: AddressBookEntry[]) => {
  localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(entries))
}

export const useAddressBook = () => {
  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([])

  useEffect(() => {
    setAddressBook(getStoredAddressBook())
  }, [])

  const addEntry = useCallback((entry: AddressBookEntry) => {
    setAddressBook(prev => {
      const updated = [...prev, entry]
      saveAddressBook(updated)
      return updated
    })
  }, [])

  const addEntries = useCallback(
    (entries: AddressBookEntry[]): { success: number; failed: number } => {
      // Read fresh from localStorage to avoid stale state
      const current = getStoredAddressBook()
      const newEntries = entries.filter(
        entry =>
          !current.some(
            e =>
              e.address.toLowerCase() === entry.address.toLowerCase() &&
              e.source === entry.source
          )
      )
      const failed = entries.length - newEntries.length
      if (newEntries.length > 0) {
        const updated = [...current, ...newEntries]
        saveAddressBook(updated)
        setAddressBook(updated)
      }
      return { success: newEntries.length, failed }
    },
    []
  )

  const removeEntry = useCallback(
    (address: string) => {
      const updated = addressBook.filter(
        e => e.address.toLowerCase() !== address.toLowerCase()
      )
      setAddressBook(updated)
      saveAddressBook(updated)
    },
    [addressBook]
  )

  const importFromCsv = useCallback(
    (file: File): Promise<{ success: number; failed: number }> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => {
          try {
            const text = e.target?.result as string
            const lines = text.split('\n').filter(line => line.trim())

            if (lines.length < 2) {
              reject(new Error('CSV file is empty or has no data rows'))
              return
            }

            const header = lines[0].toLowerCase().trim()
            if (!header.includes('name') || !header.includes('address')) {
              reject(
                new Error(
                  'Invalid CSV format. Header must contain "Name" and "Address" columns.'
                )
              )
              return
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
            const nameIdx = headers.indexOf('name')
            const addressIdx = headers.indexOf('address')

            let success = 0
            let failed = 0
            const newEntries: AddressBookEntry[] = [...addressBook]

            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',').map(v => v.trim())
              const name = values[nameIdx]
              const address = values[addressIdx]

              if (name && address) {
                const exists = newEntries.some(
                  e =>
                    e.address.toLowerCase() === address.toLowerCase() &&
                    e.source === 'Local'
                )
                if (!exists) {
                  newEntries.push({ name, address, source: 'Local' })
                  success++
                } else {
                  failed++
                }
              } else {
                failed++
              }
            }

            setAddressBook(newEntries)
            saveAddressBook(newEntries)
            resolve({ success, failed })
          } catch {
            reject(new Error('Failed to parse CSV file'))
          }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(file)
      })
    },
    [addressBook]
  )

  const downloadTemplate = useCallback(() => {
    const csvContent = 'Name,Address\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'address-book-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }, [])

  const resolveAddress = useCallback(
    async (
      address: string
    ): Promise<{ name: string; source: string } | null> => {
      // Get selected source from settings dropdown
      const selectedSource =
        localStorage.getItem('ADDRESS_BOOK_SOURCE') || 'local'
      const sourceName = selectedSource === 'local' ? 'Local' : selectedSource

      // Only check entries matching the selected source
      const match = addressBook.find(
        e =>
          e.address.toLowerCase() === address.toLowerCase() &&
          e.source === sourceName
      )
      if (match) return { name: match.name, source: match.source }

      return null
    },
    [addressBook]
  )

  return {
    addressBook,
    addEntry,
    addEntries,
    removeEntry,
    importFromCsv,
    downloadTemplate,
    resolveAddress,
  }
}
