import { useState, useEffect, useCallback, useRef } from 'react'
import { providers, Signer, utils } from 'ethers'
import {
  getTitleEscrowAddress,
  v5Contracts,
  v4Contracts,
} from '@trustvc/trustvc'
import { TitleEscrow, TradeTrustToken } from '../types'
import { TokenRegistryVersions } from '../constants'
import { useTokenRegistryVersion } from './useTokenRegistryVersion'
import { useIsObligation } from './useIsObligation'

const { TitleEscrow__factory, ObligationEscrow__factory } = v5Contracts
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
  const isObligation = useIsObligation()
  const tokenIdRef = useRef(tokenId)
  tokenIdRef.current = tokenId

  const updateTitleEscrow = useCallback(async () => {
    const requestedTokenId = tokenId
    if (
      !tokenRegistry ||
      !requestedTokenId ||
      !providerOrSigner ||
      !tokenRegistryVersion
    )
      return
    const isCurrentToken = () => tokenIdRef.current === requestedTokenId
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
      const data = iface.encodeFunctionData('ownerOf', [requestedTokenId])
      const contractAddr =
        (tokenRegistry as any).target ?? (tokenRegistry as any).address
      if (!contractAddr) throw new Error('Token registry address unavailable')
      const result = await provider.call({ to: contractAddr, data })
      if (!isCurrentToken()) return
      if (!result || result === '0x') throw new Error('Token not found')
      const [titleEscrowOwner] = iface.decodeFunctionResult('ownerOf', result)
      const address = await getTitleEscrowAddress(
        contractAddr,
        requestedTokenId,
        provider,
        {
          titleEscrowVersion: isObligation
            ? 'v5'
            : (tokenRegistryVersion.toLowerCase() as 'v4' | 'v5'),
        }
      )
      let instance
      if (isObligation) {
        instance = ObligationEscrow__factory.connect(
          address,
          providerOrSigner as any
        )
      } else if (tokenRegistryVersion === TokenRegistryVersions.V4) {
        instance = TitleEscrow__factoryV4.connect(address, providerOrSigner)
      } else {
        instance = TitleEscrow__factory.connect(
          address,
          providerOrSigner as any
        )
      }
      if (!isCurrentToken()) return
      setDocumentOwner(titleEscrowOwner)
      setTitleEscrow(instance as TitleEscrow)
      setTitleEscrowAddress(address)
    } catch (error) {
      if (!isCurrentToken()) return
      console.error(error)
      setTitleEscrow(undefined)
      setTitleEscrowAddress(undefined)
      setDocumentOwner(undefined)
    }
  }, [
    providerOrSigner,
    tokenId,
    tokenRegistry,
    tokenRegistryVersion,
    isObligation,
  ])

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
