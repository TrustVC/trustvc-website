import { CHAIN_ID } from '@trustvc/trustvc'

// Re-export environment config
export { NETWORK_NAME, IS_TESTNET, INFURA_API_KEY } from './env-config'

/**
 * Supported networks in production environment
 */
export const MAIN_NETWORKS = [
  CHAIN_ID.mainnet, //
  CHAIN_ID.matic, // pol alias — update to CHAIN_ID.pol once @trustvc/trustvc >= 2.14.0 is published
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
