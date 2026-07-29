import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EncryptDecrypt from './index'

vi.mock('@trustvc/trustvc', () => ({
  encryptString: vi.fn(),
  decryptString: vi.fn(),
}))

import { encryptString, decryptString } from '@trustvc/trustvc'

const ENC = {
  cipherText: 'abc=',
  iv: 'iv=',
  tag: 'tag=',
  key: 'deadbeef',
  type: 'OPEN-ATTESTATION-TYPE-1',
}

describe('EncryptDecrypt', () => {
  beforeEach(() => vi.clearAllMocks())

  it('encrypts a document and shows payload + key warning', async () => {
    vi.mocked(encryptString).mockReturnValue(ENC as never)
    render(<EncryptDecrypt />)
    fireEvent.change(screen.getByLabelText('Document'), {
      target: { value: '{"name":"Alice"}' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^encrypt$/i }))
    await waitFor(() => {
      expect(screen.getByLabelText('Encrypted Payload')).toHaveValue(
        JSON.stringify(
          {
            cipherText: ENC.cipherText,
            iv: ENC.iv,
            tag: ENC.tag,
            type: ENC.type,
          },
          null,
          2
        )
      )
    })
    expect(screen.getByDisplayValue('deadbeef')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/key/i)
  })

  it('rejects invalid JSON before encrypting', async () => {
    render(<EncryptDecrypt />)
    fireEvent.change(screen.getByLabelText('Document'), {
      target: { value: 'nope' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^encrypt$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/valid json/i)
    expect(encryptString).not.toHaveBeenCalled()
  })

  it('decrypts a payload with a key', async () => {
    vi.mocked(decryptString).mockReturnValue('{"name":"Alice"}')
    render(<EncryptDecrypt />)
    fireEvent.click(screen.getByRole('button', { name: /decrypt mode/i }))
    fireEvent.change(screen.getByLabelText('Encrypted Payload'), {
      target: {
        value: JSON.stringify({
          cipherText: 'abc=',
          iv: 'iv=',
          tag: 'tag=',
          type: 'OPEN-ATTESTATION-TYPE-1',
        }),
      },
    })
    fireEvent.change(screen.getByLabelText('Decryption Key'), {
      target: { value: 'deadbeef' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^decrypt$/i }))
    await waitFor(() =>
      expect(screen.getByLabelText('Document')).toHaveValue(
        JSON.stringify({ name: 'Alice' }, null, 2)
      )
    )
  })

  it('surfaces decryption failures', async () => {
    vi.mocked(decryptString).mockImplementation(() => {
      throw new Error('unable to decrypt')
    })
    render(<EncryptDecrypt />)
    fireEvent.click(screen.getByRole('button', { name: /decrypt mode/i }))
    fireEvent.change(screen.getByLabelText('Encrypted Payload'), {
      target: {
        value: JSON.stringify({
          cipherText: 'x',
          iv: 'y',
          tag: 'z',
          type: 't',
        }),
      },
    })
    fireEvent.change(screen.getByLabelText('Decryption Key'), {
      target: { value: 'wrongkey' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^decrypt$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'unable to decrypt'
    )
  })
})
