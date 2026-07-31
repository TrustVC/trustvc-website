import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RevokeDocument from './index'

const mockContext = {
  providerType: 'metamask',
  account: '0x1111111111111111111111111111111111111111',
  providerOrSigner: { provider: {} },
  currentChainId: 11155111,
}

vi.mock('@/components/common/contexts/providerContext', () => ({
  SIGNER_TYPE: { METAMASK: 'metamask', NONE: 'none', MAGIC: 'magic' },
  useProviderContext: () => mockContext,
}))

vi.mock('@/components/ConnectToMetamask', () => ({
  ConnectToMetamaskModelComponent: () => <div data-testid="connect-metamask" />,
}))

vi.mock('@trustvc/trustvc', async importOriginal => {
  const actual = await importOriginal<typeof import('@trustvc/trustvc')>()
  return {
    ...actual,
    documentStoreRevoke: vi.fn(),
  }
})

import { documentStoreRevoke } from '@trustvc/trustvc'

const VALID_STORE = '0xAEf9432C521D13F2E6980d072Ca7CA4930201456'.slice(0, 42)
const VALID_HASH = `0x${'a'.repeat(64)}`

const fillForm = () => {
  fireEvent.change(screen.getByLabelText(/store address/i), {
    target: { value: VALID_STORE },
  })
  fireEvent.change(screen.getByLabelText(/certificate hash/i), {
    target: { value: VALID_HASH },
  })
}

describe('RevokeDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContext.providerType = 'metamask'
    mockContext.account = '0x1111111111111111111111111111111111111111'
    mockContext.currentChainId = 11155111
  })

  it('shows the connected account and network once connected', () => {
    render(<RevokeDocument />)
    expect(screen.getByText(/0x1111…1111/i)).toBeInTheDocument()
    expect(screen.getByText('Sepolia')).toBeInTheDocument()
  })

  it('shows the network in the confirm modal', () => {
    render(<RevokeDocument />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /revoke document/i }))
    expect(screen.getByText('Network')).toBeInTheDocument()
    expect(screen.getAllByText('Sepolia').length).toBeGreaterThanOrEqual(2)
  })

  it('shows connect state when wallet is not connected', () => {
    mockContext.providerType = 'none'
    mockContext.account = undefined as never
    render(<RevokeDocument />)
    expect(screen.getByTestId('connect-metamask')).toBeInTheDocument()
    expect(screen.queryByLabelText(/store address/i)).not.toBeInTheDocument()
  })

  it('validates address and hash formats', async () => {
    render(<RevokeDocument />)
    fireEvent.change(screen.getByLabelText(/store address/i), {
      target: { value: 'not-an-address' },
    })
    fireEvent.change(screen.getByLabelText(/certificate hash/i), {
      target: { value: '0x123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /revoke document/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/valid/i)
    expect(documentStoreRevoke).not.toHaveBeenCalled()
  })

  it('requires confirmation before revoking, then shows tx hash on success', async () => {
    vi.mocked(documentStoreRevoke).mockResolvedValue({
      hash: '0xtxhash',
      wait: vi.fn().mockResolvedValue({}),
    } as never)
    render(<RevokeDocument />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /revoke document/i }))
    // Modal appears; nothing sent yet
    expect(documentStoreRevoke).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    await waitFor(() =>
      expect(documentStoreRevoke).toHaveBeenCalledWith(
        VALID_STORE,
        VALID_HASH,
        mockContext.providerOrSigner
      )
    )
    expect(await screen.findByText(/0xtxhash/)).toBeInTheDocument()
  })

  it('cancelling the modal sends nothing', () => {
    render(<RevokeDocument />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /revoke document/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(documentStoreRevoke).not.toHaveBeenCalled()
  })

  it('shows error state when the transaction fails', async () => {
    vi.mocked(documentStoreRevoke).mockRejectedValue(
      new Error('user rejected transaction')
    )
    render(<RevokeDocument />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /revoke document/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'user rejected transaction'
    )
  })

  it('keeps the tx hash visible when confirmation fails after broadcast', async () => {
    vi.mocked(documentStoreRevoke).mockResolvedValue({
      hash: '0xtxhash',
      wait: vi.fn().mockRejectedValue(new Error('execution reverted')),
    } as never)
    render(<RevokeDocument />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /revoke document/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('execution reverted')
    expect(alert).toHaveTextContent('0xtxhash')
  })
})
