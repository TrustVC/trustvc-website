import type { MagicUserMetadata } from '@magic-sdk/types'
import type { Magic } from 'magic-sdk'

/** User-facing errors for Magic wallet setup (publishable key + RPC). */
export const MAGIC_WALLET_ERRORS = {
  missingApiKey:
    'Magic is not configured. Set VITE_MAGIC_API_KEY (publishable key) in .env and restart the app.',
  missingRpc: (chainId: number | string) =>
    `No RPC URL for chain ${chainId}. Set VITE_RPC_URL_${chainId} or check ChainInfo for this network.`,
} as const

/**
 * Resolves the EVM address from Magic `user.getInfo()` via
 * `wallets.ethereum.publicAddress`.
 */
export function ethereumAddressFromMagicUserMetadata(
  info: MagicUserMetadata | null | undefined
): string | undefined {
  if (!info) return undefined
  const fromEthWallet = info.wallets?.ethereum?.publicAddress
  return fromEthWallet || undefined
}

/** Loads user info and returns the Ethereum address, or undefined if unavailable. */
export async function fetchMagicEthereumAddress(
  magic: Magic
): Promise<string | undefined> {
  try {
    const info = await magic.user.getInfo()
    return ethereumAddressFromMagicUserMetadata(info)
  } catch {
    return undefined
  }
}

export async function isMagicUserLoggedIn(magic: Magic): Promise<boolean> {
  try {
    return await magic.user.isLoggedIn()
  } catch {
    return false
  }
}

/** Warm iframe before `isLoggedIn` / `getInfo` during cold start. Failures are non-fatal. */
export async function preloadMagicSdk(magic: Magic): Promise<void> {
  if (typeof magic.preload !== 'function') return
  try {
    await magic.preload()
  } catch {
    // ignore — session restore can still proceed
  }
}

/** Magic Link artwork paths (matches dark mode like other wallet UI). */
export function getMagicLinkIconSrc(): string {
  if (typeof document === 'undefined') return '/images/magic_link.svg'
  return document.body.classList.contains('dark-mode')
    ? '/images/magic_link_dark.svg'
    : '/images/magic_link.svg'
}
