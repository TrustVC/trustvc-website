import { CHAIN_ID } from '@trustvc/trustvc'

// Re-export environment config
export {
  IS_DEVELOPMENT,
  STABILITY_API_KEY,
  STABILITY_TESTNET_API_KEY,
  ASTRON_TESTNET_API_KEY,
  INFURA_API_KEY,
  ALCHEMY_API_KEY,
  ETHERSCAN_BASE_URL,
  GA_MEASUREMENT_ID,
  GA_CONFIG_OPTION,
  IS_MAINNET,
  MAGIC_API_KEY,
  NETWORK,
  NETWORK_NAME,
  NETWORK_ID,
  IS_TEST_ENV,
  IS_DEV_SERVER,
} from './env-config'

/**
 * Supported networks in production environment
 */
export const MAIN_NETWORKS = [
  CHAIN_ID.mainnet, //
  CHAIN_ID.matic,
  CHAIN_ID.xdc,
  CHAIN_ID.stability,
  CHAIN_ID.astron,
]

/**
 * Supported networks in development environment
 */
export const TEST_NETWORKS = [
  CHAIN_ID.sepolia,
  CHAIN_ID.amoy,
  CHAIN_ID.stabilitytestnet,
  CHAIN_ID.xdcapothem,
  CHAIN_ID.astrontestnet,
]
