import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import VerifyError from './VerifyError'
import { getErrorTypeFromError, TYPES, MESSAGES } from './verifyErrorUtils'

describe('VerifyError', () => {
  const onReset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders verification error', () => {
    const { getByTestId } = render(
      <VerifyError errorType={TYPES.VERIFICATION_ERROR} onReset={onReset} />
    )
    expect(getByTestId('error-message').textContent).toBe(
      MESSAGES[TYPES.VERIFICATION_ERROR].failureTitle
    )
    expect(getByTestId('recovery-message').textContent).toBe(
      MESSAGES[TYPES.VERIFICATION_ERROR].failureMessage
    )
  })

  it('renders hash/tampered error', () => {
    const { getByTestId } = render(
      <VerifyError errorType={TYPES.HASH} onReset={onReset} />
    )
    expect(getByTestId('error-message').textContent).toBe(
      'Document has been tampered with'
    )
  })

  it('renders revoked error', () => {
    const { getByTestId } = render(
      <VerifyError errorType={TYPES.REVOKED} onReset={onReset} />
    )
    expect(getByTestId('error-message').textContent).toBe('Document revoked')
  })

  it('renders issued error', () => {
    const { getByTestId } = render(
      <VerifyError errorType={TYPES.ISSUED} onReset={onReset} />
    )
    expect(getByTestId('error-message').textContent).toBe('Document not issued')
  })

  it('renders identity error', () => {
    const { getByTestId } = render(
      <VerifyError errorType={TYPES.IDENTITY} onReset={onReset} />
    )
    expect(getByTestId('error-message').textContent).toBe(
      'Document issuer identity is invalid'
    )
  })

  it('renders invalid document error', () => {
    const { getByTestId } = render(
      <VerifyError errorType={TYPES.INVALID} onReset={onReset} />
    )
    expect(getByTestId('error-message').textContent).toBe('Document is invalid')
  })

  it('renders server error', () => {
    const { getByTestId } = render(
      <VerifyError errorType={TYPES.SERVER_ERROR} onReset={onReset} />
    )
    expect(getByTestId('error-message').textContent).toBe(
      'Unable to connect to the blockchain network'
    )
  })

  it('renders client network error', () => {
    const { getByTestId } = render(
      <VerifyError errorType={TYPES.CLIENT_NETWORK_ERROR} onReset={onReset} />
    )
    expect(getByTestId('error-message').textContent).toBe(
      'Whoops! There seems to be an error verifying the document'
    )
  })

  it('renders contract not found error', () => {
    const { getByTestId } = render(
      <VerifyError errorType={TYPES.CONTRACT_NOT_FOUND} onReset={onReset} />
    )
    expect(getByTestId('error-message').textContent).toBe(
      'Document store or Token registry address cannot be found'
    )
  })

  it('calls onReset when "Try Another Document" is clicked', () => {
    const { getByTestId } = render(
      <VerifyError errorType={TYPES.VERIFICATION_ERROR} onReset={onReset} />
    )
    fireEvent.click(getByTestId('try-another-btn'))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('renders both action buttons', () => {
    const { getByTestId } = render(
      <VerifyError errorType={TYPES.VERIFICATION_ERROR} onReset={onReset} />
    )
    expect(getByTestId('what-should-i-do-btn')).toBeTruthy()
    expect(getByTestId('try-another-btn')).toBeTruthy()
  })

  it('renders the error document icon', () => {
    const { container } = render(
      <VerifyError errorType={TYPES.VERIFICATION_ERROR} onReset={onReset} />
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('renders the file info text', () => {
    const { getByText } = render(
      <VerifyError errorType={TYPES.VERIFICATION_ERROR} onReset={onReset} />
    )
    expect(
      getByText(/Maximum 10 MB. Supported files include .tt, .oa, and .json./)
    ).toBeTruthy()
  })
})

describe('getErrorTypeFromError', () => {
  it('returns INVALID for SyntaxError', () => {
    expect(getErrorTypeFromError(new SyntaxError('bad json'))).toBe(
      TYPES.INVALID
    )
  })

  it('returns VERIFICATION_ERROR for undefined', () => {
    expect(getErrorTypeFromError(undefined)).toBe(TYPES.VERIFICATION_ERROR)
  })

  it('returns VERIFICATION_ERROR for unknown error', () => {
    expect(getErrorTypeFromError(new Error('random'))).toBe(
      TYPES.VERIFICATION_ERROR
    )
  })

  it('returns NETWORK_INVALID for "Network not supported"', () => {
    expect(getErrorTypeFromError(new Error('Network not supported'))).toBe(
      TYPES.NETWORK_INVALID
    )
  })

  it('returns CONTRACT_NOT_FOUND for "call revert exception"', () => {
    expect(getErrorTypeFromError(new Error('call revert exception'))).toBe(
      TYPES.CONTRACT_NOT_FOUND
    )
  })

  it('returns SERVER_ERROR for "SERVER_ERROR"', () => {
    expect(getErrorTypeFromError(new Error('SERVER_ERROR'))).toBe(
      TYPES.SERVER_ERROR
    )
  })

  it('returns SERVER_ERROR for "could not detect network"', () => {
    expect(getErrorTypeFromError(new Error('could not detect network'))).toBe(
      TYPES.SERVER_ERROR
    )
  })

  it('returns CLIENT_NETWORK_ERROR for generic network error', () => {
    expect(getErrorTypeFromError(new Error('NETWORK_ERROR'))).toBe(
      TYPES.CLIENT_NETWORK_ERROR
    )
  })

  it('handles plain string errors', () => {
    expect(getErrorTypeFromError('Network not supported')).toBe(
      TYPES.NETWORK_INVALID
    )
  })

  it('returns VERIFICATION_ERROR for non-string non-Error values', () => {
    expect(getErrorTypeFromError(42)).toBe(TYPES.VERIFICATION_ERROR)
  })
})
