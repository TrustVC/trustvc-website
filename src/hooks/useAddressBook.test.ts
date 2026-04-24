import { renderHook, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAddressBook } from './useAddressBook'

describe('useAddressBook', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('initializes with empty address book', () => {
    const { result } = renderHook(() => useAddressBook())
    expect(result.current.addressBook).toEqual([])
  })

  it('loads address book from localStorage', () => {
    const entries = [
      { name: 'Alice', address: '0x1234', source: 'Local' },
      { name: 'Bob', address: '0x5678', source: 'Local' },
    ]
    localStorage.setItem('ADDRESS_BOOK', JSON.stringify(entries))

    const { result } = renderHook(() => useAddressBook())
    expect(result.current.addressBook).toEqual(entries)
  })

  describe('addEntry', () => {
    it('adds a new entry', () => {
      const { result } = renderHook(() => useAddressBook())

      act(() => {
        result.current.addEntry({
          name: 'Alice',
          address: '0x1234',
          source: 'Local',
        })
      })

      expect(result.current.addressBook).toHaveLength(1)
      expect(result.current.addressBook[0].name).toBe('Alice')
    })

    it('persists to localStorage', () => {
      const { result } = renderHook(() => useAddressBook())

      act(() => {
        result.current.addEntry({
          name: 'Alice',
          address: '0x1234',
          source: 'Local',
        })
      })

      const stored = JSON.parse(localStorage.getItem('ADDRESS_BOOK') || '[]')
      expect(stored).toHaveLength(1)
      expect(stored[0].name).toBe('Alice')
    })
  })

  describe('addEntries', () => {
    it('adds multiple entries at once', () => {
      const { result } = renderHook(() => useAddressBook())

      act(() => {
        result.current.addEntries([
          { name: 'Alice', address: '0x1234', source: 'Local' },
          { name: 'Bob', address: '0x5678', source: 'Local' },
        ])
      })

      expect(result.current.addressBook).toHaveLength(2)
    })

    it('skips duplicates with same address and source', () => {
      localStorage.setItem(
        'ADDRESS_BOOK',
        JSON.stringify([{ name: 'Alice', address: '0x1234', source: 'Local' }])
      )

      const { result } = renderHook(() => useAddressBook())

      act(() => {
        result.current.addEntries([
          { name: 'Alice Duplicate', address: '0x1234', source: 'Local' },
          { name: 'Bob', address: '0x5678', source: 'Local' },
        ])
      })

      expect(result.current.addressBook).toHaveLength(2)
      expect(result.current.addressBook[0].name).toBe('Alice')
      expect(result.current.addressBook[1].name).toBe('Bob')
    })

    it('allows same address from different source', () => {
      localStorage.setItem(
        'ADDRESS_BOOK',
        JSON.stringify([{ name: 'Alice', address: '0x1234', source: 'Local' }])
      )

      const { result } = renderHook(() => useAddressBook())

      act(() => {
        result.current.addEntries([
          {
            name: 'Alice Resolver',
            address: '0x1234',
            source: 'Mock Resolver',
          },
        ])
      })

      expect(result.current.addressBook).toHaveLength(2)
    })

    it('returns success and failed counts', () => {
      localStorage.setItem(
        'ADDRESS_BOOK',
        JSON.stringify([{ name: 'Alice', address: '0x1234', source: 'Local' }])
      )

      const { result } = renderHook(() => useAddressBook())
      let counts: { success: number; failed: number } = {
        success: 0,
        failed: 0,
      }

      act(() => {
        counts = result.current.addEntries([
          { name: 'Alice Dup', address: '0x1234', source: 'Local' },
          { name: 'Bob', address: '0x5678', source: 'Local' },
          { name: 'Charlie', address: '0x9abc', source: 'Local' },
        ])
      })

      expect(counts.success).toBe(2)
      expect(counts.failed).toBe(1)
    })
  })

  describe('removeEntry', () => {
    it('removes an entry by address', () => {
      localStorage.setItem(
        'ADDRESS_BOOK',
        JSON.stringify([
          { name: 'Alice', address: '0x1234', source: 'Local' },
          { name: 'Bob', address: '0x5678', source: 'Local' },
        ])
      )

      const { result } = renderHook(() => useAddressBook())

      act(() => {
        result.current.removeEntry('0x1234')
      })

      expect(result.current.addressBook).toHaveLength(1)
      expect(result.current.addressBook[0].name).toBe('Bob')
    })

    it('is case insensitive', () => {
      localStorage.setItem(
        'ADDRESS_BOOK',
        JSON.stringify([{ name: 'Alice', address: '0xAbCd', source: 'Local' }])
      )

      const { result } = renderHook(() => useAddressBook())

      act(() => {
        result.current.removeEntry('0xabcd')
      })

      expect(result.current.addressBook).toHaveLength(0)
    })
  })

  describe('resolveAddress', () => {
    it('resolves address from matching source', async () => {
      localStorage.setItem(
        'ADDRESS_BOOK',
        JSON.stringify([{ name: 'Alice', address: '0x1234', source: 'Local' }])
      )
      localStorage.setItem('ADDRESS_BOOK_SOURCE', 'local')

      const { result } = renderHook(() => useAddressBook())

      let resolved: { name: string; source: string } | null = null

      await act(async () => {
        resolved = await result.current.resolveAddress('0x1234')
      })

      expect(resolved).toEqual({ name: 'Alice', source: 'Local' })
    })

    it('returns null when address not found', async () => {
      localStorage.setItem('ADDRESS_BOOK_SOURCE', 'local')

      const { result } = renderHook(() => useAddressBook())

      let resolved: { name: string; source: string } | null = null

      await act(async () => {
        resolved = await result.current.resolveAddress('0xNotFound')
      })

      expect(resolved).toBeNull()
    })
  })
})
