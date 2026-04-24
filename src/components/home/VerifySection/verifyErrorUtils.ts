import { errorMessages } from '@trustvc/trustvc'

export const TYPES = errorMessages.TYPES
export const MESSAGES = errorMessages.MESSAGES

export type VerifyErrorType = (typeof TYPES)[keyof typeof TYPES]

/**
 * Detect error type from an Error object.
 * Should be called at the catch site where the raw error is available.
 */
export const getErrorTypeFromError = (err: unknown): VerifyErrorType => {
  if (err instanceof SyntaxError) {
    return TYPES.INVALID
  }

  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : ''

  if (!message) return TYPES.VERIFICATION_ERROR

  // Network field / unsupported network
  if (
    message.includes('Network not supported') ||
    message.includes('Unsupported network') ||
    message.includes('unsupported network')
  ) {
    return TYPES.NETWORK_INVALID
  }

  // Invalid address (ethers INVALID_ARGUMENT with address context)
  if (
    message.includes('invalid address') ||
    message.includes('ENS name') ||
    message.includes('address is invalid')
  ) {
    return TYPES.ADDRESS_INVALID
  }

  // Invalid argument (merkle root, contract args)
  if (
    message.includes('INVALID_ARGUMENT') ||
    message.includes('invalid argument')
  ) {
    return TYPES.INVALID_ARGUMENT
  }

  // Contract call revert / contract not found
  if (
    message.includes('call revert exception') ||
    message.includes('CALL_EXCEPTION')
  ) {
    return TYPES.CONTRACT_NOT_FOUND
  }

  // Server / RPC errors
  if (
    message.includes('SERVER_ERROR') ||
    message.includes('could not detect network') ||
    message.includes('bad response') ||
    message.includes('missing response')
  ) {
    return TYPES.SERVER_ERROR
  }

  // Client network errors
  if (
    message.includes('NETWORK_ERROR') ||
    message.includes('Failed to fetch') ||
    message.includes('network error')
  ) {
    return TYPES.CLIENT_NETWORK_ERROR
  }

  // Ethers unhandled errors (code= pattern from ethers logger)
  if (
    message.includes('code=') ||
    message.includes('UNPREDICTABLE_GAS_LIMIT') ||
    message.includes('NONCE_EXPIRED')
  ) {
    return TYPES.ETHERS_UNHANDLED_ERROR
  }

  return TYPES.VERIFICATION_ERROR
}
