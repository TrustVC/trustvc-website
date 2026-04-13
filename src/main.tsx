import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { OverlayProvider } from './components/common/contexts/OverlayContext'
import { ProviderContextProvider } from './components/common/contexts/providerContext'
// import { TokenInformationContextProvider } from './components/common/contexts/TokenInformationContext'
import { NETWORK_NAME } from './configs/chain-config'
import {
  getChainInfoFromNetworkName,
  getSupportedChainInfo,
} from './utils/chain-utils'
import { DocumentProvider } from './components/common/contexts/DocumentContext'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element with id "root" not found')
}

const defaultChainId = getChainInfoFromNetworkName(NETWORK_NAME).id

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <DocumentProvider>
      <BrowserRouter>
        <ProviderContextProvider
          defaultChainId={defaultChainId}
          networks={getSupportedChainInfo()}
        >
          {/* <TokenInformationContextProvider> */}
          <OverlayProvider>
            <App />
          </OverlayProvider>
          {/* </TokenInformationContextProvider> */}
        </ProviderContextProvider>
      </BrowserRouter>
    </DocumentProvider>
  </React.StrictMode>
)
