// Environment configuration - no imports to avoid circular dependencies
export const IS_DEVELOPMENT =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

export const STABILITY_API_KEY = process.env.STABILITY_API_KEY || ''
export const STABILITY_TESTNET_API_KEY =
  process.env.STABILITY_TESTNET_API_KEY || ''
export const ASTRON_TESTNET_API_KEY = process.env.ASTRON_TESTNET_API_KEY || ''
export const INFURA_API_KEY = process.env.INFURA_API_KEY
export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY

const NETWORK = process.env.NET
  ? process.env.NET
  : IS_DEVELOPMENT
    ? 'sepolia'
    : 'mainnet'
const IS_MAINNET = NETWORK === 'mainnet'
const NETWORK_NAME = IS_MAINNET ? 'homestead' : NETWORK
const ETHERSCAN_SUBDOMAIN = IS_MAINNET ? '' : `${NETWORK_NAME}.`
const GA_MEASUREMENT_ID_DEVELOPMENT = 'G-13GYPPVD4Y'
const GA_MEASUREMENT_ID_PRODUCTION = 'G-7YL3CX08LM'
const GA_MEASUREMENT_ID = IS_MAINNET
  ? GA_MEASUREMENT_ID_PRODUCTION
  : GA_MEASUREMENT_ID_DEVELOPMENT

export const ETHERSCAN_BASE_URL = `https://${ETHERSCAN_SUBDOMAIN}etherscan.io/`
export { GA_MEASUREMENT_ID }
export const GA_CONFIG_OPTION = {
  allow_google_signals: false,
  allow_ad_personalization_signals: false,
  debug_mode: IS_DEVELOPMENT,
}
export { IS_MAINNET }
// Vite exposes only VITE_* via import.meta.env; `process.env` is stubbed in vite.config.js.
export const MAGIC_API_KEY =
  (import.meta.env?.VITE_MAGIC_API_KEY as string | undefined) ||
  (import.meta.env?.VITE_MAGIC_API_KEY_FALLBACK as string | undefined) ||
  ''
export { NETWORK, NETWORK_NAME }
export const NETWORK_ID = IS_MAINNET ? '1' : '11155111'
export const IS_TEST_ENV = process.env.NODE_ENV === 'test'
export const IS_DEV_SERVER = !!process.env.WEBPACK_DEV_SERVER
