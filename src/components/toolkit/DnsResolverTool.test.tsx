import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../__tests__/test-utils'
import userEvent from '@testing-library/user-event'
import DnsResolverTool from './DnsResolverTool'

vi.mock('@/utils/toolkit/dns', () => ({
  lookupDnsRecords: vi.fn(),
  totalDnsRecords: (result: { did: unknown[]; txt: unknown[] }) =>
    result.did.length + result.txt.length,
}))

import { lookupDnsRecords } from '@/utils/toolkit/dns'

describe('DnsResolverTool', () => {
  it('shows the empty state when no OA records are found', async () => {
    vi.mocked(lookupDnsRecords).mockResolvedValue({ did: [], txt: [] })
    const user = userEvent.setup()
    render(<DnsResolverTool isDarkMode={false} />)
    await user.type(screen.getByLabelText('Domain:'), 'example.com')
    await user.click(screen.getByRole('button', { name: /resolve txt/i }))
    expect(
      await screen.findByText(/no txt records found for example.com/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/0 records found/i)).toBeInTheDocument()
    expect(screen.getByText(/txt record for/i)).toBeInTheDocument()
  })

  it('shows a failed state when lookup throws', async () => {
    vi.mocked(lookupDnsRecords).mockRejectedValue(new Error('dns down'))
    const user = userEvent.setup()
    render(<DnsResolverTool isDarkMode={false} />)
    await user.type(screen.getByLabelText('Domain:'), 'example.com')
    await user.click(screen.getByRole('button', { name: /resolve txt/i }))
    expect(await screen.findByText('Get records failed')).toBeInTheDocument()
    expect(screen.queryByText('dns down')).not.toBeInTheDocument()
  })

  it('renders a table of DID and TXT records when found', async () => {
    vi.mocked(lookupDnsRecords).mockResolvedValue({
      did: [
        {
          type: 'openatts',
          algorithm: 'dns-did',
          publicKey: 'did:ethr:0xabc#controller',
          version: '1.0',
        },
      ],
      txt: [
        {
          net: 'ethereum',
          netId: '1',
          addr: '0x1234567890abcdef',
          type: 'openatts',
        },
      ],
    })
    const user = userEvent.setup()
    render(<DnsResolverTool isDarkMode={false} />)
    await user.type(
      screen.getByLabelText('Domain:'),
      'example.openattestation.com'
    )
    await user.click(screen.getByRole('button', { name: /resolve txt/i }))
    expect(await screen.findByText('2 records found')).toBeInTheDocument()
    expect(screen.getAllByText('DID').length).toBeGreaterThan(0)
    expect(screen.getAllByText('TXT').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('did:ethr:0xabc#controller').length
    ).toBeGreaterThan(0)
  })
})
