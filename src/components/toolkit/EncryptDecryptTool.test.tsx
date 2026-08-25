import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../__tests__/test-utils'
import userEvent from '@testing-library/user-event'
import EncryptDecryptTool from './EncryptDecryptTool'
import { decryptDocument, ENCRYPTED_PAYLOAD_OBJECT_MESSAGE } from '@/utils/toolkit/encrypt'

const encryptFns = vi.hoisted(() => ({
  decryptDocument: undefined as
    | ((raw: string, fallbackKey?: string) => string)
    | undefined,
}))

vi.mock('@/utils/toolkit/encrypt', async () => {
  const actual = await vi.importActual<typeof import('@/utils/toolkit/encrypt')>(
    '@/utils/toolkit/encrypt'
  )
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

  it('keeps the same chrome as encrypt and puts the payload on the left', async () => {
    const user = userEvent.setup()
    render(<EncryptDecryptTool isDarkMode={false} />)
    expect(
      screen.getByRole('button', { name: /^generate$/i })
    ).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /^decrypt$/i }))
    expect(screen.getByLabelText('Key')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^generate$/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText(/paste an action url/i)
    ).not.toBeInTheDocument()
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
})
