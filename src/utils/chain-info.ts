import { CHAIN_ID, SUPPORTED_CHAINS, chainInfo } from '@trustvc/trustvc'

export type Network =
  | 'homestead'
  | 'local'
  | 'sepolia'
  | 'matic'
  | 'amoy'
  | 'xdc'
  | 'xdcapothem'
  | 'stabilitytestnet'
  | 'stability'
  | 'astron'
  | 'astrontestnet'

export const InitialAddress = '0x0000000000000000000000000000000000000000'
export const BurnAddress = '0x000000000000000000000000000000000000dEaD'

export type AvailableBlockChains = 'ETH' | 'MATIC' | 'XDC' | 'FREE' | 'ASTRON'
export const AvailableBlockChains: AvailableBlockChains[] = [
  'ETH',
  'MATIC',
  'XDC',
  'FREE',
  'ASTRON',
]

type ChainInfo = Record<CHAIN_ID, chainInfo>

export const CHAIN: Record<CHAIN_ID, AvailableBlockChains> = {
  [CHAIN_ID.local]: 'ETH',
  [CHAIN_ID.mainnet]: 'ETH',
  [CHAIN_ID.sepolia]: 'ETH',
  [CHAIN_ID.matic]: 'MATIC',
  [CHAIN_ID.amoy]: 'MATIC',
  [CHAIN_ID.xdc]: 'XDC',
  [CHAIN_ID.xdcapothem]: 'XDC',
  [CHAIN_ID.stability]: 'FREE',
  [CHAIN_ID.stabilitytestnet]: 'FREE',
  [CHAIN_ID.astron]: 'ASTRON',
  [CHAIN_ID.astrontestnet]: 'ASTRON',
}

export const ChainInfo: ChainInfo = {
  ...SUPPORTED_CHAINS,
  // Override or add local-specific chains if needed
  [CHAIN_ID.local]: {
    label: 'Local',
    id: CHAIN_ID.local,
    iconImage: '/static/images/networks/ethereum.gif',
    name: 'local',
    type: 'development',
    currency: 'ETH',
    rpcUrl: 'http://localhost:8545',
    explorerUrl: 'https://localhost/explorer',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'LOCAL',
      decimals: 18,
    },
  },
}

export const supportedMainnet = [
  ChainInfo[CHAIN_ID.mainnet].name,
  ChainInfo[CHAIN_ID.matic].name,
  ChainInfo[CHAIN_ID.xdc].name,
  ChainInfo[CHAIN_ID.stability].name,
  ChainInfo[CHAIN_ID.astron].name,
]

export const supportedTestnet = [
  ChainInfo[CHAIN_ID.sepolia].name,
  ChainInfo[CHAIN_ID.amoy].name,
  ChainInfo[CHAIN_ID.xdcapothem].name,
  ChainInfo[CHAIN_ID.stabilitytestnet].name,
  ChainInfo[CHAIN_ID.astrontestnet].name,
]
