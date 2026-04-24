import { useState, useEffect, useCallback } from 'react'
import { providers, Signer, utils } from 'ethers'
import {
  getTitleEscrowAddress,
  v5Contracts,
  v4Contracts,
} from '@trustvc/trustvc'
import { TitleEscrow, TradeTrustToken } from '../types'
import { TokenRegistryVersions } from '../constants'
import { useTokenRegistryVersion } from './useTokenRegistryVersion'
const { TitleEscrow__factory } = v5Contracts
const { TitleEscrow__factory: TitleEscrow__factoryV4 } = v4Contracts
interface useTitleEscrowContractProps {
  titleEscrow?: TitleEscrow
  titleEscrowAddress?: string
  documentOwner?: string
  updateTitleEscrow: () => Promise<void>
}

export const useTitleEscrowContract = (
  providerOrSigner: providers.Provider | Signer | undefined,
  tokenRegistry?: TradeTrustToken,
  tokenId?: string
): useTitleEscrowContractProps => {
  const [titleEscrow, setTitleEscrow] = useState<TitleEscrow>()
  const [titleEscrowAddress, setTitleEscrowAddress] = useState<string>()
  const [documentOwner, setDocumentOwner] = useState<string>()
  const tokenRegistryVersion = useTokenRegistryVersion()

  const updateTitleEscrow = useCallback(async () => {
    if (
      !tokenRegistry ||
      !tokenId ||
      !providerOrSigner ||
      !tokenRegistryVersion
    )
      return
    try {
      const provider = (
        'provider' in providerOrSigner
          ? providerOrSigner.provider
          : providerOrSigner
      ) as providers.Provider
      // Skip v6 contract call (tokenRegistry.ownerOf uses v6 internally which hits Infura)
      // Use v5 provider.call directly with the correct RPC
      const iface = new utils.Interface([
        'function ownerOf(uint256) view returns (address)',
      ])
      const data = iface.encodeFunctionData('ownerOf', [tokenId])
      const contractAddr =
        (tokenRegistry as any).target ?? (tokenRegistry as any).address
      const result = await provider.call({ to: contractAddr, data })
      if (!result || result === '0x') throw new Error('Token not found')
      const [titleEscrowOwner] = iface.decodeFunctionResult('ownerOf', result)
      setDocumentOwner(titleEscrowOwner)
      const address = await getTitleEscrowAddress(
        tokenRegistry.target,
        tokenId,
        provider,
        {
          titleEscrowVersion: tokenRegistryVersion.toLowerCase() as 'v4' | 'v5',
        }
      )
      let instance
      if (tokenRegistryVersion === TokenRegistryVersions.V4) {
        instance = TitleEscrow__factoryV4.connect(address, providerOrSigner)
      } else {
        instance = TitleEscrow__factory.connect(
          address,
          providerOrSigner as any
        )
      }
      setTitleEscrow(instance)
      setTitleEscrowAddress(address)
    } catch (error) {
      console.log(error)
      setTitleEscrow(undefined)
      setTitleEscrowAddress(undefined)
    }
  }, [providerOrSigner, tokenId, tokenRegistry, tokenRegistryVersion])

  useEffect(() => {
    updateTitleEscrow()
    return () => {
      setTitleEscrow(undefined)
      setDocumentOwner(undefined)
      setTitleEscrowAddress(undefined)
    }
  }, [updateTitleEscrow, tokenId, providerOrSigner])

  return { titleEscrow, titleEscrowAddress, updateTitleEscrow, documentOwner }
}
