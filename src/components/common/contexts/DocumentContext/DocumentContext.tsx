import React, { createContext, useContext, useState, ReactNode } from 'react'

export type TokenRegistryVersion = 'V4' | 'V5' | null

interface DocumentContextValue {
  keyId: string | null
  setKeyId: (keyId: string | null) => void
  tokenRegistryVersion: TokenRegistryVersion
  setTokenRegistryVersion: (version: TokenRegistryVersion) => void
  tokenId: string | null
  setTokenId: (tokenId: string | null) => void
  tokenRegistryAddress: string | null
  setTokenRegistryAddress: (address: string | null) => void
  /** True when the verified document is a BoE / Obligation Record. */
  isObligation: boolean
  setIsObligation: (isObligation: boolean) => void
}

const DocumentContext = createContext<DocumentContextValue | undefined>(
  undefined
)

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [keyId, setKeyId] = useState<string | null>(null)
  const [tokenRegistryVersion, setTokenRegistryVersion] =
    useState<TokenRegistryVersion>(null)
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [tokenRegistryAddress, setTokenRegistryAddress] = useState<
    string | null
  >(null)
  const [isObligation, setIsObligation] = useState(false)

  return (
    <DocumentContext.Provider
      value={{
        keyId,
        setKeyId,
        tokenRegistryVersion,
        setTokenRegistryVersion,
        tokenId,
        setTokenId,
        tokenRegistryAddress,
        setTokenRegistryAddress,
        isObligation,
        setIsObligation,
      }}
    >
      {children}
    </DocumentContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDocumentContext = (): DocumentContextValue => {
  const context = useContext(DocumentContext)
  if (!context) {
    throw new Error('useDocumentContext must be used within DocumentProvider')
  }
  return context
}
