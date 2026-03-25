import { useEffect, useState } from 'react'
import { fetchEndorsementChain, EndorsementChain } from '@trustvc/trustvc'
import { ethers } from 'ethers'
import { getRpcUrl } from '../../../utils/helper'

export interface EndorsementChainStatus {
  status: 'idle' | 'loading' | 'success' | 'error'
  errorMessage?: string
}

interface UseEndorsementChainParams {
  tokenRegistryAddress?: string
  tokenId?: string
  verifiedChainId?: string
  keyId?: string
}

interface UseEndorsementChainReturn {
  endorsementChain?: EndorsementChain
  endorsementChainStatus: EndorsementChainStatus
  showEndorsementChain: boolean
  handleShowEndorsementChain: () => void
  handleHideEndorsementChain: () => void
}

export const useEndorsementChain = ({
  tokenRegistryAddress,
  tokenId,
  verifiedChainId,
  keyId,
}: UseEndorsementChainParams): UseEndorsementChainReturn => {
  const [endorsementChain, setEndorsementChain] = useState<
    EndorsementChain | undefined
  >(undefined)
  const [endorsementChainStatus, setEndorsementChainStatus] =
    useState<EndorsementChainStatus>({ status: 'idle' })
  const [showEndorsementChain, setShowEndorsementChain] = useState(false)

  const handleShowEndorsementChain = () => {
    setShowEndorsementChain(true)
  }

  const handleHideEndorsementChain = () => {
    setShowEndorsementChain(false)
  }

  useEffect(() => {
    let cancelled = false

    const fetchEndorsementData = async () => {
      if (tokenRegistryAddress && tokenId && verifiedChainId) {
        setEndorsementChainStatus({ status: 'loading' })
        try {
          const rpcUrl = getRpcUrl(verifiedChainId)
          if (!rpcUrl) {
            throw new Error(
              `No RPC URL configured for chain ${verifiedChainId}`
            )
          }

          const provider = new ethers.providers.JsonRpcProvider(rpcUrl as any)
          const _endorsementChain = await fetchEndorsementChain(
            tokenRegistryAddress,
            tokenId,
            provider,
            keyId
          )
          if (cancelled) return
          setEndorsementChain(_endorsementChain)
          setEndorsementChainStatus({ status: 'success' })
        } catch (error) {
          if (cancelled) return
          console.error('Failed to fetch endorsement chain:', error)
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to load endorsement chain'
          setEndorsementChain(undefined)
          setEndorsementChainStatus({ status: 'error', errorMessage })
        }
      } else {
        // Reset to idle if required params are missing
        if (cancelled) return
        setEndorsementChainStatus({ status: 'idle' })
        setEndorsementChain(undefined)
      }
    }
    fetchEndorsementData()

    return () => {
      cancelled = true
    }
  }, [tokenRegistryAddress, tokenId, verifiedChainId, keyId])

  return {
    endorsementChain,
    endorsementChainStatus,
    showEndorsementChain,
    handleShowEndorsementChain,
    handleHideEndorsementChain,
  }
}
