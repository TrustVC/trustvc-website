import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TextField from './TextField'

const defaultProps = {
  isDarkMode: false,
  id: 'test-input',
  label: 'Email',
  value: '',
  onChange: vi.fn(),
}

describe('TextField', () => {
  it('renders label and input', () => {
    render(<TextField {...defaultProps} />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('associates label with input via htmlFor', () => {
    render(<TextField {...defaultProps} />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('id', 'test-input')
  })

  it('renders with the correct value', () => {
    render(<TextField {...defaultProps} value="hello@test.com" />)
    expect(screen.getByLabelText('Email')).toHaveValue('hello@test.com')
  })

  it('calls onChange when the user types', () => {
    const onChange = vi.fn()
    render(<TextField {...defaultProps} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a' },
    })
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('renders placeholder text', () => {
    render(<TextField {...defaultProps} placeholder="you@example.com" />)
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
  })

  it('defaults input type to text', () => {
    render(<TextField {...defaultProps} />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'text')
  })

  it('accepts a custom input type', () => {
    render(<TextField {...defaultProps} type="email" />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
  })

  it('supports the required attribute', () => {
    render(<TextField {...defaultProps} required />)
    expect(screen.getByLabelText('Email')).toBeRequired()
  })

  it('applies light-mode styles', () => {
    render(<TextField {...defaultProps} isDarkMode={false} />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveClass('bg-white/70')
    expect(input).toHaveClass('border-black/10')
  })

  it('applies dark-mode styles', () => {
    render(<TextField {...defaultProps} isDarkMode={true} />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveClass('bg-transparent')
    expect(input).toHaveClass('border-white/10')
  })

  it('applies dark-mode label styles', () => {
    render(<TextField {...defaultProps} isDarkMode={true} />)
    const label = screen.getByText('Email')
    expect(label).toHaveClass('text-neutral-50')
  })

  it('applies light-mode label styles', () => {
    render(<TextField {...defaultProps} isDarkMode={false} />)
    const label = screen.getByText('Email')
    expect(label).toHaveClass('text-neutral-20')
  })
})
