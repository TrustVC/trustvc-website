import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import NotFound from './index'

describe('NotFound page', () => {
  it('renders 404 message and CTA', () => {
    render(
      <MemoryRouter>
        <NotFound isDarkMode={false} />
      </MemoryRouter>
    )

    expect(screen.getByText(/Page not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to Home/i })).toHaveAttribute(
      'href',
      '/'
    )
  })
})
