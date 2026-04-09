import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom'
import { OverlayProvider } from '../components/common/contexts/OverlayContext'
import { ProviderContextProvider } from '../components/common/contexts/providerContext'
import { DocumentProvider } from '../components/common/contexts/DocumentContext'
import { NETWORK_NAME } from '../configs/chain-config'
import {
  getChainInfoFromNetworkName,
  getSupportedChainInfo,
} from '../utils/chain-utils'

const defaultChainId = getChainInfoFromNetworkName(NETWORK_NAME).id

interface AllTheProvidersProps {
  children: React.ReactNode
  routerProps?: MemoryRouterProps
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({
  children,
  routerProps,
}) => {
  return (
    <DocumentProvider>
      <MemoryRouter {...routerProps}>
        <ProviderContextProvider
          defaultChainId={defaultChainId}
          networks={getSupportedChainInfo()}
        >
          <OverlayProvider>{children}</OverlayProvider>
        </ProviderContextProvider>
      </MemoryRouter>
    </DocumentProvider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routerProps?: MemoryRouterProps
}

const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  const { routerProps, ...renderOptions } = options || {}
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders routerProps={routerProps}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  })
}

export * from '@testing-library/react'
export { customRender as render }
