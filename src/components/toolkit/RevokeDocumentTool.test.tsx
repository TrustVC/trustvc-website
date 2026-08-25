import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../__tests__/test-utils'
import userEvent from '@testing-library/user-event'
import RevokeDocumentTool from './RevokeDocumentTool'
import oaDnsTxtDocstoreV2 from '../../__tests__/__fixtures__/oa/2.0/signed_wrapped_oa_dns_txt_docstore_v2.json'

vi.mock('@/components/common/contexts/providerContext', async () => {
  const actual = await vi.importActual<
    typeof import('@/components/common/contexts/providerContext')
  >('@/components/common/contexts/providerContext')
  return {
    ...actual,
    useProviderContext: () => ({
      account: undefined,
      providerType: actual.SIGNER_TYPE.NONE,
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
  it('disables revoke until a wallet is connected', () => {
    render(<RevokeDocumentTool isDarkMode={false} />)
    expect(
      screen.getByRole('button', { name: /connect wallet to revoke/i })
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /connect wallet$/i })
    ).toBeInTheDocument()
  })

  it('extracts store address and hash from pasted JSON', async () => {
    const user = userEvent.setup()
    render(<RevokeDocumentTool isDarkMode={false} />)
    await user.click(screen.getByLabelText('Document JSON'))
    await user.paste(JSON.stringify(oaDnsTxtDocstoreV2))
    await user.click(
      screen.getByRole('button', { name: /extract store and hash/i })
    )
    expect(
      await screen.findByText(
        'Store address and hash extracted from the document.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByDisplayValue('0xA594f6e10564e87888425c7CC3910FE1c800aB0B')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /connect wallet to revoke/i })
    ).toBeDisabled()
  })
})
