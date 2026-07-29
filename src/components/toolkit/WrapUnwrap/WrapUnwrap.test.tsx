import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WrapUnwrap from './index'

vi.mock('@trustvc/trustvc', () => ({
  wrapOADocument: vi.fn(),
  getDataV2: vi.fn(),
  isWrappedV2Document: vi.fn(),
  isWrappedV3Document: vi.fn(),
  isRawV2Document: vi.fn(),
  isRawV3Document: vi.fn(),
  diagnose: vi.fn(() => []),
}))

import {
  wrapOADocument,
  getDataV2,
  isWrappedV2Document,
  isRawV2Document,
  isRawV3Document,
  diagnose,
} from '@trustvc/trustvc'

describe('WrapUnwrap', () => {
  beforeEach(() => vi.clearAllMocks())

  it('wraps a raw v2 document', async () => {
    vi.mocked(isRawV2Document).mockReturnValue(true)
    vi.mocked(wrapOADocument).mockResolvedValue({ wrapped: true } as never)
    render(<WrapUnwrap />)
    fireEvent.change(screen.getByLabelText('Raw JSON'), {
      target: { value: '{"name":"Alice"}' },
    })
    fireEvent.click(screen.getByRole('button', { name: /run/i }))
    await waitFor(() =>
      expect(screen.getByLabelText('Wrapped Document')).toHaveValue(
        JSON.stringify({ wrapped: true }, null, 2)
      )
    )
  })

  it('shows an error for invalid JSON input', async () => {
    render(<WrapUnwrap />)
    fireEvent.change(screen.getByLabelText('Raw JSON'), {
      target: { value: 'not json' },
    })
    fireEvent.click(screen.getByRole('button', { name: /run/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/valid json/i)
    expect(wrapOADocument).not.toHaveBeenCalled()
  })

  it('unwraps a wrapped v2 document in Unwrap mode', async () => {
    vi.mocked(isWrappedV2Document).mockReturnValue(true)
    vi.mocked(getDataV2).mockReturnValue({ name: 'Alice' } as never)
    render(<WrapUnwrap />)
    fireEvent.click(screen.getByRole('button', { name: /^unwrap$/i }))
    fireEvent.change(screen.getByLabelText('Wrapped Document'), {
      target: { value: '{"data":{}}' },
    })
    fireEvent.click(screen.getByRole('button', { name: /run/i }))
    await waitFor(() =>
      expect(screen.getByLabelText('Raw JSON')).toHaveValue(
        JSON.stringify({ name: 'Alice' }, null, 2)
      )
    )
  })

  it('shows wrap failure from the SDK as an error alert', async () => {
    vi.mocked(isRawV2Document).mockReturnValue(true)
    vi.mocked(wrapOADocument).mockRejectedValue(new Error('bad schema'))
    render(<WrapUnwrap />)
    fireEvent.change(screen.getByLabelText('Raw JSON'), {
      target: { value: '{"name":"Alice"}' },
    })
    fireEvent.click(screen.getByRole('button', { name: /run/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('bad schema')
  })

  it('surfaces diagnose output when wrap validation fails', async () => {
    vi.mocked(isRawV2Document).mockReturnValue(false)
    vi.mocked(isRawV3Document).mockReturnValue(false)
    vi.mocked(diagnose).mockReturnValue([
      { message: 'missing issuers' },
    ] as never)
    render(<WrapUnwrap />)
    fireEvent.change(screen.getByLabelText('Raw JSON'), {
      target: { value: '{"name":"Alice"}' },
    })
    fireEvent.click(screen.getByRole('button', { name: /run/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'missing issuers'
    )
    expect(wrapOADocument).not.toHaveBeenCalled()
  })
})
