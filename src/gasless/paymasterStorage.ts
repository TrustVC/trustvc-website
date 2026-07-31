export const PAYMASTER_CHANGE_EVENT = 'trustvc:paymasterchange'

// TODO: Replace with localStorage so the address persists across reloads.
// Using in-memory storage for now so the paymaster resets on every page load.
const store = new Map<string, string>()

export function getPaymasterAddress(
  account: string | undefined
): string | null {
  if (!account) return null
  return store.get(account) ?? null
}

export function setPaymasterAddress(account: string, address: string): void {
  store.set(account, address)
  window.dispatchEvent(new Event(PAYMASTER_CHANGE_EVENT))
}

export function removePaymasterAddress(account: string): void {
  store.delete(account)
  window.dispatchEvent(new Event(PAYMASTER_CHANGE_EVENT))
}
