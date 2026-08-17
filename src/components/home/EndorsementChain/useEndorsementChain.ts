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
  refreshEndorsementChain: () => void
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
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleShowEndorsementChain = () => {
    setShowEndorsementChain(true)
  }

  const handleHideEndorsementChain = () => {
    setShowEndorsementChain(false)
  }

  const refreshEndorsementChain = () => {
    setRefreshTrigger(prev => prev + 1)
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
          // SDK auto-detects Title Escrow V4/V5 vs ObligationEscrow.
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
        if (cancelled) return
        setEndorsementChainStatus({ status: 'idle' })
        setEndorsementChain(undefined)
      }
    }
    fetchEndorsementData()

    return () => {
      cancelled = true
    }
  }, [tokenRegistryAddress, tokenId, verifiedChainId, keyId, refreshTrigger])

  return {
    endorsementChain,
    endorsementChainStatus,
    showEndorsementChain,
    handleShowEndorsementChain,
    handleHideEndorsementChain,
    refreshEndorsementChain,
  }
}
