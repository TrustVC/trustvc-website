import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '../../__tests__/test-utils'
import userEvent from '@testing-library/user-event'
import RevokeDocumentTool from './RevokeDocumentTool'

const walletState = vi.hoisted(() => {
  const listeners = new Set<() => void>()
  let epoch = 0
  return {
    connected: false,
    networkChangeLoading: false,
    currentChainId: '1',
    changeNetwork: vi.fn(),
    setNetworkChangeLoading: vi.fn(),
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getEpoch: () => epoch,
    notify: () => {
      epoch += 1
      listeners.forEach(listener => listener())
    },
  }
})

vi.mock('@/components/common/contexts/providerContext', async () => {
  const { useSyncExternalStore } = await import('react')
  const actual = await vi.importActual<
    typeof import('@/components/common/contexts/providerContext')
  >('@/components/common/contexts/providerContext')
  return {
    ...actual,
    useProviderContext: () => {
      useSyncExternalStore(walletState.subscribe, walletState.getEpoch)
      return {
        account: walletState.connected ? '0x1234567890abcdef' : undefined,
        providerType: walletState.connected
          ? actual.SIGNER_TYPE.METAMASK
          : actual.SIGNER_TYPE.NONE,
        providerOrSigner: walletState.connected
          ? { _isSigner: true }
          : undefined,
        upgradeToMetaMaskSigner: vi.fn(),
        changeNetwork: walletState.changeNetwork,
        currentChainId: walletState.currentChainId,
        supportedChainInfoObjects: [
          { id: '1', label: 'Ethereum', name: 'homestead' },
          { id: '137', label: 'Polygon', name: 'matic' },
        ],
        networkChangeLoading: walletState.networkChangeLoading,
        setNetworkChangeLoading: (loading: boolean) => {
          walletState.networkChangeLoading = loading
          walletState.setNetworkChangeLoading(loading)
          walletState.notify()
        },
      }
    },
  }
})

const fillRevokeFields = async (user: ReturnType<typeof userEvent.setup>) => {
  const storeAddress = '0xA594f6e10564e87888425c7CC3910FE1c800aB0B'
  const documentHash =
    '0x9a1c8f2e7b3d4a5e6c1f0b2d9e8a7c6b5d4e3f2a9a1c8f2e7b3d4a5e6c1f0b2d'
  await user.type(screen.getByLabelText('Store Address'), storeAddress)
  await user.type(
    screen.getByLabelText('Certificate Hash To Revoke'),
    documentHash
  )
}

describe('RevokeDocumentTool', () => {
  beforeEach(() => {
    walletState.connected = false
    walletState.networkChangeLoading = false
    walletState.currentChainId = '1'
    walletState.changeNetwork.mockReset()
    walletState.setNetworkChangeLoading.mockReset()
  })

  it('shows the connect-wallet state until a wallet is connected', () => {
    render(<RevokeDocumentTool isDarkMode={false} />)
    expect(
      screen.getByText(/revoking writes a transaction/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /connect wallet$/i })
    ).toBeEnabled()
    expect(screen.queryByLabelText('Document JSON')).not.toBeInTheDocument()
  })

  it('accepts the store address and document hash directly', async () => {
    walletState.connected = true
    const user = userEvent.setup()
    render(<RevokeDocumentTool isDarkMode={false} />)

    await fillRevokeFields(user)

    expect(
      screen.getByDisplayValue('0xA594f6e10564e87888425c7CC3910FE1c800aB0B')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^revoke document$/i })
    ).toBeEnabled()
  })

  it('keeps revoke confirmation disabled while the network switch is in progress', async () => {
    walletState.connected = true
    walletState.networkChangeLoading = true
    const user = userEvent.setup()
    render(<RevokeDocumentTool isDarkMode={false} />)

    await fillRevokeFields(user)

    expect(
      screen.getByRole('button', { name: /^revoke document$/i })
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: /network/i })).toBeDisabled()
  })

  it('opens a custom network listbox from a button trigger', async () => {
    walletState.connected = true
    const user = userEvent.setup()
    render(<RevokeDocumentTool isDarkMode={false} />)

    const trigger = screen.getByRole('button', { name: /network/i })
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('option', { name: /ethereum network/i })
    ).toBeInTheDocument()
  })

  it('keeps the network listbox open until the provider switch settles', async () => {
    walletState.connected = true
    let resolveSwitch: () => void = () => {}
    const switchPending = new Promise<void>(resolve => {
      resolveSwitch = resolve
    })
    walletState.changeNetwork.mockReturnValue(switchPending)

    const user = userEvent.setup()
    render(<RevokeDocumentTool isDarkMode={false} />)

    const trigger = screen.getByRole('button', { name: /network/i })
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: /polygon network/i }))

    expect(walletState.setNetworkChangeLoading).toHaveBeenCalledWith(true)
    expect(walletState.changeNetwork).toHaveBeenCalledWith('137')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('option', { name: /polygon network/i })
    ).toBeInTheDocument()

    resolveSwitch()

    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('re-enables revoke and network selection after a successful chain switch', async () => {
    walletState.connected = true
    let resolveSwitch: () => void = () => {}
    const switchPending = new Promise<void>(resolve => {
      resolveSwitch = resolve
    })
    walletState.changeNetwork.mockImplementation(async (chainId: string) => {
      await switchPending
      walletState.currentChainId = String(chainId)
    })

    const user = userEvent.setup()
    render(<RevokeDocumentTool isDarkMode={false} />)
    await fillRevokeFields(user)

    const trigger = screen.getByRole('button', { name: /network/i })
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: /polygon network/i }))

    expect(walletState.setNetworkChangeLoading).toHaveBeenCalledWith(true)
    expect(walletState.changeNetwork).toHaveBeenCalledWith('137')
    expect(screen.getByRole('button', { name: /network/i })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /^revoke document$/i })
    ).toBeDisabled()

    resolveSwitch()

    await waitFor(() => {
      expect(walletState.setNetworkChangeLoading).toHaveBeenCalledWith(false)
    })
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^revoke document$/i })
      ).toBeEnabled()
    })
    expect(screen.getByRole('button', { name: /network/i })).toBeEnabled()
  })
})
