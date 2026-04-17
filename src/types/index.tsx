import { v4Contracts, v5Contracts } from '@trustvc/trustvc'

export type TitleEscrow =
  | typeof v5Contracts.TitleEscrow
  | typeof v4Contracts.TitleEscrow
export type TradeTrustToken =
  | typeof v5Contracts.TradeTrustToken
  | typeof v4Contracts.TradeTrustToken
