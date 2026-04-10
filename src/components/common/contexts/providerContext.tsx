import { ProviderDetails, utils, CHAIN_ID, chainInfo } from '@trustvc/trustvc'
import { ethers, providers } from 'ethers'
import { Magic } from 'magic-sdk'
import React, {
  createContext,
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { INFURA_API_KEY, NETWORK_NAME } from '../../../configs/chain-config'
import { ChainInfo } from '../../../utils/chain-info'
// import { UnsupportedNetworkError } from '../errors'
import {
  getChainInfo,
  getChainInfoFromNetworkName,
  isSupportedNetwork,
  walletSwitchChain,
} from '../../../utils/chain-utils'
import { MAGIC_API_KEY } from '../../../configs/env-config'

export enum SIGNER_TYPE {
  IDENTITY = 'Identity', // Internal RPC to query only.
  METAMASK = 'Metamask',
  MAGIC = 'Magic',
  NONE = 'None',
}

const createProvider = (chainId: CHAIN_ID) => {
  const url = ChainInfo[chainId].rpcUrl
  const opts: ProviderDetails = url
    ? { url }
    : {
        network: getChainInfo(chainId).name,
        providerType: 'infura',
        apiKey: INFURA_API_KEY,
      }
  return chainId === CHAIN_ID.local
    ? new providers.JsonRpcProvider(url)
    : utils.generateProvider(opts)
}

// Utility function for use in non-react components that cannot get through hooks
let currentProvider: providers.Provider | undefined = createProvider(
  getChainInfoFromNetworkName(NETWORK_NAME).id
)

export const getCurrentProvider = (): providers.Provider | undefined =>
  currentProvider

export interface ProviderContextProps {
  providerType: SIGNER_TYPE
  upgradeToMetaMaskSigner: () => Promise<void>
  upgradeToMagicSigner: () => Promise<void>
  changeNetwork: (chainId: CHAIN_ID) => void
  reloadNetwork: () => Promise<void>
  supportedChainInfoObjects: chainInfo[]
  currentChainId: CHAIN_ID | undefined
  provider: providers.Provider | undefined
  providerOrSigner: providers.Provider | ethers.Signer | undefined
  account: string | undefined
  networkChangeLoading: boolean
  setNetworkChangeLoading: (loading: boolean) => void
  disconnectWallet: (disconnectOnly?: boolean) => Promise<void>
}

export const ProviderContext = createContext<ProviderContextProps>({
  providerType: SIGNER_TYPE.NONE,
  upgradeToMetaMaskSigner: async () => {},
  changeNetwork: async (_chainId: CHAIN_ID) => {},
  upgradeToMagicSigner: async () => {},
  reloadNetwork: async () => {},
  supportedChainInfoObjects: [],
  currentChainId: undefined,
  provider: currentProvider,
  providerOrSigner: currentProvider,
  account: undefined,
  networkChangeLoading: false,
  setNetworkChangeLoading: () => {},
  disconnectWallet: () => Promise.resolve(),
})

interface Ethereum extends providers.ExternalProvider, providers.BaseProvider {
  enable: () => void
}

declare global {
  interface Window {
    ethereum: Ethereum
    web3: {
      currentProvider: providers.ExternalProvider
    }
  }
}

interface ProviderContextProviderProps {
  children: React.ReactNode
  networks: chainInfo[]
  defaultChainId: CHAIN_ID
  defaultProviderType?: SIGNER_TYPE
}

export const ProviderContextProvider: FunctionComponent<
  ProviderContextProviderProps
> = ({
  children,
  networks: supportedChainInfoObjects,
  defaultChainId,
  defaultProviderType = SIGNER_TYPE.NONE,
}) => {
  const defaultProvider = useRef(createProvider(defaultChainId))
  const magicRef = useRef<Magic | null>(null)
  const magicChainIdRef = useRef<CHAIN_ID | null>(null)
  const [isMagicLoggedIn, setIsMagicLoggedIn] = useState(false)

  const [providerType, setProviderType] =
    useState<SIGNER_TYPE>(defaultProviderType)
  const [currentChainId, setCurrentChainId] = useState<CHAIN_ID | undefined>(
    isSupportedNetwork(defaultChainId, supportedChainInfoObjects)
      ? defaultChainId
      : undefined
  )
  const [account, setAccount] = useState<string | undefined>()
  const [providerOrSigner, setProviderOrSigner] = useState<
    providers.Provider | ethers.Signer | undefined
  >(defaultProvider.current)
  const [provider, setProvider] = useState<providers.Provider | undefined>(
    defaultProvider.current
  )

  const [networkChangeLoading, setNetworkChangeLoading] =
    useState<boolean>(false)

  const getOrCreateMagic = useCallback((chainId: CHAIN_ID): Magic | null => {
    if (!MAGIC_API_KEY) return null
    const rpcUrl = ChainInfo[chainId]?.rpcUrl
    if (!rpcUrl) return null
    if (magicRef.current && magicChainIdRef.current !== chainId) {
      magicRef.current = null
      magicChainIdRef.current = null
    }
    if (!magicRef.current) {
      magicRef.current = new Magic(MAGIC_API_KEY, {
        network: { rpcUrl, chainId: Number(chainId) },
      })
      magicChainIdRef.current = chainId
    }
    return magicRef.current
  }, [])

  const changeNetwork = async (chainId: CHAIN_ID) => {
    try {
      if (
        providerType === SIGNER_TYPE.METAMASK ||
        providerType === SIGNER_TYPE.NONE
      ) {
        await walletSwitchChain(chainId)
      }
      if (providerType === SIGNER_TYPE.MAGIC) {
        magicRef.current = null
        magicChainIdRef.current = null
        // Refresh Web3Provider immediately — effects still see stale `currentChainId` until setState flushes.
        await updateProvider(SIGNER_TYPE.MAGIC, chainId)
      }
      setCurrentChainId(chainId)

      // Escape same network switch, loading error
      if (currentChainId === chainId) {
        setNetworkChangeLoading(false)
      }
    } catch (error) {
      console.error('Failed to change network:', error)
      setNetworkChangeLoading(false)
    }
  }

  const getMetaMaskWallet = async (
    throwError: boolean = true
  ): Promise<providers.Web3Provider | undefined> => {
    const { ethereum, web3 } = window
    const injectedWeb3 = ethereum || (web3 && web3.currentProvider)
    if (!injectedWeb3) {
      if (!throwError) return
      throw new Error(
        'Oops! Seems like MetaMask is not installed in your browser'
      )
    }
    return new ethers.providers.Web3Provider(injectedWeb3, 'any')
  }

  const updateProvider = useCallback(
    async (
      _providerType: SIGNER_TYPE = providerType,
      chainIdOverride?: CHAIN_ID
    ) => {
      let newProvider: providers.Provider | undefined = undefined

      if (_providerType === SIGNER_TYPE.METAMASK) {
        const { ethereum, web3 } = window
        const metamaskExtensionNotFound =
          typeof ethereum === 'undefined' || typeof web3 === 'undefined'
        if (metamaskExtensionNotFound || !ethereum?.request) {
          console.warn('MetaMask extension not found')
        } else {
          const injectedWeb3 = ethereum || (web3 && web3.currentProvider)

          newProvider = new ethers.providers.Web3Provider(injectedWeb3, 'any')
          const network = await newProvider.getNetwork()
          setProvider(newProvider)
          if (!isSupportedNetwork(network.chainId, supportedChainInfoObjects)) {
            console.warn('User wallet is connected to an unsupported network')
            setCurrentChainId(undefined)
            return
          } else {
            setCurrentChainId(network.chainId as unknown as CHAIN_ID)
            return newProvider
          }
        }
      }
      const magicChainId = (chainIdOverride ??
        currentChainId ??
        defaultChainId) as CHAIN_ID
      const magic = getOrCreateMagic(magicChainId)
      if (_providerType === SIGNER_TYPE.MAGIC && magic?.rpcProvider) {
        const chainMeta = getChainInfo(magicChainId)
        // Tell ethers the chain so it does not rely on eth_chainId from a flaky RPC (avoids NETWORK_ERROR / noNetwork).
        newProvider = new ethers.providers.Web3Provider(
          magic.rpcProvider as unknown as providers.ExternalProvider,
          { chainId: Number(magicChainId), name: chainMeta.name }
        )
        setProvider(newProvider)
        setCurrentChainId(magicChainId)
        return newProvider
      }
      // fallback to internal default rpcUrl
      const fallbackChainId = (chainIdOverride ??
        currentChainId ??
        defaultChainId) as CHAIN_ID
      newProvider = createProvider(fallbackChainId)
      setProvider(newProvider)
      setProviderType(SIGNER_TYPE.IDENTITY)
      setAccount(undefined)
      return newProvider
    },

    [
      currentChainId,
      defaultChainId,
      providerType,
      supportedChainInfoObjects,
      getOrCreateMagic,
    ]
  )

  const updateSigner = useCallback(async () => {
    if (!provider) return

    try {
      if (provider instanceof ethers.providers.Web3Provider) {
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          await provider.send('eth_requestAccounts', [])
          const signer = provider.getSigner()
          const address = await signer.getAddress()
          setAccount(address)
          setProviderOrSigner(signer)
          setNetworkChangeLoading(false)
          return
        }
      }
      setAccount(undefined)
      setProviderOrSigner(provider)
    } catch (e) {
      setAccount(undefined)
      console.log(e)
      setProviderOrSigner(createProvider(currentChainId!))
    }
    setNetworkChangeLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])

  const initializeMetaMaskSigner = async () => {
    try {
      const newProvider: ethers.providers.Web3Provider =
        (await getMetaMaskWallet())!
      // Request to connect to MetaMask
      await newProvider.send('eth_requestAccounts', [])
      const chainInfo = getChainInfo(currentChainId ?? defaultChainId)
      await walletSwitchChain(chainInfo.id)

      setProviderType(SIGNER_TYPE.METAMASK)
    } catch (error: any) {
      console.error('initializeMetaMaskSigner', error)
      setProviderType(SIGNER_TYPE.NONE)
      throw error // Re-throw the error to be handled by the caller
    }
  }

  const initializeMagicSigner = async () => {
    const chainId = (currentChainId || defaultChainId) as CHAIN_ID
    const magic = getOrCreateMagic(chainId)
    if (!magic) {
      if (!MAGIC_API_KEY) {
        throw new Error(
          'Magic is not configured. Set VITE_MAGIC_API_KEY (publishable key) in .env and restart the app.'
        )
      }
      throw new Error(
        `No RPC URL for chain ${chainId}. Check ChainInfo configuration for this network.`
      )
    }
    let alreadyLoggedIn = false
    try {
      alreadyLoggedIn = await magic.user.isLoggedIn()
    } catch {
      alreadyLoggedIn = false
    }
    if (alreadyLoggedIn) {
      setIsMagicLoggedIn(true)
    } else {
      await magic.wallet.connectWithUI()
      setIsMagicLoggedIn(true)
    }
    const magicMetadata = await (magic.user as any)?.getMetadata?.()
    const magicAddress = magicMetadata?.publicAddress
    if (magicAddress) {
      setAccount(magicAddress)
    }
    setProviderType(SIGNER_TYPE.MAGIC)
  }

  const upgradeToMagicSigner = async () => {
    await disconnectWallet(false)
    await updateProvider(SIGNER_TYPE.MAGIC)
    return initializeMagicSigner()
  }

  const upgradeToMetaMaskSigner = async () => {
    // if (providerType === SIGNER_TYPE.METAMASK) return;
    await disconnectWallet(false)
    await updateProvider(SIGNER_TYPE.METAMASK)
    return initializeMetaMaskSigner()
  }

  const reloadNetwork = async () => {
    // if (!provider) throw new UnsupportedNetworkError()
    if (!provider) return

    const chainId = (await provider.getNetwork()).chainId
    await changeNetwork(chainId as unknown as CHAIN_ID)
  }

  const disconnectWallet = async (disconnectOnly: boolean = true) => {
    if (providerType === SIGNER_TYPE.METAMASK) {
      if (!window?.ethereum || !window?.ethereum?.request) return
      try {
        // Experimental functions: https://github.com/MetaMask/metamask-improvement-proposals/blob/main/MIPs/mip-2.md
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        })
      } catch (error) {
        console.error('Error revoking wallet permissions:', error)
      }
    }
    if (providerType === SIGNER_TYPE.MAGIC) {
      try {
        await magicRef.current?.user.logout()
      } finally {
        setIsMagicLoggedIn(false)
        magicRef.current = null
        magicChainIdRef.current = null
      }
    }

    if (disconnectOnly) {
      // After wallet disconnected, provider will become internal default provider
      setProviderType(SIGNER_TYPE.NONE)
      setAccount(undefined)
    }
  }

  useEffect(() => {
    updateProvider()
  }, [updateProvider])

  useEffect(() => {
    updateSigner()
  }, [updateSigner])

  useEffect(() => {
    currentProvider = provider
  }, [provider])

  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = () => {
      if (providerType !== SIGNER_TYPE.METAMASK) return
      updateProvider(SIGNER_TYPE.METAMASK)
    }

    const handleChainChanged = (chainIdHex: string) => {
      if (providerType !== SIGNER_TYPE.METAMASK) return
      //  changeNetwork(parseInt(chainIdHex, 16));
      setCurrentChainId(parseInt(chainIdHex, 16) as unknown as CHAIN_ID)
    }

    const handleDisconnect = () => {
      if (providerType !== SIGNER_TYPE.METAMASK) return
      disconnectWallet(true)
    }

    window.ethereum
      .on('accountsChanged', handleAccountsChanged)
      .on('chainChanged', handleChainChanged)
      .on('disconnect', handleDisconnect)

    return () => {
      if (!window.ethereum) return
      window.ethereum
        .removeListener('accountsChanged', handleAccountsChanged)
        .removeListener('chainChanged', handleChainChanged)
        .removeListener('disconnect', handleDisconnect)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerType, updateProvider, currentChainId])

  useEffect(() => {
    // On initial load, check if MetaMask is connected or Magic is logged in, set providerType if it is
    if (providerType === SIGNER_TYPE.NONE) {
      ;(async () => {
        const metamask = await getMetaMaskWallet(false)
        if (!metamask) return

        const accounts = await metamask?.listAccounts()
        if (accounts.length > 0) {
          setProviderType(SIGNER_TYPE.METAMASK)
        }
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (providerType === SIGNER_TYPE.NONE && isMagicLoggedIn) {
      setProviderType(SIGNER_TYPE.MAGIC)
    }
  }, [providerType, isMagicLoggedIn])

  useEffect(() => {
    ;(async () => {
      if (providerType !== SIGNER_TYPE.MAGIC || account) return
      const magic = getOrCreateMagic(
        (currentChainId || defaultChainId) as CHAIN_ID
      )
      if (!magic) return
      const magicMetadata = await (magic.user as any)?.getMetadata?.()
      const magicAddress = magicMetadata?.publicAddress
      if (magicAddress) {
        setAccount(magicAddress)
      }
    })()
  }, [providerType, account, currentChainId, defaultChainId, getOrCreateMagic])

  useEffect(() => {
    ;(async () => {
      const magic = getOrCreateMagic(
        (currentChainId || defaultChainId) as CHAIN_ID
      )
      if (!magic) return
      try {
        setIsMagicLoggedIn(await magic.user.isLoggedIn())
      } catch {
        setIsMagicLoggedIn(false)
      }
    })()
  }, [currentChainId, defaultChainId, getOrCreateMagic])

  return (
    <ProviderContext.Provider
      value={{
        providerType,
        upgradeToMetaMaskSigner,
        upgradeToMagicSigner,
        changeNetwork,
        reloadNetwork,
        supportedChainInfoObjects,
        currentChainId,
        provider,
        providerOrSigner,
        account,
        networkChangeLoading,
        setNetworkChangeLoading,
        disconnectWallet,
      }}
    >
      {children}
    </ProviderContext.Provider>
  )
}

export const useProviderContext = (): ProviderContextProps =>
  useContext<ProviderContextProps>(ProviderContext)
