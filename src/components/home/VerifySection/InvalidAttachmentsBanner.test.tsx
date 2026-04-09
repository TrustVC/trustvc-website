import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import InvalidAttachmentsBanner from './InvalidAttachmentsBanner'

vi.mock('../../common/Icons', () => ({
  ExclamationCircle: () => <span data-testid="exclamation-circle" />,
  ChevronUp: () => <span data-testid="chevron-up" />,
  ChevronDown: () => <span data-testid="chevron-down" />,
}))

describe('InvalidAttachmentsBanner', () => {
  it('renders nothing when no invalid attachments', () => {
    const { container } = render(
      <InvalidAttachmentsBanner invalidAttachments={[]} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders banner with title when invalid attachments exist', () => {
    render(
      <InvalidAttachmentsBanner
        invalidAttachments={[
          { filename: 'bad.pdf', data: 'x', type: 'application/pdf' },
        ]}
      />
    )
    expect(screen.getByText('Unable To Load Attachment')).toBeTruthy()
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('starts collapsed with Show More button', () => {
    render(
      <InvalidAttachmentsBanner
        invalidAttachments={[
          { filename: 'bad.pdf', data: 'x', type: 'application/pdf' },
        ]}
      />
    )
    expect(screen.getByText('Show More')).toBeTruthy()
    expect(
      screen.queryByText(
        'There is a problem loading the following attachments:'
      )
    ).toBeNull()
  })

  it('expands on click to show attachment list', () => {
    render(
      <InvalidAttachmentsBanner
        invalidAttachments={[
          { filename: 'bad.pdf', data: 'x', type: 'application/pdf' },
          { filename: 'corrupt.png', data: 'y', type: 'image/png' },
        ]}
      />
    )
    fireEvent.click(screen.getByText('Show More'))
    expect(screen.getByText('Show Less')).toBeTruthy()
    expect(
      screen.getByText('There is a problem loading the following attachments:')
    ).toBeTruthy()
    expect(screen.getByText('bad.pdf')).toBeTruthy()
    expect(screen.getByText('corrupt.png')).toBeTruthy()
  })

  it('collapses on second click', () => {
    render(
      <InvalidAttachmentsBanner
        invalidAttachments={[
          { filename: 'bad.pdf', data: 'x', type: 'application/pdf' },
        ]}
      />
    )
    fireEvent.click(screen.getByText('Show More'))
    expect(screen.getByText('bad.pdf')).toBeTruthy()
    fireEvent.click(screen.getByText('Show Less'))
    expect(screen.queryByText('bad.pdf')).toBeNull()
    expect(screen.getByText('Show More')).toBeTruthy()
  })

  it('has aria-expanded attribute on toggle button', () => {
    render(
      <InvalidAttachmentsBanner
        invalidAttachments={[
          { filename: 'bad.pdf', data: 'x', type: 'application/pdf' },
        ]}
      />
    )
    const toggle = screen.getByText('Show More').closest('button')!
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
  })

  it('shows fallback name when filename is empty', () => {
    render(
      <InvalidAttachmentsBanner
        invalidAttachments={[
          { filename: '', data: 'x', type: 'application/pdf' },
        ]}
      />
    )
    fireEvent.click(screen.getByText('Show More'))
    expect(screen.getByText('Attachment 1')).toBeTruthy()
  })
})
