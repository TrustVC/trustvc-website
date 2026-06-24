export const ANALYTICS_EVENTS = {
  /** Fired when a user drops or selects a document file for verification. */
  DOCUMENT_DROPPED: 'DOCUMENT_DROPPED',
  /** Fired when document verification completes — valid or invalid. */
  DOCUMENT_VERIFICATION_COMPLETED: 'DOCUMENT_VERIFICATION_COMPLETED',
  /** Fired when the network selection dialog appears (document has no embedded chain). */
  NETWORK_SELECTION_SHOWN: 'NETWORK_SELECTION_SHOWN',
  /** Fired when the user confirms a network in the selection dialog. */
  NETWORK_SELECTED: 'NETWORK_SELECTED',
  /** Fired when the user dismisses the network selection dialog without selecting. */
  NETWORK_SELECTION_CANCELLED: 'NETWORK_SELECTION_CANCELLED',
  /** Fired when the user resets the verifier back to idle state. */
  VERIFICATION_RESET: 'VERIFICATION_RESET',
  /** Fired when a wallet is successfully connected. */
  WALLET_CONNECTED: 'WALLET_CONNECTED',
  /** Fired when a connected wallet is explicitly disconnected. */
  WALLET_DISCONNECTED: 'WALLET_DISCONNECTED',
  /** Fired when a wallet connection attempt fails. */
  WALLET_CONNECT_FAILED: 'WALLET_CONNECT_FAILED',
  /** Fired when the user initiates a transferable record management action. */
  ASSET_ACTION_INITIATED: 'ASSET_ACTION_INITIATED',
  /** Fired when a support form is successfully submitted. */
  SUPPORT_FORM_SUBMITTED: 'SUPPORT_FORM_SUBMITTED',
  /** Fired when a support form submission fails. */
  SUPPORT_FORM_FAILED: 'SUPPORT_FORM_FAILED',
} as const
