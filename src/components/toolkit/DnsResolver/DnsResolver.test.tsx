import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DnsResolver from './index'

vi.mock('@trustvc/trustvc', () => ({
  getDocumentStoreRecords: vi.fn(),
  getDnsDidRecords: vi.fn(),
}))

import { getDocumentStoreRecords, getDnsDidRecords } from '@trustvc/trustvc'

describe('DnsResolver', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists DNS-TXT and DNS-DID records for a domain', async () => {
    vi.mocked(getDocumentStoreRecords).mockResolvedValue([
      { type: 'openatts', net: 'ethereum', netId: '11155111', addr: '0xabc' },
    ] as never)
    vi.mocked(getDnsDidRecords).mockResolvedValue([
      {
        type: 'openatts',
        algorithm: 'dns-did',
        publicKey: 'did:ethr:0xdef#controller',
        version: '1.0',
      },
    ] as never)
    render(<DnsResolver />)
    fireEvent.change(screen.getByLabelText(/domain/i), {
      target: { value: 'example.openattestation.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /resolve/i }))
    expect(await screen.findByText('0xabc')).toBeInTheDocument()
    expect(screen.getByText(/did:ethr:0xdef/)).toBeInTheDocument()
  })

  it('shows the empty state when no records exist', async () => {
    vi.mocked(getDocumentStoreRecords).mockResolvedValue([] as never)
    vi.mocked(getDnsDidRecords).mockResolvedValue([] as never)
    render(<DnsResolver />)
    fireEvent.change(screen.getByLabelText(/domain/i), {
      target: { value: 'no-records.example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /resolve/i }))
    expect(await screen.findByText(/no records found/i)).toBeInTheDocument()
  })

  it('surfaces resolver errors', async () => {
    vi.mocked(getDocumentStoreRecords).mockRejectedValue(
      new Error('network down')
    )
    vi.mocked(getDnsDidRecords).mockResolvedValue([] as never)
    render(<DnsResolver />)
    fireEvent.change(screen.getByLabelText(/domain/i), {
      target: { value: 'example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /resolve/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('network down')
  })
})
