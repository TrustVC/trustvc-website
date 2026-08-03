import { v5Contracts, v4Contracts } from '@trustvc/trustvc'
import { providers, Signer } from 'ethers'
import { useEffect, useState } from 'react'
import { TradeTrustToken } from '../types'
import { useTokenRegistryVersion } from './useTokenRegistryVersion'
import { useIsObligation } from './useIsObligation'
import { TokenRegistryVersions } from '../constants'

const { TradeTrustToken__factory, TrustVCToken__factory } = v5Contracts
const { TradeTrustToken__factory: TradeTrustToken__factoryV4 } = v4Contracts

export const useTokenRegistryContract = (
  address?: string,
  provider?: providers.Provider | Signer
): {
  tokenRegistry?: TradeTrustToken
} => {
  const [tokenRegistry, setTokenRegistry] = useState<TradeTrustToken>()
  const tokenRegistryVersion = useTokenRegistryVersion()
  const isObligation = useIsObligation()

  useEffect(() => {
    if (!address || !provider || !tokenRegistryVersion) return

    const instance = isObligation
      ? TrustVCToken__factory.connect(address, provider as any)
      : tokenRegistryVersion === TokenRegistryVersions.V4
        ? TradeTrustToken__factoryV4.connect(address, provider)
        : TradeTrustToken__factory.connect(address, provider)
    setTokenRegistry(instance as TradeTrustToken)
    return () => {
      setTokenRegistry(undefined)
    }
  }, [address, provider, tokenRegistryVersion, isObligation])

  return { tokenRegistry }
}
