import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../__tests__/test-utils'
import userEvent from '@testing-library/user-event'
import RevokeDocumentTool from './RevokeDocumentTool'

const walletState = vi.hoisted(() => ({ connected: false }))

vi.mock('@/components/common/contexts/providerContext', async () => {
  const actual = await vi.importActual<
    typeof import('@/components/common/contexts/providerContext')
  >('@/components/common/contexts/providerContext')
  return {
    ...actual,
    useProviderContext: () => ({
      account: walletState.connected ? '0x1234567890abcdef' : undefined,
      providerType: walletState.connected
        ? actual.SIGNER_TYPE.METAMASK
        : actual.SIGNER_TYPE.NONE,
      providerOrSigner: undefined,
      upgradeToMetaMaskSigner: vi.fn(),
      changeNetwork: vi.fn(),
      currentChainId: '1',
      supportedChainInfoObjects: [
        { id: '1', label: 'Ethereum', name: 'homestead' },
      ],
    }),
  }
})

describe('RevokeDocumentTool', () => {
  beforeEach(() => {
    walletState.connected = false
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

    const storeAddress = '0xA594f6e10564e87888425c7CC3910FE1c800aB0B'
    const documentHash =
      '0x9a1c8f2e7b3d4a5e6c1f0b2d9e8a7c6b5d4e3f2a9a1c8f2e7b3d4a5e6c1f0b2d'

    await user.type(screen.getByLabelText('Store Address'), storeAddress)
    await user.type(
      screen.getByLabelText('Certificate Hash To Revoke'),
      documentHash
    )

    expect(screen.getByDisplayValue(storeAddress)).toBeInTheDocument()
    expect(screen.getByDisplayValue(documentHash)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^revoke document$/i })
    ).toBeEnabled()
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
})
