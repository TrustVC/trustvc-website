import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from './index'
import { ADDRESS_RESOLVERS_KEY } from '@/utils/addressResolvers'

const ADDRESS = '0x' + 'a'.repeat(40)

const mockFetchOk = (body: unknown) =>
  vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(body),
  })

const openResolverForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(
    screen.getByRole('button', { name: /address book resolver/i })
  )
  await user.click(screen.getByRole('button', { name: /^add$/i }))
}

const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  values: Partial<
    Record<'Name' | 'Endpoint' | 'API Header' | 'API Key', string>
  >
) => {
  for (const [placeholder, value] of Object.entries(values)) {
    const input = screen.getByPlaceholderText(placeholder)
    await user.clear(input)
    if (value) await user.type(input, value)
  }
}

const storedResolvers = () =>
  JSON.parse(localStorage.getItem(ADDRESS_RESOLVERS_KEY) || '[]')

describe('Settings page — address book resolvers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the settings heading', () => {
    render(<Settings isDarkMode={false} />)
    expect(
      screen.getByRole('heading', { name: 'Settings' })
    ).toBeInTheDocument()
  })

  it('rejects a non-https endpoint without fetching', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<Settings isDarkMode={false} />)

    await openResolverForm(user)
    await fillForm(user, {
      Name: 'Acme',
      Endpoint: 'http://example.com/addresses',
    })
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(
      screen.getByText('Please enter a valid https:// URL')
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid API header name', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<Settings isDarkMode={false} />)

    await openResolverForm(user)
    await fillForm(user, {
      Name: 'Acme',
      Endpoint: 'https://example.com/addresses',
      'API Header': 'bad header',
      'API Key': 'secret',
    })
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(
      screen.getByText('Enter a valid header name (e.g. x-api-key)')
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches without credentials or referrer and saves the resolver', async () => {
    const fetchMock = mockFetchOk([{ name: 'Alice', address: ADDRESS }])
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<Settings isDarkMode={false} />)

    await openResolverForm(user)
    await fillForm(user, {
      Name: 'Acme',
      Endpoint: 'https://example.com/addresses',
      'API Header': ' x-api-key ',
      'API Key': 'secret',
    })
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(storedResolvers()).toHaveLength(1))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://example.com/addresses')
    expect(init.credentials).toBe('omit')
    expect(init.referrerPolicy).toBe('no-referrer')
    expect((init.headers as Headers).get('x-api-key')).toBe('secret')

    expect(storedResolvers()).toEqual([
      {
        name: 'Acme',
        endpoint: 'https://example.com/addresses',
        apiHeader: ' x-api-key ',
      },
    ])
    expect(localStorage.getItem(ADDRESS_RESOLVERS_KEY)).not.toContain('secret')

    // The import summary is shown on the Address Book tab
    await user.click(screen.getByRole('button', { name: /^address book$/i }))
    expect(
      screen.getByText('Imported 1 address from "Acme".')
    ).toBeInTheDocument()
  })

  it('shows the HTTP status when the resolver responds with an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })
    )
    const user = userEvent.setup()
    render(<Settings isDarkMode={false} />)

    await openResolverForm(user)
    await fillForm(user, {
      Name: 'Acme',
      Endpoint: 'https://example.com/addresses',
    })
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(
      await screen.findByText('Failed to fetch: 401 Unauthorized')
    ).toBeInTheDocument()
    expect(storedResolvers()).toEqual([])
  })

  it('drops malformed resolvers from storage on load', async () => {
    localStorage.setItem(
      ADDRESS_RESOLVERS_KEY,
      JSON.stringify([
        {
          name: 'Good',
          endpoint: 'https://good.example.com',
          apiHeader: '',
          apiKey: '',
        },
        {
          name: 'Evil',
          endpoint: 'javascript:alert(1)',
          apiHeader: '',
          apiKey: '',
        },
      ])
    )
    const user = userEvent.setup()
    render(<Settings isDarkMode={false} />)

    await user.click(
      screen.getByRole('button', { name: /address book resolver/i })
    )

    expect(screen.getByText('Good')).toBeInTheDocument()
    expect(screen.queryByText('Evil')).not.toBeInTheDocument()
  })

  it('edits an existing resolver in place', async () => {
    localStorage.setItem(
      ADDRESS_RESOLVERS_KEY,
      JSON.stringify([
        {
          name: 'Acme',
          endpoint: 'https://example.com/addresses',
          apiHeader: '',
          apiKey: '',
        },
      ])
    )
    vi.stubGlobal('fetch', mockFetchOk({ entries: [] }))
    const user = userEvent.setup()
    render(<Settings isDarkMode={false} />)

    await user.click(
      screen.getByRole('button', { name: /address book resolver/i })
    )
    const row = screen.getByText('Acme').closest('.px-4') as HTMLElement
    const [editButton] = within(row).getAllByRole('button')
    await user.click(editButton)

    await fillForm(user, { Endpoint: 'https://example.com/v2' })
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(storedResolvers()).toEqual([
        {
          name: 'Acme',
          endpoint: 'https://example.com/v2',
          apiHeader: '',
        },
      ])
    )
  })
})
