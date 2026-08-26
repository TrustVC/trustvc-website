import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../__tests__/test-utils'
import userEvent from '@testing-library/user-event'
import EncryptDecryptTool from './EncryptDecryptTool'
import {
  decryptDocument,
  ENCRYPTED_PAYLOAD_OBJECT_MESSAGE,
  loadEncryptedFromActionUrl,
} from '@/utils/toolkit/encrypt'

const encryptFns = vi.hoisted(() => ({
  decryptDocument: undefined as
    | ((raw: string, fallbackKey?: string) => string)
    | undefined,
  loadEncryptedFromActionUrl: vi.fn(),
}))

vi.mock('@/utils/toolkit/encrypt', async () => {
  const actual = await vi.importActual<
    typeof import('@/utils/toolkit/encrypt')
  >('@/utils/toolkit/encrypt')
  encryptFns.decryptDocument = actual.decryptDocument
  return {
    ...actual,
    generateEncryptionKey: () => 'test-key',
    encryptDocument: vi.fn(() => ({
      cipherText: 'aaa',
      iv: 'bbb',
      tag: 'ccc',
      type: 'OPEN-ATTESTATION-TYPE-1',
    })),
    decryptDocument: vi.fn(() => JSON.stringify({ hello: 'world' }, null, 2)),
    loadEncryptedFromActionUrl: encryptFns.loadEncryptedFromActionUrl,
  }
})

describe('EncryptDecryptTool', () => {
  it('encrypts pasted JSON into a ciphertext payload', async () => {
    const user = userEvent.setup()
    render(<EncryptDecryptTool isDarkMode={false} sampleTick={1} />)
    await user.click(screen.getByLabelText('Encrypt document'))
    expect(
      await screen.findByText('Document encrypted successfully.')
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue(/cipherText/)).toBeInTheDocument()
  })

  it('decrypts with the key field when the payload omits key', async () => {
    const user = userEvent.setup()
    render(<EncryptDecryptTool isDarkMode={false} />)
    await user.click(screen.getByRole('tab', { name: /^decrypt$/i }))
    await user.type(screen.getByLabelText('Key'), 'test-key')
    await user.click(screen.getByLabelText('Encrypted Payload'))
    await user.paste(
      '{"cipherText":"aaa","iv":"bbb","tag":"ccc","type":"OPEN-ATTESTATION-TYPE-1"}'
    )
    await user.click(screen.getByLabelText('Decrypt document'))
    expect(decryptDocument).toHaveBeenCalledWith(
      expect.stringContaining('cipherText'),
      'test-key'
    )
    expect(
      await screen.findByText('Document decrypted successfully.')
    ).toBeInTheDocument()
  })

  it('does not carry encrypt input into decrypt', async () => {
    const user = userEvent.setup()
    render(<EncryptDecryptTool isDarkMode={false} />)
    await user.click(screen.getByLabelText('Document JSON'))
    await user.paste('{"hello":"encrypt-only"}')
    await user.click(screen.getByRole('tab', { name: /^decrypt$/i }))
    expect(screen.queryByDisplayValue(/encrypt-only/)).not.toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/paste encrypted payload json here/i)
    ).toBeInTheDocument()
  })

  it('hides the document URL field on encrypt and shows it on decrypt', async () => {
    const user = userEvent.setup()
    render(<EncryptDecryptTool isDarkMode={false} />)
    expect(
      screen.getByRole('button', { name: /^generate$/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText(/paste an action url/i)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^load$/i })
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /^decrypt$/i }))
    expect(screen.getByLabelText('Key')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^generate$/i })
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('Document URL')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/paste an action url/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^load$/i })).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/paste encrypted payload json here/i)
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(
        /output will appear here after you press run/i
      )
    ).toBeInTheDocument()
  })

  it('shows a fixed status when the decrypt payload is not a JSON object', async () => {
    vi.mocked(decryptDocument).mockImplementationOnce((...args) =>
      encryptFns.decryptDocument!(...args)
    )
    const user = userEvent.setup()
    render(<EncryptDecryptTool isDarkMode={false} />)
    await user.click(screen.getByRole('tab', { name: /^decrypt$/i }))
    await user.click(screen.getByLabelText('Encrypted Payload'))
    await user.paste('null')
    await user.click(screen.getByLabelText('Decrypt document'))
    expect(await screen.findByRole('status')).toHaveTextContent(
      ENCRYPTED_PAYLOAD_OBJECT_MESSAGE
    )
  })

  it('loads an encrypted document from an action URL', async () => {
    encryptFns.loadEncryptedFromActionUrl.mockResolvedValueOnce({
      key: 'loaded-key',
      payload: {
        cipherText: 'aaa',
        iv: 'bbb',
        tag: 'ccc',
        type: 'OPEN-ATTESTATION-TYPE-1',
        key: 'loaded-key',
      },
    })
    const user = userEvent.setup()
    render(<EncryptDecryptTool isDarkMode={false} />)
    await user.click(screen.getByRole('tab', { name: /^decrypt$/i }))
    await user.type(
      screen.getByLabelText('Document URL'),
      'https://trustvc.io/?q=%7B%22payload%22%3A%7B%22uri%22%3A%22https%3A%2F%2Fexample.com%2Fdoc.json%22%7D%7D#%7B%22key%22%3A%22loaded-key%22%7D'
    )
    await user.click(screen.getByRole('button', { name: /^load$/i }))
    expect(loadEncryptedFromActionUrl).toHaveBeenCalled()
    expect(
      await screen.findByText('Encrypted document loaded from URL.')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Key')).toHaveValue('loaded-key')
    expect(screen.getByLabelText('Encrypted Payload')).toHaveDisplayValue(
      /cipherText/
    )
    expect(screen.getByRole('tab', { name: /^decrypt$/i })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it('shows an error when the action URL cannot be loaded', async () => {
    encryptFns.loadEncryptedFromActionUrl.mockRejectedValueOnce(
      new Error(
        'Please ensure the following params exist in the URL: payload.uri, key'
      )
    )
    const user = userEvent.setup()
    render(<EncryptDecryptTool isDarkMode={false} />)
    await user.click(screen.getByRole('tab', { name: /^decrypt$/i }))
    await user.type(
      screen.getByLabelText('Document URL'),
      'https://example.com'
    )
    await user.click(screen.getByRole('button', { name: /^load$/i }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Please ensure the following params exist in the URL: payload.uri, key'
    )
  })
})
