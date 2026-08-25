import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../__tests__/test-utils'
import userEvent from '@testing-library/user-event'
import EncryptDecryptTool from './EncryptDecryptTool'
import {
  decryptDocument,
  loadEncryptedFromActionUrl,
} from '@/utils/toolkit/encrypt'

vi.mock('@/utils/toolkit/encrypt', () => ({
  generateEncryptionKey: () => 'test-key',
  encryptDocument: vi.fn(() => ({
    cipherText: 'aaa',
    iv: 'bbb',
    tag: 'ccc',
    type: 'OPEN-ATTESTATION-TYPE-1',
  })),
  decryptDocument: vi.fn(() => JSON.stringify({ hello: 'world' }, null, 2)),
  loadEncryptedFromActionUrl: vi.fn(),
}))

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

  it('loads an encrypted document from an action URL', async () => {
    vi.mocked(loadEncryptedFromActionUrl).mockResolvedValue({
      key: 'abc123',
      payload: {
        cipherText: 'aaa',
        iv: 'bbb',
        tag: 'ccc',
        type: 'OPEN-ATTESTATION-TYPE-1',
        key: 'abc123',
      },
    })
    const user = userEvent.setup()
    render(<EncryptDecryptTool isDarkMode={false} />)
    await user.click(screen.getByRole('tab', { name: /^decrypt$/i }))
    await user.type(
      screen.getByPlaceholderText(/paste an action url/i),
      'https://trustvc.io/?q=%7B%7D#key'
    )
    await user.click(screen.getByRole('button', { name: /^load$/i }))
    expect(
      await screen.findByText('Encrypted document loaded from action URL.')
    ).toBeInTheDocument()
    expect(loadEncryptedFromActionUrl).toHaveBeenCalled()
  })
})
