export const PAYMASTER_CHANGE_EVENT = 'trustvc:paymasterchange'

function key(account: string): string {
  return `trustvc_paymaster_${account}`
}

export function getPaymasterAddress(
  account: string | undefined
): string | null {
  if (!account) return null
  return localStorage.getItem(key(account))
}

export function setPaymasterAddress(account: string, address: string): void {
  localStorage.setItem(key(account), address)
  window.dispatchEvent(new Event(PAYMASTER_CHANGE_EVENT))
}

export function removePaymasterAddress(account: string): void {
  localStorage.removeItem(key(account))
  window.dispatchEvent(new Event(PAYMASTER_CHANGE_EVENT))
}
