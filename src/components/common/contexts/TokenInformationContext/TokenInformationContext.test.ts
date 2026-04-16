import { describe, expect, it, beforeEach } from 'vitest'
import { getContractReadValue } from './TokenInformationContext'

const logCurrentTestName = () => {
  const currentTestName = expect.getState().currentTestName
  if (currentTestName) {
    console.log(`[TEST] ${currentTestName}`)
  }
}

beforeEach(() => {
  logCurrentTestName()
})

describe('getContractReadValue', () => {
  it('returns the first value for array-like contract responses', () => {
    expect(
      getContractReadValue([
        '0x1234567890123456789012345678901234567890',
        'ignored',
      ])
    ).toBe('0x1234567890123456789012345678901234567890')
  })

  it('returns the first value for object responses with numeric key', () => {
    expect(
      getContractReadValue({
        0: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        length: 1,
      })
    ).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
  })

  it('returns string values directly without truncating them', () => {
    const address = '0x1111111111111111111111111111111111111111'
    expect(getContractReadValue(address)).toBe(address)
  })

  it('returns undefined for unsupported values', () => {
    expect(getContractReadValue(undefined)).toBeUndefined()
    expect(getContractReadValue(null)).toBeUndefined()
    expect(getContractReadValue(123)).toBeUndefined()
    expect(getContractReadValue({ foo: 'bar' })).toBeUndefined()
  })
})
