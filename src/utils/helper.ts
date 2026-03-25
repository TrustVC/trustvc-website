import { SUPPORTED_CHAINS } from '@trustvc/trustvc'

export const getRpcUrl = (chainId: string): string | null => {
  const chainEnvUrl = import.meta.env[`VITE_RPC_URL_${chainId}`]
  if (chainEnvUrl) return chainEnvUrl

  const chainDefaultUrl =
    SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]?.rpcUrl
  const safeChainUrl = chainDefaultUrl?.includes('undefined')
    ? null
    : chainDefaultUrl
  if (safeChainUrl) return safeChainUrl

  // Chain not recognised — return null to surface the issue
  return null
}

/**
 * Converts an unknown error to a user-friendly error message string
 * @param err - The error object (unknown type)
 * @param fallback - Default message if error cannot be parsed
 * @returns A user-friendly error message string
 */
export const toErrorMessage = (
  err: unknown,
  fallback = 'Verification failed. Please try again.'
): string => {
  if (err instanceof SyntaxError) {
    return 'Invalid file format. Please upload a valid TrustVC document.'
  }
  if (err instanceof Error) {
    return err.message
  }
  return fallback
}

/**
 * Formats an Ethereum address for display (shows first and last characters)
 * @param address - The full Ethereum address
 * @param prefixLength - Number of characters to show at start (default: 6)
 * @param suffixLength - Number of characters to show at end (default: 4)
 * @returns Formatted address string
 */
export const formatAddress = (
  address: string,
  prefixLength = 6,
  suffixLength = 4
): string => {
  if (!address || address.length < prefixLength + suffixLength) {
    return address
  }
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`
}
