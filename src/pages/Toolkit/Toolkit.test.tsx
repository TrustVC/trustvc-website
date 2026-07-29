import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Toolkit from './index'

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Toolkit />
    </MemoryRouter>
  )

describe('Toolkit page shell', () => {
  it('renders hero and defaults to the Wrap tab', () => {
    renderAt('/toolkit')
    expect(
      screen.getByText((content, element) =>
        Boolean(
          content.includes('The TrustVC') &&
          element?.textContent?.includes('Toolkit')
        )
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: /wrap \/ unwrap/i })
    ).toHaveAttribute('aria-selected', 'true')
  })

  it('selects tab from ?tab= param', () => {
    renderAt('/toolkit?tab=dns-resolver')
    expect(screen.getByRole('tab', { name: /dns resolver/i })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it('falls back to Wrap for invalid tab values', () => {
    renderAt('/toolkit?tab=nonsense')
    expect(
      screen.getByRole('tab', { name: /wrap \/ unwrap/i })
    ).toHaveAttribute('aria-selected', 'true')
  })

  it('updates the URL when a tab is clicked', () => {
    renderAt('/toolkit')
    fireEvent.click(screen.getByRole('tab', { name: /encrypt \/ decrypt/i }))
    expect(
      screen.getByRole('tab', { name: /encrypt \/ decrypt/i })
    ).toHaveAttribute('aria-selected', 'true')
  })

  it('renders a floating Verify Document link', () => {
    renderAt('/toolkit')
    const verify = screen.getByRole('link', { name: /verify document/i })
    expect(verify).toBeInTheDocument()
  })
})
