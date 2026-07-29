export const TOOLKIT_TABS = [
  { id: 'wrap', label: 'Wrap / Unwrap' },
  { id: 'dns-resolver', label: 'DNS Resolver' },
  { id: 'encrypt-decrypt', label: 'Encrypt / Decrypt' },
  { id: 'revoke', label: 'Revoke Document' },
] as const

export type ToolkitTabId = (typeof TOOLKIT_TABS)[number]['id']

export const isToolkitTabId = (v: string | null): v is ToolkitTabId =>
  TOOLKIT_TABS.some(t => t.id === v)
