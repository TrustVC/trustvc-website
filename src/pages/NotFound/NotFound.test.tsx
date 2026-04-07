import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import NotFound from './index'

describe('NotFound page', () => {
  it('renders 404 message and CTA', () => {
    render(<NotFound isDarkMode={false} />)

    expect(screen.getByText(/Page not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to Home/i })).toHaveAttribute(
      'href',
      '/'
    )
  })
})
