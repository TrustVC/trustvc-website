import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FormAlert from './FormAlert'

describe('FormAlert', () => {
  it('renders nothing when no error or success is provided', () => {
    const { container } = render(<FormAlert isDarkMode={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when error and success are null', () => {
    const { container } = render(
      <FormAlert isDarkMode={false} error={null} success={null} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders error message', () => {
    render(<FormAlert isDarkMode={false} error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders success message', () => {
    render(<FormAlert isDarkMode={false} success="Request submitted" />)
    expect(screen.getByText('Request submitted')).toBeInTheDocument()
  })

  it('prioritises error over success when both are provided', () => {
    render(
      <FormAlert isDarkMode={false} error="Error msg" success="Success msg" />
    )
    expect(screen.getByText('Error msg')).toBeInTheDocument()
    expect(screen.queryByText('Success msg')).not.toBeInTheDocument()
  })

  it('applies light-mode error styles', () => {
    render(<FormAlert isDarkMode={false} error="fail" />)
    const el = screen.getByText('fail')
    expect(el).toHaveClass('border-red-500/30')
    expect(el).toHaveClass('text-red-700')
    expect(el).toHaveClass('bg-red-50')
  })

  it('applies dark-mode error styles', () => {
    render(<FormAlert isDarkMode={true} error="fail" />)
    const el = screen.getByText('fail')
    expect(el).toHaveClass('border-red-500/40')
    expect(el).toHaveClass('text-red-200')
    expect(el).toHaveClass('bg-red-500/10')
  })

  it('applies light-mode success styles', () => {
    render(<FormAlert isDarkMode={false} success="ok" />)
    const el = screen.getByText('ok')
    expect(el).toHaveClass('border-emerald-500/25')
    expect(el).toHaveClass('text-emerald-700')
    expect(el).toHaveClass('bg-emerald-50')
  })

  it('applies dark-mode success styles', () => {
    render(<FormAlert isDarkMode={true} success="ok" />)
    const el = screen.getByText('ok')
    expect(el).toHaveClass('border-emerald-400/30')
    expect(el).toHaveClass('text-emerald-200')
    expect(el).toHaveClass('bg-emerald-400/10')
  })
})
