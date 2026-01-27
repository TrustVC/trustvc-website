import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock localStorage
const localStorageMock: Record<string, string> = {}

const storage: Storage = {
  getItem: (key: string): string | null => {
    return localStorageMock[key] || null
  },
  setItem: (key: string, value: string): void => {
    localStorageMock[key] = value
  },
  removeItem: (key: string): void => {
    delete localStorageMock[key]
  },
  clear: (): void => {
    Object.keys(localStorageMock).forEach(key => {
      delete localStorageMock[key]
    })
  },
  key: (index: number): string | null => {
    const keys = Object.keys(localStorageMock)
    return keys[index] || null
  },
  get length(): number {
    return Object.keys(localStorageMock).length
  },
}

globalThis.localStorage = storage
