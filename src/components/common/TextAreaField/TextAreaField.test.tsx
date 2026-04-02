import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TextAreaField from './TextAreaField'

const defaultProps = {
  isDarkMode: false,
  id: 'test-textarea',
  label: 'Description',
  value: '',
  onChange: vi.fn(),
}

describe('TextAreaField', () => {
  it('renders label and textarea', () => {
    render(<TextAreaField {...defaultProps} />)
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
  })

  it('associates label with textarea via htmlFor', () => {
    render(<TextAreaField {...defaultProps} />)
    const textarea = screen.getByLabelText('Description')
    expect(textarea).toHaveAttribute('id', 'test-textarea')
  })

  it('renders with the correct value', () => {
    render(<TextAreaField {...defaultProps} value="some text" />)
    expect(screen.getByLabelText('Description')).toHaveValue('some text')
  })

  it('calls onChange when the user types', () => {
    const onChange = vi.fn()
    render(<TextAreaField {...defaultProps} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'new' },
    })
    expect(onChange).toHaveBeenCalledWith('new')
  })

  it('renders placeholder text', () => {
    render(<TextAreaField {...defaultProps} placeholder="Enter details" />)
    expect(screen.getByPlaceholderText('Enter details')).toBeInTheDocument()
  })

  it('defaults rows to 4', () => {
    render(<TextAreaField {...defaultProps} />)
    expect(screen.getByLabelText('Description')).toHaveAttribute('rows', '4')
  })

  it('accepts a custom rows value', () => {
    render(<TextAreaField {...defaultProps} rows={8} />)
    expect(screen.getByLabelText('Description')).toHaveAttribute('rows', '8')
  })

  it('supports the required attribute', () => {
    render(<TextAreaField {...defaultProps} required />)
    expect(screen.getByLabelText('Description')).toBeRequired()
  })

  it('applies light-mode styles', () => {
    render(<TextAreaField {...defaultProps} isDarkMode={false} />)
    const textarea = screen.getByLabelText('Description')
    expect(textarea).toHaveClass('bg-white/70')
    expect(textarea).toHaveClass('border-black/10')
  })

  it('applies dark-mode styles', () => {
    render(<TextAreaField {...defaultProps} isDarkMode={true} />)
    const textarea = screen.getByLabelText('Description')
    expect(textarea).toHaveClass('bg-transparent')
    expect(textarea).toHaveClass('border-white/10')
  })

  it('applies dark-mode label styles', () => {
    render(<TextAreaField {...defaultProps} isDarkMode={true} />)
    const label = screen.getByText('Description')
    expect(label).toHaveClass('text-neutral-50')
  })

  it('applies light-mode label styles', () => {
    render(<TextAreaField {...defaultProps} isDarkMode={false} />)
    const label = screen.getByText('Description')
    expect(label).toHaveClass('text-neutral-20')
  })
})
