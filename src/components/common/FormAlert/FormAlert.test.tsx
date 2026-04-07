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
})
