import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SubmitButton from './SubmitButton'

describe('SubmitButton', () => {
  it('renders "Submit" text when not submitting', () => {
    render(<SubmitButton isDarkMode={false} isSubmitting={false} />)
    expect(screen.getByRole('button')).toHaveTextContent('Submit')
  })

  it('renders "Submitting…" text when submitting', () => {
    render(<SubmitButton isDarkMode={false} isSubmitting={true} />)
    expect(screen.getByRole('button')).toHaveTextContent('Submitting…')
  })

  it('is disabled when submitting', () => {
    render(<SubmitButton isDarkMode={false} isSubmitting={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is enabled when not submitting', () => {
    render(<SubmitButton isDarkMode={false} isSubmitting={false} />)
    expect(screen.getByRole('button')).toBeEnabled()
  })

  it('has type="submit"', () => {
    render(<SubmitButton isDarkMode={false} isSubmitting={false} />)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('applies submitting styles when isSubmitting is true', () => {
    render(<SubmitButton isDarkMode={false} isSubmitting={true} />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('opacity-60')
    expect(btn).toHaveClass('cursor-not-allowed')
  })

  it('applies light-mode background', () => {
    render(<SubmitButton isDarkMode={false} isSubmitting={false} />)
    expect(screen.getByRole('button')).toHaveClass('bg-primary-50')
  })

  it('applies dark-mode background', () => {
    render(<SubmitButton isDarkMode={true} isSubmitting={false} />)
    expect(screen.getByRole('button')).toHaveClass('bg-primary-60')
  })
})
